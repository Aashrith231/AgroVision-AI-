import Head from "next/head";
import Link from "next/link";
import { useRouter } from "next/router";
import { useEffect, useMemo, useState } from "react";
import { ArrowLeft, CalendarDays, CheckCircle2, ClipboardList, Leaf, ShieldCheck, Stethoscope, TriangleAlert } from "lucide-react";
import { Header } from "../../components/Header";
import { Footer } from "../../components/Footer";
import { Language } from "../../i18n/translations";
import { useTranslation } from "../../hooks/useTranslation";
import { generateGuidance } from "../../services/api";
import { GuidanceResponse, PredictionResponse } from "../../types";
import { cropFromDisease, displayDiseaseName, slugToDisease } from "../../utils/disease";
import { percent } from "../../utils/format";

type StoredDisease = {
  prediction?: PredictionResponse;
  guidance?: GuidanceResponse;
  language?: Language;
};

export default function DiseaseDetailsPage() {
  const router = useRouter();
  const disease = useMemo(() => slugToDisease(router.query.name), [router.query.name]);
  const queryLanguage = router.query.lang === "hi" || router.query.lang === "te" ? router.query.lang : "en";
  const [language, setLanguage] = useState<Language>(queryLanguage);
  const t = useTranslation(language);
  const [guidance, setGuidance] = useState<GuidanceResponse | null>(null);
  const [prediction, setPrediction] = useState<PredictionResponse | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!disease) return;

    let cancelled = false;
    async function loadDetails() {
      setIsLoading(true);
      const storageKey = `agrovision:disease:${disease}:${language}`;
      const stored = typeof window !== "undefined" ? window.localStorage.getItem(storageKey) : null;
      if (stored) {
        try {
          const parsed = JSON.parse(stored) as StoredDisease;
          if (!cancelled) {
            setPrediction(parsed.prediction || null);
            setGuidance(parsed.guidance || null);
            setIsLoading(false);
          }
          if (parsed.guidance) return;
        } catch {
          window.localStorage.removeItem(storageKey);
        }
      }

      try {
        const nextGuidance = await generateGuidance(disease, language);
        if (!cancelled) setGuidance(nextGuidance);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    }

    loadDetails();
    return () => {
      cancelled = true;
    };
  }, [disease, language]);

  const displayName = displayDiseaseName(disease);
  const cropName = cropFromDisease(disease);
  const isHealthy = disease.toLowerCase().includes("healthy");

  return (
    <>
      <Head>
        <title>{`${displayName || "Disease Details"} | AgroVision AI`}</title>
        <meta name="description" content={`Detailed farmer guidance for ${displayName}`} />
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main className="bg-leaf-50">
        <section className="border-b border-leaf-100 bg-white">
          <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
            <Link href="/#upload" className="inline-flex items-center gap-2 text-sm font-black text-leaf-700 hover:text-leaf-900">
              <ArrowLeft className="h-4 w-4" />
              Back to diagnosis
            </Link>
            <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_22rem] lg:items-end">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.2em] text-leaf-600">{cropName} crop guide</p>
                <h1 className="mt-3 text-4xl font-black leading-tight text-leaf-900 sm:text-5xl">{displayName}</h1>
                <p className="mt-4 max-w-3xl text-base leading-8 text-green-950/72">
                  {guidance?.explanation || "Loading practical farmer guidance for this diagnosis..."}
                </p>
              </div>
              <div className="rounded-3xl border border-leaf-100 bg-leaf-50 p-5">
                <p className="text-sm font-black uppercase tracking-[0.16em] text-green-950/58">Diagnosis status</p>
                <div className="mt-4 flex items-center gap-3">
                  {isHealthy ? <CheckCircle2 className="h-9 w-9 text-leaf-600" /> : <TriangleAlert className="h-9 w-9 text-amber-500" />}
                  <div>
                    <p className="font-black text-leaf-900">{isHealthy ? "Healthy class" : "Action recommended"}</p>
                    <p className="text-sm text-green-950/64">Verify with field symptoms before spraying.</p>
                  </div>
                </div>
                {prediction && (
                  <div className="mt-5">
                    <div className="flex justify-between text-sm font-bold text-green-950/70">
                      <span>Model confidence</span>
                      <span>{percent(prediction.confidence)}</span>
                    </div>
                    <div className="mt-2 h-3 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-leaf-600" style={{ width: `${prediction.confidence * 100}%` }} />
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-5 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_0.86fr] lg:px-8">
          <div className="space-y-5">
            <DetailCard icon={Stethoscope} title="Symptoms to Compare" items={guidance?.symptoms} loading={isLoading} />
            <DetailCard icon={ShieldCheck} title="Prevention Plan" items={guidance?.prevention} loading={isLoading} />
            <DetailCard icon={Leaf} title="Treatment Steps" items={guidance?.treatment} loading={isLoading} />
          </div>

          <aside className="space-y-5">
            <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <ClipboardList className="h-6 w-6 text-leaf-600" />
                <h2 className="text-xl font-black text-leaf-900">Field Checklist</h2>
              </div>
              <div className="mt-4 space-y-3">
                {[
                  "Check 5-10 leaves from different parts of the plant.",
                  "Compare spots, color change, curling, and drying with the symptoms.",
                  "Remove badly infected leaves away from the field.",
                  "Avoid spraying if the AI result does not match field symptoms."
                ].map((item) => (
                  <ChecklistItem key={item} text={item} />
                ))}
              </div>
            </div>

            <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft">
              <div className="flex items-center gap-3">
                <CalendarDays className="h-6 w-6 text-leaf-600" />
                <h2 className="text-xl font-black text-leaf-900">Next 7 Days</h2>
              </div>
              <div className="mt-5 space-y-4">
                <TimelineItem day="Today" text="Remove highly affected leaves and avoid overhead watering." />
                <TimelineItem day="Day 2-3" text="Check whether new spots are appearing on fresh leaves." />
                <TimelineItem day="Day 5-7" text="If spread continues, contact a local agriculture officer." />
              </div>
            </div>

            <div className="rounded-3xl border border-amber-200 bg-amber-50 p-5">
              <h2 className="text-lg font-black text-amber-950">When to Get Expert Help</h2>
              <p className="mt-2 text-sm leading-6 text-amber-950/78">
                If more than one-third of the plant is affected, if fruit damage is visible, or if symptoms spread after treatment,
                verify with a local agriculture expert before applying stronger chemicals.
              </p>
            </div>
          </aside>
        </section>
      </main>
      <Footer brand={t.brand} />
    </>
  );
}

function DetailCard({
  icon: Icon,
  title,
  items,
  loading
}: {
  icon: typeof Leaf;
  title: string;
  items?: string[];
  loading: boolean;
}) {
  return (
    <article className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
      <div className="flex items-center gap-3">
        <div className="grid h-11 w-11 place-items-center rounded-2xl bg-leaf-100 text-leaf-700">
          <Icon className="h-6 w-6" />
        </div>
        <h2 className="text-xl font-black text-leaf-900">{title}</h2>
      </div>
      {loading ? (
        <div className="mt-5 space-y-3">
          <div className="h-4 w-5/6 animate-pulse rounded bg-leaf-100" />
          <div className="h-4 w-3/4 animate-pulse rounded bg-leaf-100" />
          <div className="h-4 w-4/5 animate-pulse rounded bg-leaf-100" />
        </div>
      ) : (
        <ul className="mt-5 space-y-3">
          {(items || []).map((item) => (
            <li key={item} className="flex gap-3 rounded-2xl bg-leaf-50 p-4 text-sm font-semibold leading-6 text-green-950/74">
              <span className="mt-2 h-2 w-2 shrink-0 rounded-full bg-leaf-600" />
              <span>{item}</span>
            </li>
          ))}
        </ul>
      )}
    </article>
  );
}

function ChecklistItem({ text }: { text: string }) {
  return (
    <div className="flex gap-3 rounded-2xl bg-leaf-50 p-3 text-sm font-semibold leading-6 text-green-950/72">
      <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0 text-leaf-600" />
      <span>{text}</span>
    </div>
  );
}

function TimelineItem({ day, text }: { day: string; text: string }) {
  return (
    <div className="border-l-2 border-leaf-200 pl-4">
      <p className="font-black text-leaf-900">{day}</p>
      <p className="mt-1 text-sm leading-6 text-green-950/70">{text}</p>
    </div>
  );
}
