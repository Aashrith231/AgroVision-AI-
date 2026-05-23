from io import BytesIO

import numpy as np
from PIL import Image, ImageOps
from tensorflow.keras.applications import (
    densenet,
    efficientnet,
    mobilenet_v2,
    resnet50,
    vgg16,
)


PREPROCESSORS = {
    "efficientnet": efficientnet.preprocess_input,
    "mobilenetv2": mobilenet_v2.preprocess_input,
    "resnet50": resnet50.preprocess_input,
    "vgg16": vgg16.preprocess_input,
    "densenet121": densenet.preprocess_input,
    "none": lambda x: x / 255.0,
    "raw": lambda x: x,
}


def preprocess_image(image_bytes: bytes, image_size: int, model_family: str) -> np.ndarray:
    image = Image.open(BytesIO(image_bytes))
    image = ImageOps.exif_transpose(image).convert("RGB")
    image = image.resize((image_size, image_size))
    array = np.asarray(image, dtype=np.float32)
    batch = np.expand_dims(array, axis=0)
    preprocessor = PREPROCESSORS.get(model_family.lower(), efficientnet.preprocess_input)
    return preprocessor(batch)
