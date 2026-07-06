# Report screenshots — what goes where

Save each image in **this folder** using the exact filename below.  
Then open `PROJECT_REPORT.md` and preview with `Ctrl + Shift + V` — images appear automatically.

---

## Phase 1 — Research (Section 4 in report)

| Save as this filename | What to screenshot |
|------------------------|-------------------|
| `phase1-bar-chart-accuracy.png` | Bar chart: accuracy / F1 / balanced accuracy for all 5 models |
| `phase1-accuracy-vs-time.png` | Accuracy vs training time plot |
| `phase1-training-curves.png` | Training/validation accuracy or loss curves |
| `phase1-confusion-matrix-resnet50.png` | Confusion matrix for ResNet50 |
| `phase1-gradcam-correct.png` | Grad-CAM heatmap on a correct prediction |
| `phase1-gradcam-incorrect.png` | Grad-CAM on wrong/uncertain case (optional) |
| `phase1-streamlit-demo.png` | Old Streamlit app screenshot (optional) |

**Source:** `Comparative_Study_CNN_refactored.ipynb`, `gradcam_saved_weights.py` outputs

**Note:** The numeric tables (99.04% accuracy, etc.) are already written in the report — you only need **graphs and visual outputs**, not screenshots of the tables.

---

## Phase 2 — Application (Section 5 in report)

| Save as this filename | What to screenshot |
|------------------------|-------------------|
| `phase2-progress-tracker.png` | Progress page — Improving / Stable / Worsening status |
| `phase2-home.png` | Home page with upload and model mode |
| `phase2-results.png` | Results after diagnosis + AI guidance |
| `phase2-library.png` | Disease library page |
| `phase2-history.png` | Scan history page |
| `phase2-weather.png` | Weather risk card |
| `phase2-multilingual.png` | App in Hindi or Telugu (optional) |
| `phase2-whatsapp-voice.png` | WhatsApp or voice button (optional) |

**Source:** Live app at your Vercel URL, or run `npm run dev` in `frontend/`

---

## Minimum set for submission

If you are short on time, include at least:

**Phase 1:** bar chart, confusion matrix, one Grad-CAM image  
**Phase 2:** home, results, progress tracker, library
