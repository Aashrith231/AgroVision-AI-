export type ModelMode = "crop" | "medicinal";

export type PredictionItem = {
  label: string;
  confidence: number;
};

export type PredictionResponse = {
  model_mode?: ModelMode;
  disease: string;
  confidence: number;
  confidence_level: "high" | "medium" | "low";
  warning?: string | null;
  top_predictions: PredictionItem[];
  leaf_detected?: boolean;
  affected_area_percentage?: number;
  color_severity?: string;
  overlay_image?: string;
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
  twilio_sid?: string | null;
  twilio_status?: string | null;
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

export type ProgressStatus = "Improving" | "Stable" | "Worsening" | "Inconclusive";

export type ProgressRecord = {
  id: string;
  createdAt: string;
  previousScan: ScanRecord;
  currentScan: ScanRecord;
  status: ProgressStatus;
  summary: string;
  nextSteps: string[];
  source: string;
};

export type ProgressReportRequest = {
  previous: {
    disease: string;
    confidence: number;
    confidence_level?: string | null;
    model_mode?: ModelMode | null;
    scan_date?: string | null;
    guidance_summary?: string | null;
    disease_summary?: string | null;
    affected_area_percentage?: number | null;
    color_severity?: string | null;
    leaf_detected?: boolean | null;
  };
  current: {
    disease: string;
    confidence: number;
    confidence_level?: string | null;
    model_mode?: ModelMode | null;
    scan_date?: string | null;
    guidance_summary?: string | null;
    disease_summary?: string | null;
    affected_area_percentage?: number | null;
    color_severity?: string | null;
    leaf_detected?: boolean | null;
  };
  status: ProgressStatus;
  rule_summary: string;
  language: string;
};

export type ProgressReportResponse = {
  status: ProgressStatus;
  summary: string;
  next_steps: string[];
  source: string;
  provider_error?: string | null;
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

export type ApiDiagnostic = {
  id: string;
  createdAt: string;
  action: string;
  userMessage: string;
  apiBaseUrl: string;
  status?: number;
  method?: string;
  url?: string;
  detail?: string;
};

export type ImageQuality = {
  status: "good" | "warning" | "bad";
  sharpness: number;
  brightness: number;
  message: string;
  tips: string[];
};

export type ModelRuntimeInfo = {
    mode?: ModelMode;
    label?: string;
    model_name: string;
    model_family: string;
    image_size: number;
    model_file_found: boolean;
    class_file_found: boolean;
    class_count: number;
    expected_classes: number;
    model_loaded: boolean;
    class_error?: string | null;
};

export type ModelInfoResponse = {
  app_name: string;
  environment: string;
  model: ModelRuntimeInfo;
  available_modes?: ModelRuntimeInfo[];
  providers: {
    gemini_configured: boolean;
    nvidia_configured?: boolean;
    nvidia_model?: string | null;
    ollama_enabled: boolean;
    ollama_model?: string | null;
    elevenlabs_configured: boolean;
    twilio_configured: boolean;
  };
  runtime: {
    max_upload_mb: number;
    cors_mode: string;
  };
};
