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
import { GuidanceResponse, PredictionResponse } from "../types";
import { diseaseToSlug } from "../utils/disease";
import { fileToDataUrl, saveDiseaseHandoff, saveScanRecord } from "../utils/storage";

export default function Home() {
  const [language, setLanguage] = useState<Language>("en");
  const router = useRouter();
  const t = useTranslation(language);
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | undefined>();
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [phone, setPhone] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isVoiceLoading, setIsVoiceLoading] = useState(false);
  const [isWhatsAppLoading, setIsWhatsAppLoading] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
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
      knowMore: t.knowMore,
      uncertain: t.uncertain,
      unknown: t.unknown
    }),
    [t]
  );

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  function handleFile(nextFile: File) {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    fileToDataUrl(nextFile).then(setImageDataUrl).catch(() => setImageDataUrl(undefined));
    setPrediction(null);
    setGuidance(null);
  }

  async function handlePredict() {
    if (!file) {
      toast.error("Please upload a leaf image first.");
      return;
    }

    setIsLoading(true);
    setPrediction(null);
    setGuidance(null);
    try {
      const savedImage = imageDataUrl || (file ? await fileToDataUrl(file) : undefined);
      if (savedImage && !imageDataUrl) setImageDataUrl(savedImage);
      const predictionResult = await predictDisease(file);
      setPrediction(predictionResult);
      const guidanceResult = await generateGuidance(predictionResult.disease, language);
      setGuidance(guidanceResult);
      saveScanRecord({ imageDataUrl: savedImage, prediction: predictionResult, guidance: guidanceResult });
      toast.success("Diagnosis ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Prediction failed");
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
      toast.error("Voice generation failed");
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
      if (response.wa_link) {
        window.open(response.wa_link, "_blank", "noopener,noreferrer");
      }
      if (response.sent) {
        toast.success("WhatsApp message sent by Twilio");
      } else if (response.twilio_error) {
        toast.error(`Twilio failed: ${response.twilio_error}`);
      } else {
        toast.success("WhatsApp share opened");
      }
    } catch {
      toast.error("WhatsApp sharing failed");
    } finally {
      setIsWhatsAppLoading(false);
    }
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
          isPlaying={isPlaying}
          language={language}
          onPlay={handlePlay}
          onStop={handleStop}
          onWhatsApp={handleWhatsApp}
          onKnowMore={handleKnowMore}
        />
        <InfoSections featuresTitle={t.features} howTitle={t.how} cropsTitle={t.crops} />
      </main>
      <Footer brand={t.brand} />
    </>
  );
}
