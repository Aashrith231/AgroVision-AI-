# College Server Deployment

This deployment keeps the Vercel frontend and moves the backend, CNN model files, and optional Ollama/Qwen guidance to the college server.

```text
Vercel frontend
  -> College server backend
  -> TensorFlow/Keras CNN model
  -> Gemini, NVIDIA DeepSeek, Ollama/Qwen, or local guidance fallback
```

## Required Server Access

- Ubuntu/Linux server access through SSH
- Python 3.11
- `pip`, `venv`, `git`, `curl`
- Optional but recommended: `nginx` for a stable public URL
- Optional for local LLM: Ollama installed on the server
- Enough RAM for TensorFlow and Qwen. 16 GB RAM is preferred if Ollama/Qwen runs on the same server.

## Production Limits

- Uploads are limited by `MAX_UPLOAD_MB` in the backend environment. Current default: `8 MB`.
- Only JPG and PNG leaf images are accepted by the prediction endpoint.
- `FRONTEND_ORIGINS` should only include the deployed Vercel URL in production.
- Keep `ALLOW_ALL_ORIGINS=false` on the server.
- Scan history, reminders, and progress tracker records are stored in browser localStorage, not a server database.
- Confidence score is model certainty only. It must not be presented as disease severity.
- The app is for guidance and demonstration. Farmers should verify severe symptoms with a local agriculture expert.

## Files To Place On Server

Upload or clone the project, then make sure these model files exist:

```text
models/EfficientNetB0.h5
models/class_names.json
models/medicinal_disease_recognition_model.h5
models/medicinal_disease_recognition_model_classes.json
```

Do not commit secrets or `.env` files to GitHub.

## Backend Setup

```bash
cd ~/RootSage/backend
python3.11 -m venv .venv
source .venv/bin/activate
pip install -r requirements.txt
cp server.env.example .env
nano .env
```

In `.env`, set:

- `ENVIRONMENT=production`
- `FRONTEND_ORIGINS=https://agro-vision-ai-ochre.vercel.app`
- `ALLOW_ALL_ORIGINS=false`
- `ADMIN_TOKEN` to a long random secret
- Keep `GEMINI_API_KEY` blank if using only Ollama/Qwen
- Set `NVIDIA_API_KEY` only if using NVIDIA Build/NIM DeepSeek fallback

Run backend for testing:

```bash
uvicorn main:app --host 0.0.0.0 --port 8000
```

Health check:

```text
http://SERVER_IP:8000/health
```

## Ollama/Qwen Setup

Only do this if the server will run local LLM guidance.

```bash
curl -fsSL https://ollama.com/install.sh | sh
ollama pull qwen2.5-coder:7b
ollama list
```

The backend expects Ollama at:

```text
http://127.0.0.1:11434
```

If Ollama is not available, set:

```env
OLLAMA_ENABLED=false
```

The backend will still use local disease guidance fallback.

## NVIDIA DeepSeek Fallback

If Gemini is unavailable but the server has internet access, you can use NVIDIA Build/NIM as the next guidance provider.

```env
NVIDIA_API_KEY=your-nvidia-build-api-key
NVIDIA_BASE_URL=https://integrate.api.nvidia.com/v1
NVIDIA_MODEL=deepseek-ai/deepseek-v4-flash
NVIDIA_TIMEOUT_SECONDS=60
```

Guidance fallback order:

```text
Gemini
  -> NVIDIA DeepSeek V4 Flash
  -> Ollama/Qwen
  -> Local disease guidance dictionary
```

## Keep Backend Running

Create a systemd service:

```bash
sudo nano /etc/systemd/system/RootSage-backend.service
```

Example:

```ini
[Unit]
Description=RootSage FastAPI Backend
After=network.target

[Service]
User=ubuntu
WorkingDirectory=/home/ubuntu/RootSage/backend
Environment="PATH=/home/ubuntu/RootSage/backend/.venv/bin"
ExecStart=/home/ubuntu/RootSage/backend/.venv/bin/uvicorn main:app --host 127.0.0.1 --port 8000
Restart=always

[Install]
WantedBy=multi-user.target
```

Start it:

```bash
sudo systemctl daemon-reload
sudo systemctl enable RootSage-backend
sudo systemctl start RootSage-backend
sudo systemctl status RootSage-backend
```

## Nginx Reverse Proxy

Use Nginx so Vercel can call a stable backend URL.

```nginx
server {
    listen 80;
    server_name YOUR_SERVER_DOMAIN_OR_IP;

    client_max_body_size 8M;

    location / {
        proxy_pass http://127.0.0.1:8000;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

If possible, enable HTTPS using the college domain or certificate system.

## Vercel Frontend Change

In Vercel project settings, set:

```text
NEXT_PUBLIC_API_BASE_URL=https://YOUR_COLLEGE_SERVER_URL
```

Then redeploy the frontend.

## Final Test

Check these from a phone or laptop:

- `GET /health` returns `{"status":"ok"}`
- Upload a JPG/PNG leaf image
- Prediction returns disease and top predictions
- Guidance works from Gemini, Ollama/Qwen, or local fallback
- Progress tracker can compare a previous scan with a new scan
