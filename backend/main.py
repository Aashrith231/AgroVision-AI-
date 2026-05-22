from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.config import get_settings
from routes import guidance, health, predict, voice, whatsapp

settings = get_settings()

app = FastAPI(title=settings.app_name, version="1.0.0")

allow_all_origins = settings.environment == "development" or settings.allow_all_origins

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"] if allow_all_origins else settings.cors_origins,
    allow_credentials=False if allow_all_origins else True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router)
app.include_router(predict.router)
app.include_router(guidance.router)
app.include_router(voice.router)
app.include_router(whatsapp.router)


@app.get("/")
def root() -> dict:
    return {"name": settings.app_name, "docs": "/docs"}

