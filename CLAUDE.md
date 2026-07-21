# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Overview

**RootSage AI** is an AI-powered farmer assistance platform for plant disease detection. It combines a Next.js frontend with a FastAPI backend that runs pre-trained CNN models for disease classification and uses LLM providers (Gemini, Groq, NVIDIA, Ollama) with a local dictionary fallback for guidance generation.

The app targets multiple crops (Apple, Potato, Tomato, Corn, Grape, etc.) with 36 disease classes + a medicinal plant variant (13 classes), and supports English, Hindi, and Telugu languages.

## Commands

### Frontend (Next.js)
**Directory**: `frontend/`  
**Setup**: `cd frontend && npm install` (already installed)

```bash
npm run dev       # Start dev server (localhost:3000)
npm run build     # Build for production
npm run start     # Start production server
npm run lint      # Run ESLint
```

### Backend (FastAPI)
**Directory**: `backend/`  
**Setup**: `python -m venv .venv`, activate, `pip install -r requirements.txt`

```bash
# Development (watches for changes)
python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload

# Production
python -m uvicorn main:app --host 0.0.0.0 --port 8000

# Local demo (with ngrok)
python -m uvicorn main:app --host 0.0.0.0 --port 8001
# Then in another terminal: ngrok http 8001
```

**Environment**: Copy `server.env.example` to `.env` and set:
- `ENVIRONMENT` (development/production)
- LLM API keys: `GEMINI_API_KEY`, `GROQ_API_KEY`, `NVIDIA_API_KEY`, `ELEVENLABS_API_KEY`
- Optional: `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `OLLAMA_API_BASE` (for local Ollama)

## Architecture

### Tech Stack
- **Frontend**: Next.js 14, React 18, Tailwind CSS, Framer Motion, Axios
- **Backend**: FastAPI, Uvicorn, TensorFlow/Keras, Pillow, OpenCV
- **Models**: 6 CNN models (EfficientNetB0 primary, MobileNetV2/DenseNet121/ResNet50/VG16 alternatives) + medicinal model
- **AI Services**: Gemini (primary) → Groq → NVIDIA NIM DeepSeek → Ollama (local) → Local disease dictionary
- **Integrations**: Open-Meteo weather API, ElevenLabs + gTTS voice, Twilio WhatsApp, `wa.me` links

### Directory Structure
```
backend/
  api/config.py              # Pydantic Settings, environment vars, model paths
  inference/
    predictor.py             # CNN model loader & inference
    preprocess.py            # Image normalization (EXIF, resize to 224×224, scaling)
  models/schemas.py          # Pydantic request/response validators
  routes/
    predict.py               # POST /predict → runs image classification
    guidance.py              # POST /generate-guidance → LLM chain
    progress.py              # POST /progress-report → compares scans over time
    health.py                # GET /health, GET /model-info diagnostics
    voice.py                 # POST /voice → ElevenLabs/gTTS TTS
    whatsapp.py              # POST /send-whatsapp → Twilio/wa.me link
  services/
    gemini_service.py        # Gemini API + fallback router
    groq_service.py          # Groq Llama-3.1
    nvidia_service.py        # NVIDIA NIM DeepSeek
    ollama_service.py        # Local Ollama
    local_disease_dictionary.py  # Offline safety net
    progress_service.py      # LLM-based progress analysis
    voice_service.py         # ElevenLabs/gTTS wrapper
    whatsapp_service.py      # Twilio + wa.me builder
  main.py                    # FastAPI app, CORS config, router includes

frontend/
  components/
    ImageUploader.tsx        # Drag-drop, camera capture, image quality checks
    ResultsPanel.tsx         # Disease results + confidence display
    InfoSections.tsx         # Tabbed AI guidance (symptoms, treatment, etc.)
    WeatherRiskCard.tsx      # Open-Meteo risk assessment + geolocation
  pages/
    index.tsx                # Main diagnosis page
    disease/[name].tsx       # Dynamic disease library detail page
    history.tsx              # Local scan history (localStorage)
    progress.tsx             # Scan progress tracker & comparison tool
    library.tsx              # Disease knowledge index
    admin.tsx                # API logs & diagnostics
  services/
    api.ts                   # Axios client, endpoints, multipart file upload
    weather.ts               # Open-Meteo client-side fetcher
  utils/
    imageQuality.ts          # Canvas-based brightness & sharpness checks
    progressAnalysis.ts      # Client-side scan comparison heuristics
    storage.ts               # localStorage wrappers

models/
  EfficientNetB0.h5          # Primary crop model (36 classes)
  MobileNetV2.h5, DenseNet121.h5, ResNet50.h5, VG16.h5 (alternatives)
  medicinal_disease_recognition_model.h5 (13 classes, separate mode)
  class_names.json           # Crop model output labels
  medicinal_disease_recognition_model_classes.json
```

### Key Workflows

**1. Disease Prediction**
```
Image Upload → Client-side quality check (brightness, sharpness, blur detection)
            → POST /predict with multipart file
            → Backend: preprocess (EXIF transpose, resize 224×224, normalize)
            → CNN inference (Keras model)
            → Return [top-3 predictions + confidence scores]
```

**2. Guidance Generation (Fallback Chain)**
```
If confidence < 40%: flag "Low Confidence"
POST /generate-guidance with disease + crop + language
  → Try Gemini API (gemini-2.0-flash)
  → Fallback to Groq (llama-3.1-8b-instant) if Gemini fails
  → Fallback to NVIDIA DeepSeek if Groq fails
  → Fallback to Ollama local (qwen2.5-coder:7b) if no API available
  → Fallback to local disease_dictionary.py (static JSON)
  → Return [symptoms, prevention, treatment, advice, severity, weather_risk, follow_up]
```

**3. Disease Progress Tracking**
```
User selects 2 historical scans (different dates)
Client-side heuristics: compare disease labels
  → Disease → Healthy = "Improving"
  → Healthy → Disease = "Worsening"  
  → Same Disease = "Stable" (with confidence disclaimer)
POST /progress-report with scan data + language
  → LLM generates contextual text summary
  → Return comparison report
```

**4. Weather Risk Assessment**
```
Frontend geolocation → coordinates
Open-Meteo API → humidity, rain, wind speed
Risk scoring:
  humidity ≥ 80% → fungal risk
  rain > 0 mm → warning against spraying
  wind ≥ 18 km/h → spray drift warning
```

## Important Constraints & Rules

### 1. Model Confidence ≠ Disease Severity
**Critical**: The CNN confidence score is a *mathematical indicator of pattern matching*, NOT a disease severity measurement. Always include disclaimers when displaying confidence or using it in comparisons. Never interpret confidence as "50% severe" or similar.

### 2. Zero-Database Design
All user data (scan history, reminders, progress comparisons) is stored in browser `localStorage`. No remote database. Avoid adding SQL/NoSQL unless explicitly requested; maintain user anonymity.

### 3. Supported Classes
- **Crop Mode (36 classes)**: Apple, Blueberry, Cherry, Corn, Grape, Orange, Peach, Pepper (Bell), Potato, Raspberry, Soybean, Squash, Strawberry, Tomato, + diseases per crop + background (non-leaf)
- **Medicinal Mode (13 classes)**: Separate model loaded based on user selection

### 4. Image Preprocessing
- EXIF orientation is corrected client-side (ImageUploader) *and* must be corrected server-side in `preprocess.py` (non-double-processing rule: only normalize, don't re-compress or re-rotate)
- All images resized to 224×224 before inference
- Model-specific scaling: EfficientNetB0 uses `[-1, 1]` normalization

### 5. CORS & Environment Modes
- In `development` mode or with `ALLOW_ALL_ORIGINS=true`, CORS allows `*`
- In `production`, explicitly set `CORS_ORIGINS` in `.env`

### 6. File Upload Limits
- Backend enforces `MAX_UPLOAD_MB=8` (8 MB limit per image, configurable in `api/config.py`)
- Nginx reverse proxy should set `client_max_body_size 8M;` to match

## Common Development Tasks

**Running the full stack locally**:
1. Terminal 1: `cd frontend && npm run dev` (port 3000)
2. Terminal 2: `cd backend && python -m uvicorn main:app --host 0.0.0.0 --port 8001 --reload`
3. Set `NEXT_PUBLIC_API_BASE_URL=http://localhost:8001` in `frontend/.env.local`

**Testing an endpoint**:
- Backend OpenAPI docs: `http://localhost:8001/docs` (interactive Swagger UI)
- Example POST: `curl -X POST http://localhost:8001/health`

**Debugging image preprocessing**:
- Log pixel values in `backend/inference/preprocess.py`
- Compare against model training notebook (`notebooks/RootSage_Combined_Plant_Disease_Training.ipynb`)

**Adding a new LLM provider**:
- Create `backend/services/mynew_service.py` with `async def get_guidance(...)`
- Update `gemini_service.py` fallback chain in `generate_guidance_with_fallback()`
- Add env var to `api/config.py`

## Deployment

- **Vercel**: Frontend, environment variable `NEXT_PUBLIC_API_BASE_URL` points to backend
- **Local/College Server**: Backend runs via systemd service (see `PROJECT_ARCHITECTURE.md` section 🚀)
- **Demo Mode**: ngrok tunnel exposes local backend port 8001 to Vercel frontend

See `DEPLOYMENT.md` for local setup and `COLLEGE_SERVER_DEPLOYMENT.md` for production server instructions.
