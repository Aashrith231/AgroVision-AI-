import json
from pathlib import Path
from threading import Lock

import numpy as np
from tensorflow.keras.models import load_model

from api.config import get_settings
from inference.preprocess import preprocess_image


class PlantDiseasePredictor:
    def __init__(self) -> None:
        self.settings = get_settings()
        self._model = None
        self._class_names: list[str] = []
        self._lock = Lock()

    def load(self) -> None:
        with self._lock:
            if self._model is not None:
                return

            model_path = self.settings.resolve_path(self.settings.model_path)
            class_path = self.settings.resolve_path(self.settings.class_names_path)

            if not model_path.exists():
                raise FileNotFoundError(f"Model file not found: {model_path}")
            if not class_path.exists():
                raise FileNotFoundError(f"class_names.json not found: {class_path}")

            self._model = load_model(model_path, compile=False)
            self._class_names = self._read_class_names(class_path)

    def predict(self, image_bytes: bytes) -> dict:
        self.load()
        assert self._model is not None

        batch = preprocess_image(
            image_bytes=image_bytes,
            image_size=self.settings.image_size,
            model_family=self.settings.model_family,
        )
        raw = self._model.predict(batch, verbose=0)[0]
        probabilities = self._softmax_if_needed(raw)

        if len(probabilities) != len(self._class_names):
            raise ValueError(
                f"Model outputs {len(probabilities)} classes, but class_names.json has "
                f"{len(self._class_names)} labels. Update class_names.json to match training order."
            )

        top_indices = probabilities.argsort()[-3:][::-1]
        top_predictions = [
            {"label": self._class_names[index], "confidence": round(float(probabilities[index]), 4)}
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
            "disease": top_predictions[0]["label"],
            "confidence": confidence,
            "confidence_level": confidence_level,
            "warning": warning,
            "top_predictions": top_predictions,
        }

    def model_info(self) -> dict:
        model_path = self.settings.resolve_path(self.settings.model_path)
        class_path = self.settings.resolve_path(self.settings.class_names_path)
        class_names: list[str] = []
        class_error = None

        if class_path.exists():
            try:
                class_names = self._read_class_names(class_path)
            except Exception as exc:
                class_error = str(exc)

        return {
            "model_name": model_path.name,
            "model_family": self.settings.model_family,
            "image_size": self.settings.image_size,
            "model_file_found": model_path.exists(),
            "class_file_found": class_path.exists(),
            "class_count": len(class_names),
            "expected_classes": 36,
            "model_loaded": self._model is not None,
            "class_error": class_error,
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
