# RootSage AI

RootSage AI is an AI-powered farmer assistance platform for plant disease detection. It helps farmers identify plant leaf diseases from images and provides practical guidance for symptoms, prevention, treatment, severity, weather risk, and follow-up care.

## Overview

Farmers can upload or capture a plant leaf image from mobile or desktop. The backend uses a trained CNN model to predict the disease, returns confidence scores, and provides top-3 predictions. The app then generates farmer-friendly guidance using AI providers and fallback systems.

The goal is to make disease detection more accessible, understandable, and actionable for farmers.

## about this project 

- Built this in the second year of my college to improve myself in webdev and learn more about machine learning models , and was also motivated to make an app for farmers .

## Core Features

- Leaf image upload and mobile camera capture
- CNN-based plant disease prediction
- Confidence score and top-3 predictions
- Farmer-friendly AI guidance
- Symptoms, prevention, and treatment suggestions
- Voice explanation support
- WhatsApp result sharing
- English, Hindi, and Telugu language support
- Local weather risk analysis
- Disease severity checker
- Disease progress tracker
- Scan history
- Follow-up reminders
- Disease library for all trained classes
- Detailed disease information pages

## AI Workflow

```text
Leaf image
   ↓
Image preprocessing
   ↓
CNN model prediction
   ↓
Disease + confidence + top-3 predictions
   ↓
AI guidance generation
   ↓
Treatment, prevention, symptoms, voice, WhatsApp sharing
```

## Guidance System

RootSage AI uses a fallback-based guidance system:

```text
Gemini API
   ↓ if unavailable
Groq API
   ↓ if unavailable
NVIDIA DeepSeek V4 Flash API
   ↓ if unavailable
Local Ollama model
   ↓ if unavailable
Local disease guidance dictionary
```

This allows the app to continue working even when an online AI provider is unavailable.

## Tech Stack

**Frontend**

- Next.js
- React
- Tailwind CSS
- Framer Motion

**Backend**

- FastAPI
- TensorFlow / Keras
- Python

**AI and Integrations**

- Trained CNN `.h5` models
- Gemini API
- Groq API
- NVIDIA DeepSeek V4 Flash API
- Ollama local LLM
- ElevenLabs / gTTS voice generation
- Twilio WhatsApp / `wa.me` fallback
- Open-Meteo weather API

## App Sections

- Home and diagnosis page
- Disease prediction results
- AI guidance panel
- Disease detail page
- Disease library
- Scan history
- Weather risk panel
- Follow-up reminder section


## Deployment

The frontend is deployed on Vercel. During demo mode, the FastAPI backend can run on a laptop and connect through ngrok. For a stable college deployment, the backend, trained CNN model files, and optional Ollama/Qwen local LLM should run on the college server.

Demo deployment flow:

```text
Vercel Frontend
    ↓
ngrok HTTPS Tunnel
    ↓
Local FastAPI Backend
    ↓
CNN Model + Ollama/Gemini Guidance
```

College server deployment flow:

```text
Vercel Frontend
    ↓
College Server Backend URL
    ↓
FastAPI Backend
    ↓
CNN Model + Ollama/Qwen or Guidance Fallback
```

See `COLLEGE_SERVER_DEPLOYMENT.md` for server setup, environment variables, limitations, and deployment checks.


## Notes

- The app uses already trained CNN models and does not train models again.
- Scan history and reminders are stored locally in the browser.
- AI predictions should be verified with real field symptoms before treatment.
- Severe crop infections should be checked with a local agriculture expert.


