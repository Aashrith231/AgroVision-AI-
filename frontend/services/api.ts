import axios from "axios";
import {
  GuidanceResponse,
  ModelInfoResponse,
  PredictionResponse,
  VoiceResponse,
  WhatsAppResponse
} from "../types";
import { Language } from "../i18n/translations";
import { saveApiDiagnostic } from "../utils/adminDiagnostics";

const api = axios.create({
  baseURL: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
  timeout: 120000
});

export class FarmerSafeApiError extends Error {
  constructor(
    message: string,
    public diagnostic?: {
      status?: number;
      method?: string;
      url?: string;
      detail?: string;
    }
  ) {
    super(message);
    this.name = "FarmerSafeApiError";
  }
}

function normalizeApiError(error: unknown, action: string): FarmerSafeApiError {
  const fallbackMessage = "Service is not reachable right now. Please try again in a moment.";
  let userMessage = fallbackMessage;
  let status: number | undefined;
  let method: string | undefined;
  let url: string | undefined;
  let detail = "Unknown error";

  if (axios.isAxiosError(error)) {
    status = error.response?.status;
    method = error.config?.method?.toUpperCase();
    url = error.config?.url;
    const responseDetail = error.response?.data?.detail || error.response?.data?.message || error.message;
    detail = typeof responseDetail === "string" ? responseDetail : JSON.stringify(responseDetail);

    if (!error.response) {
      userMessage = "Connection issue. Please check the backend link and try again.";
    } else if (status && status >= 500) {
      userMessage = "AI service is busy right now. Please try again shortly.";
    } else if (status === 413) {
      userMessage = "Image is too large. Please upload a smaller photo.";
    } else if (status === 400) {
      userMessage = "Please use a clear JPG or PNG leaf image.";
    }
  } else if (error instanceof Error) {
    detail = error.message;
  }

  const apiError = new FarmerSafeApiError(userMessage, { status, method, url, detail });
  saveApiDiagnostic({
    action,
    userMessage,
    apiBaseUrl: api.defaults.baseURL || "",
    status,
    method,
    url,
    detail,
  });
  return apiError;
}

export async function predictDisease(file: File): Promise<PredictionResponse> {
  try {
    const form = new FormData();
    form.append("file", file);
    const { data } = await api.post<PredictionResponse>("/predict", form, {
      headers: { "Content-Type": "multipart/form-data" }
    });
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Predict disease");
  }
}

export async function generateGuidance(disease: string, language: Language): Promise<GuidanceResponse> {
  try {
    const { data } = await api.post<GuidanceResponse>("/generate-guidance", { disease, language });
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Generate guidance");
  }
}

export async function generateVoice(payload: {
  disease: string;
  treatment: string[];
  prevention: string[];
  language: Language;
}): Promise<VoiceResponse> {
  try {
    const { data } = await api.post<VoiceResponse>("/voice", payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Generate voice");
  }
}

export async function sendWhatsApp(payload: {
  phone?: string;
  disease: string;
  confidence: number;
  treatment: string[];
  prevention: string[];
  language: Language;
}): Promise<WhatsAppResponse> {
  try {
    const { data } = await api.post<WhatsAppResponse>("/send-whatsapp", payload);
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Send WhatsApp");
  }
}

export async function getHealth(): Promise<{ status: string }> {
  try {
    const { data } = await api.get<{ status: string }>("/health", { timeout: 12000 });
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Health check");
  }
}

export async function getModelInfo(): Promise<ModelInfoResponse> {
  try {
    const { data } = await api.get<ModelInfoResponse>("/model-info", { timeout: 12000 });
    return data;
  } catch (error) {
    throw normalizeApiError(error, "Load model info");
  }
}

export function getApiBaseUrl() {
  return api.defaults.baseURL || "";
}
