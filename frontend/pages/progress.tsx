import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import { Activity, AlertTriangle, ArrowRight, CalendarClock, CheckCircle2, History, ImagePlus, Loader2, RefreshCw, TrendingUp, UploadCloud } from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Language } from "../i18n/translations";
import { useTranslation } from "../hooks/useTranslation";
import { generateGuidance, generateProgressReport, predictDisease } from "../services/api";
import { ProgressRecord, ProgressStatus, ScanRecord } from "../types";
import { saveApiDiagnostic } from "../utils/adminDiagnostics";
import { displayDiseaseName } from "../utils/disease";
import { analyzeProgress, confidenceDisclaimer } from "../utils/progressAnalysis";
import { fileToDataUrl, getProgressRecords, getScanHistory, saveProgressRecord, saveScanRecord } from "../utils/storage";

type StatusTone = {
  badge: string;
  panel: string;
  icon: string;
};

const statusTone: Record<ProgressStatus, StatusTone> = {
  Improving: {
    badge: "bg-leaf-600 text-white",
    panel: "border-leaf-100 bg-leaf-50",
    icon: "text-leaf-600"
  },
  Stable: {
    badge: "bg-blue-100 text-blue-900",
    panel: "border-blue-100 bg-blue-50",
    icon: "text-blue-700"
  },
  Worsening: {
    badge: "bg-amber-100 text-amber-950",
    panel: "border-amber-200 bg-amber-50",
    icon: "text-amber-700"
  },
  Inconclusive: {
    badge: "bg-stone-100 text-stone-800",
    panel: "border-stone-200 bg-stone-50",
    icon: "text-stone-600"
  }
};

export default function ProgressPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [progressRecords, setProgressRecords] = useState<ProgressRecord[]>([]);
  const [selectedId, setSelectedId] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [currentImageDataUrl, setCurrentImageDataUrl] = useState<string | undefined>();
  const [currentScan, setCurrentScan] = useState<ScanRecord | null>(null);
  const [activeRecord, setActiveRecord] = useState<ProgressRecord | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();
  const t = useTranslation(language);

  const selectedScan = useMemo(() => history.find((item) => item.id === selectedId) || null, [history, selectedId]);

  useEffect(() => {
    const scans = getScanHistory();
    const requestedScan = typeof router.query.scan === "string" ? router.query.scan : "";
    setHistory(scans);
    setProgressRecords(getProgressRecords());
    if (requestedScan && scans.some((scan) => scan.id === requestedScan)) {
      setSelectedId(requestedScan);
    } else if (scans[0]) {
      setSelectedId(scans[0].id);
    }
  }, [router.query.scan]);

  useEffect(() => {
    return () => {
      if (previewUrl) URL.revokeObjectURL(previewUrl);
    };
  }, [previewUrl]);

  async function handleFile(nextFile: File) {
    if (!["image/jpeg", "image/png"].includes(nextFile.type)) {
      toast.error("Please upload a JPG or PNG leaf image.");
      return;
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setFile(nextFile);
    setPreviewUrl(URL.createObjectURL(nextFile));
    setCurrentScan(null);
    setActiveRecord(null);
    try {
      setCurrentImageDataUrl(await fileToDataUrl(nextFile));
    } catch {
      setCurrentImageDataUrl(undefined);
    }
  }

  async function handleAnalyze() {
    if (!selectedScan) {
      toast.error("Select a previous scan first.");
      return;
    }
    if (!file) {
      toast.error("Upload a new image of the same plant.");
      return;
    }

    setIsLoading(true);
    setCurrentScan(null);
    setActiveRecord(null);
    try {
      const imageDataUrl = currentImageDataUrl || (await fileToDataUrl(file));
      if (!currentImageDataUrl) setCurrentImageDataUrl(imageDataUrl);
      const prediction = await predictDisease(file, selectedScan.prediction.model_mode || "crop");
      const guidance = await generateGuidance(prediction.disease, language);
      const savedCurrentScan = saveScanRecord({ imageDataUrl, prediction, guidance });
      if (!savedCurrentScan) {
        throw new Error("Progress scan could not be saved on this device.");
      }

      const rule = analyzeProgress(selectedScan.prediction, prediction);
      let summary = rule.summary;
      let nextSteps = rule.nextSteps;
      let source = "rule-based";

      try {
        const report = await generateProgressReport({
          previous: {
            disease: selectedScan.prediction.disease,
            confidence: selectedScan.prediction.confidence,
            confidence_level: selectedScan.prediction.confidence_level,
            model_mode: selectedScan.prediction.model_mode,
            scan_date: selectedScan.createdAt,
            guidance_summary: selectedScan.guidance.explanation,
            disease_summary: rule.previousMeta?.summary,
            affected_area_percentage: selectedScan.prediction.affected_area_percentage ?? null,
            color_severity: selectedScan.prediction.color_severity ?? null,
            leaf_detected: selectedScan.prediction.leaf_detected ?? null
          },
          current: {
            disease: prediction.disease,
            confidence: prediction.confidence,
            confidence_level: prediction.confidence_level,
            model_mode: prediction.model_mode,
            scan_date: savedCurrentScan.createdAt,
            guidance_summary: guidance.explanation,
            disease_summary: rule.currentMeta?.summary,
            affected_area_percentage: prediction.affected_area_percentage ?? null,
            color_severity: prediction.color_severity ?? null,
            leaf_detected: prediction.leaf_detected ?? null
          },
          status: rule.status,
          rule_summary: rule.summary,
          language
        });
        summary = report.summary || rule.summary;
        nextSteps = report.next_steps?.length ? report.next_steps : rule.nextSteps;
        source = report.source || "rule-based";
        if (report.provider_error) {
          saveApiDiagnostic({
            action: "Progress report provider fallback",
            userMessage: "Progress report was prepared with rule-based analysis.",
            apiBaseUrl: process.env.NEXT_PUBLIC_API_BASE_URL || "http://localhost:8000",
            detail: report.provider_error
          });
        }
      } catch {
        source = "rule-based";
      }

      const progressRecord = {
        previousScan: selectedScan,
        currentScan: savedCurrentScan,
        status: rule.status,
        summary,
        nextSteps,
        source
      };
      const savedProgressRecord = saveProgressRecord(progressRecord);
      setCurrentScan(savedCurrentScan);
      setActiveRecord(savedProgressRecord || { ...progressRecord, id: crypto.randomUUID(), createdAt: new Date().toISOString() });
      setHistory(getScanHistory());
      setProgressRecords(getProgressRecords());
      toast.success("Progress report ready");
    } catch (error) {
      toast.error(error instanceof Error ? error.message : "Progress check could not be completed.");
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <>
      <Head>
        <title>Disease Progress Tracker | RootSage AI</title>
        <meta
          name="description"
          content="Compare previous and current plant disease scans to track whether a plant appears to be improving, stable, worsening, or inconclusive."
        />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main className="bg-leaf-50">
        <section className="border-b border-leaf-100 bg-white">
          <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_auto] lg:items-end lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Treatment follow-up</p>
              <h1 className="mt-2 text-4xl font-black text-leaf-900 sm:text-5xl">Disease Progress Tracker</h1>
              <p className="mt-3 max-w-3xl text-base font-semibold leading-7 text-green-950/68">
                Select an older scan, upload a new photo of the same plant, and compare the result after treatment or field care.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-leaf-200 bg-white px-5 py-3 font-black text-leaf-900 transition hover:border-leaf-500"
            >
              <History className="h-5 w-5 text-leaf-600" />
              View history
            </Link>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[0.95fr_1.05fr] lg:px-8">
          <div className="space-y-6">
            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                  <CalendarClock className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-leaf-900">Choose previous scan</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-green-950/64">Use a saved scan from this browser as the starting point.</p>
                </div>
              </div>

              {history.length === 0 ? (
                <div className="mt-5 rounded-2xl border border-dashed border-leaf-200 bg-leaf-50 p-5 text-center">
                  <History className="mx-auto h-8 w-8 text-leaf-600" />
                  <p className="mt-3 font-black text-leaf-900">No previous scans found</p>
                  <p className="mt-1 text-sm font-semibold text-green-950/64">Run a diagnosis first, then come back to compare progress.</p>
                </div>
              ) : (
                <>
                  <label className="mt-5 block">
                    <span className="text-xs font-black uppercase tracking-[0.16em] text-green-950/50">Saved diagnosis</span>
                    <select
                      value={selectedId}
                      onChange={(event) => {
                        setSelectedId(event.target.value);
                        setCurrentScan(null);
                        setActiveRecord(null);
                      }}
                      className="mt-2 w-full rounded-2xl border-leaf-200 bg-leaf-50 font-bold text-leaf-900 focus:border-leaf-600 focus:ring-leaf-600"
                    >
                      {history.map((record) => (
                        <option key={record.id} value={record.id}>
                          {displayDiseaseName(record.prediction.disease)} - {new Date(record.createdAt).toLocaleDateString()}
                        </option>
                      ))}
                    </select>
                  </label>

                  {selectedScan && <ScanPreview title="Previous scan" record={selectedScan} />}
                </>
              )}
            </motion.section>

            <motion.section
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.05 }}
              className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6"
            >
              <div className="flex items-start gap-3">
                <div className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
                  <ImagePlus className="h-5 w-5" />
                </div>
                <div>
                  <h2 className="text-xl font-black text-leaf-900">Upload current scan</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-green-950/64">Use a clear new image of the same plant or leaf after treatment.</p>
                </div>
              </div>

              <label className="mt-5 grid min-h-[16rem] cursor-pointer place-items-center overflow-hidden rounded-2xl border-2 border-dashed border-leaf-200 bg-leaf-50 p-5 text-center transition hover:border-leaf-500 hover:bg-white">
                <input
                  type="file"
                  accept="image/jpeg,image/png"
                  capture="environment"
                  className="hidden"
                  onChange={(event) => {
                    const nextFile = event.target.files?.[0];
                    if (nextFile) handleFile(nextFile);
                  }}
                />
                {previewUrl ? (
                  <span className="relative block h-64 w-full overflow-hidden rounded-2xl bg-white">
                    <Image src={previewUrl} alt="Current leaf preview" fill className="object-cover" sizes="(max-width: 1024px) 100vw, 50vw" />
                  </span>
                ) : (
                  <span>
                    <span className="mx-auto grid h-16 w-16 place-items-center rounded-full bg-white text-leaf-700">
                      <UploadCloud className="h-8 w-8" />
                    </span>
                    <span className="mt-4 block text-lg font-black text-leaf-900">Upload follow-up leaf photo</span>
                    <span className="mt-2 block text-sm font-semibold text-green-950/60">JPG or PNG, same plant recommended</span>
                  </span>
                )}
              </label>

              <button
                type="button"
                onClick={handleAnalyze}
                disabled={isLoading || !selectedScan || !file}
                className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3 font-black text-white shadow-lg shadow-green-900/15 transition hover:bg-leaf-700 disabled:cursor-not-allowed disabled:bg-gray-300"
              >
                {isLoading ? <Loader2 className="h-5 w-5 animate-spin" /> : <RefreshCw className="h-5 w-5" />}
                {isLoading ? "Comparing scans..." : "Compare progress"}
              </button>
            </motion.section>
          </div>

          <div className="space-y-6">
            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5 shadow-sm">
              <div className="flex items-start gap-3">
                <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-700" />
                <div>
                  <h2 className="font-black text-amber-950">Important confidence note</h2>
                  <p className="mt-1 text-sm font-semibold leading-6 text-amber-950/78">{confidenceDisclaimer}</p>
                </div>
              </div>
            </div>

            {activeRecord ? (
              <ProgressCard record={activeRecord} currentScan={currentScan} />
            ) : (
              <div className="rounded-3xl border border-leaf-100 bg-white p-8 text-center shadow-soft">
                <Activity className="mx-auto h-10 w-10 text-leaf-600" />
                <h2 className="mt-4 text-2xl font-black text-leaf-900">Progress report will appear here</h2>
                <p className="mt-2 text-sm font-semibold leading-6 text-green-950/64">
                  The report compares disease labels, confidence reliability, and available disease information.
                </p>
              </div>
            )}

            <section className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
              <div className="flex items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-black text-leaf-900">Saved progress checks</h2>
                  <p className="mt-1 text-sm font-semibold text-green-950/60">Stored only in this browser.</p>
                </div>
                <TrendingUp className="h-6 w-6 text-leaf-600" />
              </div>

              <div className="mt-5 space-y-3">
                {progressRecords.length === 0 && (
                  <div className="rounded-2xl border border-dashed border-leaf-200 bg-leaf-50 p-5 text-sm font-semibold text-green-950/68">
                    No progress checks saved yet.
                  </div>
                )}
                {progressRecords.slice(0, 4).map((record) => (
                  <button
                    key={record.id}
                    type="button"
                    onClick={() => setActiveRecord(record)}
                    className="w-full rounded-2xl border border-leaf-100 bg-[#fbfef9] p-4 text-left transition hover:border-leaf-300 hover:bg-leaf-50"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span className="font-black text-leaf-900">{displayDiseaseName(record.currentScan.prediction.disease)}</span>
                      <span className={`rounded-full px-3 py-1 text-xs font-black ${statusTone[record.status].badge}`}>{record.status}</span>
                    </div>
                    <p className="mt-2 line-clamp-2 text-sm font-semibold leading-6 text-green-950/64">{record.summary}</p>
                    <p className="mt-2 text-xs font-bold uppercase tracking-[0.12em] text-green-950/45">{new Date(record.createdAt).toLocaleString()}</p>
                  </button>
                ))}
              </div>
            </section>
          </div>
        </section>
      </main>
      <Footer brand={t.brand} />
    </>
  );
}

function ScanPreview({ title, record }: { title: string; record: ScanRecord }) {
  return (
    <article className="mt-5 grid gap-4 rounded-3xl border border-leaf-100 bg-leaf-50 p-4 sm:grid-cols-[8rem_1fr]">
      <div className="relative h-32 overflow-hidden rounded-2xl bg-white">
        {record.imageDataUrl ? (
          <Image src={record.imageDataUrl} alt={title} fill className="object-cover" sizes="128px" />
        ) : (
          <div className="grid h-full place-items-center text-leaf-600">
            <History className="h-8 w-8" />
          </div>
        )}
      </div>
      <div>
        <p className="text-xs font-black uppercase tracking-[0.16em] text-leaf-600">{title}</p>
        <h3 className="mt-1 text-xl font-black text-leaf-900">{displayDiseaseName(record.prediction.disease)}</h3>
        <div className="mt-3 grid gap-2 text-sm font-semibold text-green-950/68 sm:grid-cols-2">
          {record.prediction.affected_area_percentage !== undefined && record.prediction.leaf_detected !== false ? (
            <InfoPill label="Affected Area" value={`${record.prediction.affected_area_percentage}%`} />
          ) : (
            <InfoPill label="Confidence" value={`${Math.round(record.prediction.confidence * 100)}%`} />
          )}
          <InfoPill label="Date" value={new Date(record.createdAt).toLocaleDateString()} />
        </div>
      </div>
    </article>
  );
}

function ProgressCard({ record, currentScan }: { record: ProgressRecord; currentScan: ScanRecord | null }) {
  const tone = statusTone[record.status];
  const shownCurrentScan = currentScan || record.currentScan;

  return (
    <motion.section initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Progress analysis</p>
          <h2 className="mt-2 text-3xl font-black text-leaf-900">{record.status}</h2>
        </div>
        <span className={`rounded-full px-4 py-2 text-sm font-black ${tone.badge}`}>{record.status}</span>
      </div>

      <div className="mt-5 grid gap-4 sm:grid-cols-[1fr_auto_1fr] sm:items-stretch">
        <MiniScanCard title="Previous" record={record.previousScan} />
        <div className="hidden place-items-center text-leaf-600 sm:grid">
          <ArrowRight className="h-6 w-6" />
        </div>
        <MiniScanCard title="Current" record={shownCurrentScan} />
      </div>

      <div className={`mt-5 rounded-2xl border p-4 ${tone.panel}`}>
        <div className="flex items-start gap-3">
          <CheckCircle2 className={`mt-0.5 h-5 w-5 shrink-0 ${tone.icon}`} />
          <div>
            <h3 className="font-black text-leaf-900">Summary report</h3>
            <p className="mt-2 text-sm font-semibold leading-6 text-green-950/72">{record.summary}</p>
            <p className="mt-3 text-xs font-black uppercase tracking-[0.14em] text-green-950/45">Source: {record.source}</p>
          </div>
        </div>
      </div>

      <div className="mt-5 rounded-2xl border border-leaf-100 bg-white p-4">
        <h3 className="font-black text-leaf-900">Next steps</h3>
        <ul className="mt-3 space-y-2 text-sm font-semibold leading-6 text-green-950/72">
          {record.nextSteps.map((step) => (
            <li key={step} className="flex gap-2">
              <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
              <span>{step}</span>
            </li>
          ))}
        </ul>
      </div>
    </motion.section>
  );
}

function MiniScanCard({ title, record }: { title: string; record: ScanRecord }) {
  const [showOverlay, setShowOverlay] = useState(true);
  const hasOverlay = !!record.prediction.overlay_image;

  return (
    <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-3">
      <div className="relative h-36 overflow-hidden rounded-xl bg-white">
        {record.prediction.overlay_image && showOverlay ? (
          <img src={record.prediction.overlay_image} alt={`${title} leaf overlay`} className="object-cover h-full w-full" />
        ) : record.imageDataUrl ? (
          <Image src={record.imageDataUrl} alt={`${title} leaf`} fill className="object-cover" sizes="(max-width: 640px) 100vw, 220px" />
        ) : (
          <div className="grid h-full place-items-center text-leaf-600">
            <History className="h-7 w-7" />
          </div>
        )}
      </div>
      <p className="mt-3 text-xs font-black uppercase tracking-[0.16em] text-leaf-600">{title}</p>
      <h3 className="mt-1 font-black text-leaf-900">{displayDiseaseName(record.prediction.disease)}</h3>
      
      {record.prediction.affected_area_percentage !== undefined && record.prediction.leaf_detected !== false ? (
        <p className="mt-2 text-sm font-semibold text-green-950/64">Affected Area: {record.prediction.affected_area_percentage}%</p>
      ) : (
        <p className="mt-2 text-sm font-semibold text-green-950/64">Confidence {Math.round(record.prediction.confidence * 100)}%</p>
      )}

      <div className="mt-2 flex items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-[0.12em] text-green-950/45">{new Date(record.createdAt).toLocaleDateString()}</p>
        {hasOverlay && (
          <button 
            type="button" 
            onClick={() => setShowOverlay(!showOverlay)} 
            className="text-[10px] font-black uppercase tracking-wider text-leaf-700 hover:text-leaf-900 bg-white border border-leaf-100 rounded px-1.5 py-0.5 transition"
          >
            {showOverlay ? "Original" : "Highlights"}
          </button>
        )}
      </div>
    </div>
  );
}

function InfoPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl bg-white px-3 py-2">
      <p className="text-xs font-black uppercase tracking-[0.12em] text-green-950/45">{label}</p>
      <p className="mt-1 font-black text-leaf-900">{value}</p>
    </div>
  );
}
