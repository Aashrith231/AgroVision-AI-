import Head from "next/head";
import type React from "react";
import { useEffect, useState } from "react";
import { Activity, AlertCircle, CheckCircle2, Database, LockKeyhole, RefreshCw, Server, Shield, XCircle } from "lucide-react";
import toast from "react-hot-toast";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Language } from "../i18n/translations";
import { getApiBaseUrl, getHealth, getModelInfo } from "../services/api";
import { ApiDiagnostic, ModelInfoResponse } from "../types";
import { clearApiDiagnostics, getApiDiagnostics } from "../utils/adminDiagnostics";

const ADMIN_TOKEN_KEY = "rootsage:admin-token";

export default function AdminPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [modelInfo, setModelInfo] = useState<ModelInfoResponse | null>(null);
  const [health, setHealth] = useState<"checking" | "online" | "offline">("checking");
  const [diagnostics, setDiagnostics] = useState<ApiDiagnostic[]>([]);
  const [loading, setLoading] = useState(true);
  const [adminToken, setAdminToken] = useState("");
  const [tokenInput, setTokenInput] = useState("");
  const [isUnlocked, setIsUnlocked] = useState(false);

  async function loadAdminData(token = adminToken) {
    setLoading(true);
    setDiagnostics(getApiDiagnostics());
    try {
      await getHealth();
      setHealth("online");
    } catch {
      setHealth("offline");
    }

    try {
      setModelInfo(await getModelInfo(token));
      setIsUnlocked(true);
    } catch {
      setModelInfo(null);
      setIsUnlocked(false);
    } finally {
      setDiagnostics(getApiDiagnostics());
      setLoading(false);
    }
  }

  useEffect(() => {
    const savedToken = typeof window !== "undefined" ? window.localStorage.getItem(ADMIN_TOKEN_KEY) || "" : "";
    setAdminToken(savedToken);
    setTokenInput(savedToken);
    if (savedToken) {
      loadAdminData(savedToken);
    } else {
      setLoading(false);
      setHealth("checking");
      setDiagnostics(getApiDiagnostics());
    }
  }, []);

  async function handleUnlock(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const nextToken = tokenInput.trim();
    if (!nextToken) {
      toast.error("Enter admin token");
      return;
    }
    setAdminToken(nextToken);
    if (typeof window !== "undefined") {
      window.localStorage.setItem(ADMIN_TOKEN_KEY, nextToken);
    }
    await loadAdminData(nextToken);
  }

  function handleLock() {
    setIsUnlocked(false);
    setAdminToken("");
    setTokenInput("");
    setModelInfo(null);
    if (typeof window !== "undefined") {
      window.localStorage.removeItem(ADMIN_TOKEN_KEY);
    }
  }

  function handleClearDiagnostics() {
    clearApiDiagnostics();
    setDiagnostics([]);
    toast.success("Diagnostics cleared");
  }

  return (
    <>
      <Head>
        <title>Admin Model Info | RootSage AI</title>
        <meta name="description" content="Admin diagnostics and model configuration for RootSage AI." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header brand="RootSage AI" language={language} setLanguage={setLanguage} />
      <main className="bg-[#f6fbf4] py-10 sm:py-14">
        <section className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          {!isUnlocked && (
            <div className="mx-auto max-w-xl rounded-3xl border border-leaf-100 bg-white p-6 shadow-soft">
              <div className="grid h-12 w-12 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                <LockKeyhole className="h-6 w-6" />
              </div>
              <h1 className="mt-5 text-2xl font-black text-leaf-950">Admin access</h1>
              <p className="mt-2 text-sm leading-6 text-green-950/65">
                Enter the admin token to view model configuration and diagnostics.
              </p>
              <form onSubmit={handleUnlock} className="mt-5 space-y-3">
                <input
                  type="password"
                  value={tokenInput}
                  onChange={(event) => setTokenInput(event.target.value)}
                  placeholder="Admin token"
                  className="w-full rounded-2xl border-leaf-200 focus:border-leaf-600 focus:ring-leaf-600"
                />
                <button
                  type="submit"
                  disabled={loading}
                  className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3 font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-gray-300"
                >
                  {loading ? <RefreshCw className="h-5 w-5 animate-spin" /> : <LockKeyhole className="h-5 w-5" />}
                  Unlock admin panel
                </button>
              </form>
            </div>
          )}

          {isUnlocked && (
          <>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.2em] text-leaf-600">Admin console</p>
              <h1 className="mt-2 text-3xl font-black text-leaf-950 sm:text-5xl">Model and system status</h1>
              <p className="mt-3 max-w-2xl text-base leading-7 text-green-950/70">
                Farmer-facing screens hide technical failures. This page keeps model setup, provider status, and recent API diagnostics in one place.
              </p>
            </div>
            <button
              type="button"
              onClick={() => loadAdminData()}
              className="inline-flex items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3 font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-leaf-700"
            >
              <RefreshCw className={`h-5 w-5 ${loading ? "animate-spin" : ""}`} />
              Refresh
            </button>
            <button
              type="button"
              onClick={handleLock}
              className="inline-flex items-center justify-center rounded-2xl border border-leaf-200 bg-white px-5 py-3 font-black text-leaf-900 transition hover:border-leaf-500"
            >
              Lock
            </button>
          </div>

          <div className="mt-8 grid gap-4 md:grid-cols-3">
            <StatusCard title="Backend API" value={health === "online" ? "Online" : health === "offline" ? "Offline" : "Checking"} good={health === "online"} icon={<Server className="h-5 w-5" />} />
            <StatusCard title="Model file" value={modelInfo?.model.model_file_found ? "Found" : "Not confirmed"} good={Boolean(modelInfo?.model.model_file_found)} icon={<Database className="h-5 w-5" />} />
            <StatusCard title="Class labels" value={modelInfo ? `${modelInfo.model.class_count}/${modelInfo.model.expected_classes}` : "Not loaded"} good={modelInfo?.model.class_count === modelInfo?.model.expected_classes} icon={<Activity className="h-5 w-5" />} />
          </div>

          <div className="mt-6 grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
            <section className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center gap-3">
                <div className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                  <Shield className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-leaf-950">Runtime configuration</h2>
                  <p className="text-sm text-green-950/60">Safe, non-secret deployment details.</p>
                </div>
              </div>

              <div className="mt-5 space-y-3">
                <InfoRow label="Frontend API URL" value={getApiBaseUrl()} />
                <InfoRow label="Environment" value={modelInfo?.environment || "Unknown"} />
                <InfoRow label="Model" value={modelInfo?.model.model_name || "Unknown"} />
                <InfoRow label="Model family" value={modelInfo?.model.model_family || "Unknown"} />
                <InfoRow label="Input size" value={modelInfo ? `${modelInfo.model.image_size} x ${modelInfo.model.image_size}` : "Unknown"} />
                <InfoRow label="Upload limit" value={modelInfo ? `${modelInfo.runtime.max_upload_mb} MB` : "Unknown"} />
                <InfoRow label="CORS mode" value={modelInfo?.runtime.cors_mode || "Unknown"} />
              </div>
            </section>

            <section className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
              <h2 className="text-xl font-black text-leaf-950">AI providers</h2>
              <p className="mt-1 text-sm text-green-950/60">Shows whether each integration is configured, without exposing keys.</p>
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <ProviderPill label="Gemini guidance" active={Boolean(modelInfo?.providers.gemini_configured)} />
                <ProviderPill label={`NVIDIA ${modelInfo?.providers.nvidia_model || "DeepSeek"}`.trim()} active={Boolean(modelInfo?.providers.nvidia_configured)} />
                <ProviderPill label={`Ollama ${modelInfo?.providers.ollama_model || ""}`.trim()} active={Boolean(modelInfo?.providers.ollama_enabled)} />
                <ProviderPill label="ElevenLabs voice" active={Boolean(modelInfo?.providers.elevenlabs_configured)} />
                <ProviderPill label="Twilio WhatsApp" active={Boolean(modelInfo?.providers.twilio_configured)} />
              </div>
              {modelInfo?.model.class_error && (
                <div className="mt-5 rounded-2xl border border-red-100 bg-red-50 p-4 text-sm font-semibold leading-6 text-red-900">
                  {modelInfo.model.class_error}
                </div>
              )}
            </section>
          </div>

          <section className="mt-6 rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <h2 className="text-xl font-black text-leaf-950">Recent admin diagnostics</h2>
                <p className="mt-1 text-sm text-green-950/60">Technical errors collected from farmer-facing flows on this device.</p>
              </div>
              <button
                type="button"
                onClick={handleClearDiagnostics}
                className="rounded-2xl border border-leaf-200 bg-white px-4 py-2 font-black text-leaf-900 transition hover:border-leaf-500"
              >
                Clear
              </button>
            </div>

            <div className="mt-5 space-y-3">
              {diagnostics.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-leaf-200 bg-leaf-50 p-5 text-sm font-semibold text-green-950/70">
                  No diagnostics yet.
                </div>
              ) : (
                diagnostics.map((item) => (
                  <article key={item.id} className="rounded-2xl border border-leaf-100 bg-[#fbfef9] p-4">
                    <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                      <h3 className="font-black text-leaf-950">{item.action}</h3>
                      <span className="text-xs font-bold uppercase tracking-[0.12em] text-green-950/50">{new Date(item.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="mt-3 grid gap-2 text-sm leading-6 text-green-950/75 sm:grid-cols-2">
                      <InfoRow label="User message" value={item.userMessage} compact />
                      <InfoRow label="Status" value={item.status ? String(item.status) : "No response"} compact />
                      <InfoRow label="Method" value={item.method || "Unknown"} compact />
                      <InfoRow label="URL" value={`${item.apiBaseUrl}${item.url || ""}`} compact />
                    </div>
                    <pre className="mt-3 overflow-x-auto rounded-2xl bg-green-950 p-3 text-xs leading-5 text-green-50">{item.detail || "No detail"}</pre>
                  </article>
                ))
              )}
            </div>
          </section>
          </>
          )}
        </section>
      </main>
      <Footer brand="RootSage AI" />
    </>
  );
}

function StatusCard({ title, value, good, icon }: { title: string; value: string; good: boolean; icon: React.ReactNode }) {
  return (
    <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft">
      <div className="flex items-center justify-between gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">{icon}</div>
        {good ? <CheckCircle2 className="h-5 w-5 text-leaf-600" /> : <AlertCircle className="h-5 w-5 text-amber-600" />}
      </div>
      <p className="mt-5 text-sm font-black uppercase tracking-[0.16em] text-green-950/45">{title}</p>
      <p className="mt-1 text-2xl font-black text-leaf-950">{value}</p>
    </div>
  );
}

function ProviderPill({ label, active }: { label: string; active: boolean }) {
  return (
    <div className={`flex items-center gap-3 rounded-2xl border px-4 py-3 ${active ? "border-leaf-100 bg-leaf-50 text-leaf-900" : "border-gray-200 bg-gray-50 text-gray-600"}`}>
      {active ? <CheckCircle2 className="h-5 w-5 text-leaf-600" /> : <XCircle className="h-5 w-5 text-gray-400" />}
      <span className="font-black">{label}</span>
    </div>
  );
}

function InfoRow({ label, value, compact }: { label: string; value: string; compact?: boolean }) {
  return (
    <div className={compact ? "" : "rounded-2xl border border-leaf-100 bg-leaf-50 px-4 py-3"}>
      <p className="text-xs font-black uppercase tracking-[0.14em] text-green-950/45">{label}</p>
      <p className="mt-1 break-words text-sm font-bold text-green-950/80">{value}</p>
    </div>
  );
}
