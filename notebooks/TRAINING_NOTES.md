# AgroVision AI Training Notes

Use `AgroVision_Combined_Plant_Disease_Training.ipynb` in Google Colab to train a new combined crop + medicinal plant disease model.

The notebook file is stored as JSON, so if you open it in a text editor you will see `\n` line-break markers. This is normal for `.ipynb` files. Open it in Google Colab or Jupyter Notebook to see formatted notebook cells.

## Recommended Approach

Train a **combined model** when the medicinal plant dataset is reasonably strong:

```text
old crop disease dataset + medicinal plant disease dataset -> one combined model
```

This keeps the app simple because the backend loads one model and one `class_names.json`.

## Model Choice

The notebook uses **EfficientNetV2B0 + ECA attention** by default.

Why:

- strong transfer learning performance for plant leaf images
- lighter than very large models
- practical on Colab T4 GPU
- deployable as `.h5`
- ECA helps the classifier focus on useful disease feature channels such as spots, mildew texture, rust color, and leaf damage patterns

ECA is an experiment. Keep it if validation accuracy and confusion matrix improve compared with the same model without ECA.

If you have Colab Pro or enough GPU memory, try:

```python
MODEL_NAME = "efficientnetv2b3"
```

## Dataset Format

Use one folder per class:

```text
dataset_combined/
  Tomato___Early_blight/
  Tomato___healthy/
  MedicinalPlant___DiseaseName/
  MedicinalPlant___healthy/
  Background_without_leaves/
```

Keep class names consistent and avoid spaces where possible.

## Backend Settings After Training

After copying the trained model into `models/`, update backend `.env`:

```env
MODEL_PATH=../models/efficientnetv2b0_combined.h5
CLASS_NAMES_PATH=../models/class_names_combined.json
MODEL_FAMILY=none
IMAGE_SIZE=224
```

`MODEL_FAMILY=none` is recommended because the notebook saves EfficientNetV2 with preprocessing inside the model.

## Important

Do not overwrite the current working model until the new model is tested. Keep both:

```text
EfficientNetB0.h5
efficientnetv2b0_combined.h5
```
