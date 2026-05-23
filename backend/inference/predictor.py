import json
from dataclasses import dataclass
from pathlib import Path
from threading import Lock

import numpy as np
from tensorflow.keras.models import load_model

from api.config import get_settings
from inference.preprocess import preprocess_image


@dataclass(frozen=True)
class ModelRuntimeConfig:
    mode: str
    label: str
    model_path: str
    class_names_path: str
    model_family: str


class PlantDiseasePredictor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._models: dict[str, object] = {}
        self._class_names: dict[str, list[str]] = {}
        self._lock = Lock()

    def _model_config(self, mode: str) -> ModelRuntimeConfig:
        if mode == "medicinal":
            return ModelRuntimeConfig(
                mode="medicinal",
                label="Medicinal plant disease",
                model_path=self.settings.medicinal_model_path,
                class_names_path=self.settings.medicinal_class_names_path,
                model_family=self.settings.medicinal_model_family,
            )

        return ModelRuntimeConfig(
            mode="crop",
            label="Normal crop disease",
            model_path=self.settings.model_path,
            class_names_path=self.settings.class_names_path,
            model_family=self.settings.model_family,
        )

    def load(self, mode: str = "crop") -> None:
        config = self._model_config(mode)
        with self._lock:
            if config.mode in self._models:
                return

            model_path = self.settings.resolve_path(config.model_path)
            class_path = self.settings.resolve_path(config.class_names_path)

            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            if not class_path.exists():
                raise FileNotFoundError(f"class_names.json not found: {class_path}")

            self._models[config.mode] = load_model(model_path, compile=False)
            self._class_names[config.mode] = self._read_class_names(class_path)

    def predict(self, image_bytes: bytes, mode: str = "crop") -> dict:
        config = self._model_config(mode)
        self.load(config.mode)
        model = self._models[config.mode]
        class_names = self._class_names[config.mode]

        batch = preprocess_image(
            image_bytes=image_bytes,
            image_size=self.settings.image_size,
            model_family=config.model_family,
        )
        raw = model.predict(batch, verbose=0)[0]
        probabilities = self._softmax_if_needed(raw)

        if len(probabilities) != len(class_names):
            raise ValueError(
                f"Model outputs {len(probabilities)} classes, but class_names.json has "
                f"{len(class_names)} labels. Update class_names.json to match training order."
            )

        top_indices = probabilities.argsort()[-3:][::-1]
        top_predictions = [
            {"label": class_names[index], "confidence": round(float(probabilities[index]), 4)}
            for index in top_indices
        ]
        confidence = top_predictions[0]["confidence"]

        warning = None
        confidence_level = "high"
        if confidence < 0.4:
            confidence_level = "low"
            warning = "This plant or disease may not exist in our trained dataset."
        elif confidence < 0.7:
            confidence_level = "medium"
            warning = "Prediction uncertain. Please verify manually."

        return {
            "model_mode": config.mode,
            "disease": top_predictions[0]["label"],
            "confidence": confidence,
            "confidence_level": confidence_level,
            "warning": warning,
            "top_predictions": top_predictions,
        }

    def _single_model_info(self, mode: str) -> dict:
        config = self._model_config(mode)
        model_path = self.settings.resolve_path(config.model_path)
        class_path = self.settings.resolve_path(config.class_names_path)
        class_names: list[str] = []
        class_error = None

        if class_path.exists():
            try:
                class_names = self._read_class_names(class_path)
            except Exception as exc:
                class_error = str(exc)

        return {
            "mode": config.mode,
            "label": config.label,
            "model_name": model_path.name,
            "model_family": config.model_family,
            "image_size": self.settings.image_size,
            "model_file_found": model_path.exists(),
            "class_file_found": class_path.exists(),
            "class_count": len(class_names),
            "expected_classes": 13 if config.mode == "medicinal" else 36,
            "model_loaded": config.mode in self._models,
            "class_error": class_error,
        }

    def model_info(self) -> dict:
        crop_info = self._single_model_info("crop")
        medicinal_info = self._single_model_info("medicinal")
        return {
            **crop_info,
            "available_modes": [crop_info, medicinal_info],
        }

    @staticmethod
    def _read_class_names(path: Path) -> list[str]:
        data = json.loads(path.read_text(encoding="utf-8"))
        if isinstance(data, dict):
            if "class_names" in data:
                return list(data["class_names"])
            return [name for _, name in sorted(data.items(), key=lambda item: int(item[0]))]
        return list(data)

    @staticmethod
    def _softmax_if_needed(values: np.ndarray) -> np.ndarray:
        values = values.astype(np.float64)
        if np.all(values >= 0) and np.isclose(values.sum(), 1.0, atol=1e-3):
            return values
        shifted = values - np.max(values)
        exp = np.exp(shifted)
        return exp / exp.sum()


predictor = PlantDiseasePredictor()
