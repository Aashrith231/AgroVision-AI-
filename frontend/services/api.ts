import axios from "axios";
import { GuidanceResponse, PredictionResponse, VoiceResponse, WhatsAppResponse } from "../types";
import { Language } from "../i18n/translations";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 120000
});

export async function predictDisease(file: File): Promise<PredictionResponse> {
  const form = new FormData();
  form.append("file", file);
  const { data } = await api.post<PredictionResponse>("/predict", form, {
    headers: { "Content-Type": "multipart/form-data" }
  });
  return data;
}

export async function generateGuidance(disease: string, language: Language): Promise<GuidanceResponse> {
  const { data } = await api.post<GuidanceResponse>("/generate-guidance", { disease, language });
  return data;
}

export async function generateVoice(payload: {
  disease: string;
  treatment: string[];
  prevention: string[];
  language: Language;
}): Promise<VoiceResponse> {
  const { data } = await api.post<VoiceResponse>("/voice", payload);
  return data;
}

export async function sendWhatsApp(payload: {
  phone?: string;
  disease: string;
  confidence: number;
  treatment: string[];
  prevention: string[];
  language: Language;
}): Promise<WhatsAppResponse> {
  const { data } = await api.post<WhatsAppResponse>("/send-whatsapp", payload);
  return data;
}
