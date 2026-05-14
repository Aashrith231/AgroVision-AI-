# Start / Stop AgroVision AI

## Start For Deployed Demo

### 1. Check Ollama

```powershell
ollama list
```

If this works, Ollama is already running.

### 2. Start Backend

Open PowerShell:

```powershell
cd "C:\Users\Ashrith\Desktop\ai plant disease\backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8001
```

Keep this terminal open.

### 3. Start ngrok

Open another PowerShell:

```powershell
cd "C:\Users\Ashrith\Downloads\ngrok-v3-stable-windows-amd64"
.\ngrok.exe http 8001
```

Keep this terminal open.

Copy the HTTPS `Forwarding` URL and use it in Vercel as:

```env
NEXT_PUBLIC_API_BASE_URL=https://your-ngrok-url.ngrok-free.app
```

Redeploy Vercel if the ngrok URL changed.

## Start Local Frontend

Only needed if testing locally:

```powershell
cd "C:\Users\Ashrith\Desktop\ai plant disease\frontend"
npm run dev -- --hostname 0.0.0.0 --port 3000
```

Open:

```text
http://localhost:3000
```

## Stop

In the backend terminal:

```text
Ctrl + C
```

In the ngrok terminal:

```text
Ctrl + C
```

In the frontend terminal, if running:

```text
Ctrl + C
```

Ollama can stay running. To force stop it:

```powershell
taskkill /IM ollama.exe /F
```

## If Port 8001 Is Already In Use

```powershell
netstat -ano | findstr ":8001"
```

Find the `LISTENING` PID, then:

```powershell
taskkill /PID PID_NUMBER /F
```

Then start the backend again.
