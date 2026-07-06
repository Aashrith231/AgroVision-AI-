import Head from "next/head";
import { useRouter } from "next/router";
import { useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Hero } from "../components/Hero";
import { ImageUploader } from "../components/ImageUploader";
import { InfoSections } from "../components/InfoSections";
import { ResultsPanel } from "../components/ResultsPanel";
import { WeatherRiskCard } from "../components/WeatherRiskCard";
import { Language } from "../i18n/translations";
import { useTranslation } from "../hooks/useTranslation";
import { generateGuidance, generateVoice, predictDisease, sendWhatsApp } from "../services/api";
import { GuidanceResponse, ImageQuality, ModelMode, PredictionResponse } from "../types";
import { saveApiDiagnostic } from "../utils/adminDiagnostics";
import { diseaseToSlug } from "../utils/disease";
import { analyzeImageQuality } from "../utils/imageQuality";
import { fileToDataUrl, saveDiseaseHandoff, saveScanRecord } from "../utils/storage";

function normalizeWhatsAppPhone(value: string) {
  const cleaned = value.trim().replace(/[\s\-()]/g, "").replace(/^whatsapp:/, "");
  const digits = cleaned.replace(/^\+/, "");
  return digits && /^\d+$/.test(digits) ? digits : "";
}

function buildWhatsAppShareLink(phone: string, disease: string, confidence: number, treatment: string[], prevention: string[]) {
  const treatmentText = treatment.slice(0, 4).map((item) => `- ${item}`).join("\n") || "- Verify symptoms before treatment.";
  const preventionText = prevention.slice(0, 4).map((item) => `- ${item}`).join("\n") || "- Keep plants clean and avoid excess water.";
  const message = [
    "RootSage AI Plant Doctor Result",
    "",
    `Disease: ${disease}`,
    `Confidence: ${Math.round(confidence * 1000) / 10}%`,
    "",
    `Treatment:\n${treatmentText}`,
    "",
    `Prevention:\n${preventionText}`,
    "",
    "Please verify with field symptoms or a local agriculture expert before spraying."
  ].join("\n");
  const normalizedPhone = normalizeWhatsAppPhone(phone);
  const target = normalizedPhone ? `/${normalizedPhone}` : "";
  return `https://wa.me${target}?text=${encodeURIComponent(message)}`;
}

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const router = useRouter();
  const t = useTranslation(language);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [modelMode, setModelMode] = useState<ModelMode>("crop");
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [whatsAppFallbackLink, setWhatsAppFallbackLink] = useState<string | null>(null);
  const [imageQuality, setImageQuality] = useState<ImageQuality | null>(null);
  const [isCheckingQuality, setIsCheckingQuality] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const resultLabels = useMemo(
    () => ({
      guidance: t.guidance,
      top3: t.top3,
      symptoms: t.symptoms,
      prevention: t.prevention,
      treatment: t.treatment,
      advice: t.advice,
      play: t.play,
      stop: t.stop,
      whatsapp: t.whatsapp,
      phone: t.phone,
      knowMore: t.knowMore
    }),
    [t]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(nextFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    fileToDataUrl(nextFile).then(setImageDataUrl).catch(() => setImageDataUrl(undefined));
    setImageQuality(null);
    setPrediction(null);
    setGuidance(null);
    setWhatsAppFallbackLink(null);
    setIsCheckingQuality(true);
    try {
      setImageQuality(await analyzeImageQuality(nextFile));
    } catch {
      setImageQuality({
        status: "warning",
        sharpness: 0,
        brightness: 0,
        message: "Photo quality could not be checked on this device.",
        tips: ["Use a clear, centered leaf photo in natural light."]
      });
    } finally {
      setIsCheckingQuality(false);
    }
  }

  async function handlePredict() {
    if (!file) {
      toast.error("Please upload a leaf image first.");
      return;
    }
    if (imageQuality?.status === "bad") {
      toast("This photo looks blurry. You can scan it, but a clearer retake may work better.", { icon: "!" });
    }

    setIsLoading(true);
    setPrediction(null);
    setGuidance(null);
    setWhatsAppFallbackLink(null);
    try {
      const savedImage = imageDataUrl || (file ? await fileToDataUrl(file) : undefined);
      if (savedImage && !imageDataUrl) setImageDataUrl(savedImage);
      const predictionResult = await predictDisease(file, modelMode);
      setPrediction(predictionResult);
      const guidanceResult = await generateGuidance(predictionResult.disease, language);
      setGuidance(guidanceResult);
      if (guidanceResult.provider_error) {
        saveApiDiagnostic({
          action: "Guidance provider fallback",
          userMessage: "Guidance was prepared with a backup source.",
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
          detail: guidanceResult.provider_error
        });
      }
      saveScanRecord({ imageDataUrl: savedImage, prediction: predictionResult, guidance: guidanceResult });
      toast.success("Diagnosis ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Diagnosis could not be completed.");
    } finally {
      setIsLoading(false);
    }
  }

  async function handlePlay() {
    if (!prediction || !guidance) return;
    setIsVoiceLoading(true);
    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const voice = await generateVoice({
        disease: prediction.disease,
        treatment: guidance.treatment,
        prevention: guidance.prevention,
        language
      });
      const audio = new Audio(`data:${voice.mime_type};base64,${voice.audio_base64}`);
      audioRef.current = audio;
      audio.onended = () => setIsPlaying(false);
      await audio.play();
      setIsPlaying(true);
    } catch {
      toast.error("Voice is not available right now.");
    } finally {
      setIsVoiceLoading(false);
    }
  }

  function handleStop() {
    audioRef.current?.pause();
    if (audioRef.current) audioRef.current.currentTime = 0;
    setIsPlaying(false);
  }

  async function handleWhatsApp() {
    if (!prediction || !guidance) return;
    setIsWhatsAppLoading(true);
    try {
      const response = await sendWhatsApp({
        phone: phone.trim() || undefined,
        disease: prediction.disease,
        confidence: prediction.confidence,
        treatment: guidance.treatment,
        prevention: guidance.prevention,
        language
      });
      const fallbackLink =
        response.wa_link || buildWhatsAppShareLink(phone, prediction.disease, prediction.confidence, guidance.treatment, guidance.prevention);
      if (fallbackLink) {
        setWhatsAppFallbackLink(fallbackLink);
      }
      if (response.wa_link && response.mode !== "twilio") {
        window.open(response.wa_link, "_blank", "noopener,noreferrer");
      }
      if (response.mode === "twilio" && response.twilio_sid) {
        saveApiDiagnostic({
          action: "Twilio WhatsApp request",
          userMessage: "Twilio accepted the WhatsApp request. Delivery may still depend on sandbox or WhatsApp sender setup.",
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
          detail: `SID: ${response.twilio_sid}; Status: ${response.twilio_status || "unknown"}`
        });
      }
      if (response.twilio_error) {
        saveApiDiagnostic({
          action: "Twilio WhatsApp fallback",
          userMessage: "WhatsApp direct send is unavailable. Opening share instead.",
          apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
          detail: response.twilio_error
        });
      }
      if (response.sent) {
        toast.success("Twilio accepted the request. Use backup button if it is not received.");
      } else if (response.twilio_error) {
        toast.error("WhatsApp direct send is unavailable. Opening share instead.");
      } else {
        toast.success("WhatsApp share opened");
      }
    } catch {
      toast.error("WhatsApp sharing is not available right now.");
    } finally {
      setIsWhatsAppLoading(false);
    }
  }

  function handleWhatsAppFallback() {
    if (!whatsAppFallbackLink) return;
    window.open(whatsAppFallbackLink, "_blank", "noopener,noreferrer");
  }

  function handleKnowMore() {
    if (!prediction || !guidance) return;
    if (typeof window !== "undefined") {
      saveDiseaseHandoff(prediction, guidance, language);
    }
    router.push(`/disease/${diseaseToSlug(prediction.disease)}?lang=${language}`);
  }

  return (
    <>
      <Head>
        <title>{`${t.brand} | AI Plant Disease Detection`}</title>
        <meta
          name="description"
          content="AI-powered plant disease detection for farmers using CNN models, Gemini guidance, voice assistance, and WhatsApp sharing."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main>
        <Hero title={t.heroTitle} subtitle={t.heroSubtitle} />
        <WeatherRiskCard />
        <ImageUploader
          title={t.uploadTitle}
          hint={t.uploadHint}
          captureLabel={t.capture}
          predictLabel={isLoading ? t.analyzing : t.predict}
          isLoading={isLoading}
          previewUrl={previewUrl}
          imageQuality={imageQuality}
          isCheckingQuality={isCheckingQuality}
          modelMode={modelMode}
          onModelModeChange={(mode) => {
            setModelMode(mode);
            setPrediction(null);
            setGuidance(null);
          }}
          onFile={handleFile}
          onPredict={handlePredict}
        />
        <ResultsPanel
          labels={resultLabels}
          prediction={prediction}
          guidance={guidance}
          phone={phone}
          setPhone={setPhone}
          isVoiceLoading={isVoiceLoading}
          isWhatsAppLoading={isWhatsAppLoading}
          whatsAppFallbackLink={whatsAppFallbackLink}
          isPlaying={isPlaying}
          language={language}
          onPlay={handlePlay}
          onStop={handleStop}
          onWhatsApp={handleWhatsApp}
          onWhatsAppFallback={handleWhatsAppFallback}
          onKnowMore={handleKnowMore}
        />
        <InfoSections featuresTitle={t.features} howTitle={t.how} cropsTitle={t.crops} />
      </main>
      <Footer brand={t.brand} />
    </>
  );
}
