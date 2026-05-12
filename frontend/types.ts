export type PredictionItem = {
  label: string;
  confidence: number;
};

export type PredictionResponse = {
  disease: string;
  confidence: number;
  confidence_level: "high" | "medium" | "low";
  warning?: string | null;
  top_predictions: PredictionItem[];
};

export type GuidanceResponse = {
  disease: string;
  language: string;
  explanation: string;
  symptoms: string[];
  prevention: string[];
  treatment: string[];
  farmer_advice: string;
  source: string;
  provider_error?: string | null;
};

export type VoiceResponse = {
  audio_base64: string;
  mime_type: string;
  source: string;
};

export type WhatsAppResponse = {
  mode: string;
  sent: boolean;
  message: string;
  wa_link?: string | null;
  twilio_error?: string | null;
};

export type SeverityInput = {
  affectedLeaves: "few" | "many" | "most";
  spread: "no" | "slow" | "fast";
  fruitOrStem: "no" | "yes";
};

export type ScanRecord = {
  id: string;
  createdAt: string;
  imageDataUrl?: string;
  prediction: PredictionResponse;
  guidance: GuidanceResponse;
  severity?: {
    level: "Low" | "Medium" | "High";
    recommendation: string;
  };
};

export type FollowUpReminder = {
  id: string;
  disease: string;
  dueAt: string;
  note: string;
  done: boolean;
};

export type WeatherRisk = {
  temperature: number;
  humidity: number;
  rain: number;
  windSpeed: number;
  riskLevel: "Low" | "Medium" | "High";
  summary: string;
  tips: string[];
};
