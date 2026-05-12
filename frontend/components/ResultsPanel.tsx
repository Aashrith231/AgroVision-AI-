import { useMemo, useState } from "react";
import { AlertTriangle, Bell, BookOpen, CheckCircle2, MessageCircle, PauseCircle, PlayCircle, Send } from "lucide-react";
import { Language } from "../i18n/translations";
import { GuidanceResponse, PredictionResponse, SeverityInput } from "../types";
import { percent } from "../utils/format";
import { calculateSeverity } from "../utils/severity";
import { saveReminder } from "../utils/storage";

type Labels = {
  guidance: string;
  top3: string;
  symptoms: string;
  prevention: string;
  treatment: string;
  advice: string;
  play: string;
  stop: string;
  whatsapp: string;
  phone: string;
  knowMore: string;
  uncertain: string;
  unknown: string;
};

type Props = {
  labels: Labels;
  prediction: PredictionResponse | null;
  guidance: GuidanceResponse | null;
  phone: string;
  setPhone: (phone: string) => void;
  isVoiceLoading: boolean;
  isWhatsAppLoading: boolean;
  isPlaying: boolean;
  language: Language;
  onPlay: () => void;
  onStop: () => void;
  onWhatsApp: () => void;
  onKnowMore: () => void;
};

export function ResultsPanel({
  labels,
  prediction,
  guidance,
  phone,
  setPhone,
  isVoiceLoading,
  isWhatsAppLoading,
  isPlaying,
  onPlay,
  onStop,
  onWhatsApp,
  onKnowMore
}: Props) {
  const [severityInput, setSeverityInput] = useState<SeverityInput>({
    affectedLeaves: "few",
    spread: "no",
    fruitOrStem: "no"
  });
  const [reminderSaved, setReminderSaved] = useState(false);
  const severity = useMemo(() => calculateSeverity(severityInput), [severityInput]);

  if (!prediction) {
    return null;
  }

  const confidenceColor =
    prediction.confidence_level === "high"
      ? "bg-leaf-600"
      : prediction.confidence_level === "medium"
        ? "bg-amber-500"
      : "bg-red-500";
  const localizedWarning =
    prediction.confidence_level === "low"
      ? labels.unknown
      : prediction.confidence_level === "medium"
        ? labels.uncertain
        : prediction.warning;

  return (
    <section className="bg-leaf-50 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Prediction</p>
              <h2 className="mt-2 text-3xl font-black text-leaf-900">{prediction.disease}</h2>
            </div>
            {prediction.confidence_level === "high" ? (
              <CheckCircle2 className="h-8 w-8 text-leaf-600" />
            ) : (
              <AlertTriangle className="h-8 w-8 text-amber-500" />
            )}
          </div>

          <div className="mt-6">
            <div className="mb-2 flex items-center justify-between text-sm font-bold text-green-950/70">
              <span>Confidence</span>
              <span>{percent(prediction.confidence)}</span>
            </div>
            <div className="h-3 overflow-hidden rounded-full bg-leaf-100">
              <div className={`h-full rounded-full ${confidenceColor} progress-stripes`} style={{ width: `${prediction.confidence * 100}%` }} />
            </div>
          </div>

          {localizedWarning && (
            <div className="mt-5 rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm font-semibold text-amber-900">
              {localizedWarning}
            </div>
          )}

          <div className="mt-6">
            <h3 className="text-lg font-black text-leaf-900">{labels.top3}</h3>
            <div className="mt-3 space-y-3">
              {prediction.top_predictions.map((item) => (
                <div key={item.label} className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
                  <div className="flex items-center justify-between gap-3 text-sm font-bold">
                    <span className="text-leaf-900">{item.label}</span>
                    <span className="text-leaf-700">{percent(item.confidence)}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {guidance && (
          <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">{labels.guidance}</p>
                <p className="mt-2 text-green-950/74">{guidance.explanation}</p>
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={isPlaying ? onStop : onPlay}
                  disabled={isVoiceLoading}
                  className="inline-flex items-center gap-2 rounded-full border border-leaf-200 px-4 py-2 text-sm font-black text-leaf-900 transition hover:border-leaf-500 disabled:opacity-60"
                >
                  {isPlaying ? <PauseCircle className="h-5 w-5" /> : <PlayCircle className="h-5 w-5" />}
                  {isPlaying ? labels.stop : labels.play}
                </button>
              </div>
            </div>

            <div className="mt-6 grid gap-4 sm:grid-cols-3">
              <GuidanceList title={labels.symptoms} items={guidance.symptoms} />
              <GuidanceList title={labels.prevention} items={guidance.prevention} />
              <GuidanceList title={labels.treatment} items={guidance.treatment} />
            </div>

            <div className="mt-5 rounded-2xl border border-leaf-100 bg-white p-4">
              <h3 className="font-black text-leaf-900">Severity checker</h3>
              <div className="mt-3 grid gap-3 sm:grid-cols-3">
                <SeveritySelect
                  label="Leaves affected"
                  value={severityInput.affectedLeaves}
                  options={[
                    ["few", "Few leaves"],
                    ["many", "Many leaves"],
                    ["most", "Most leaves"]
                  ]}
                  onChange={(value) => setSeverityInput((current) => ({ ...current, affectedLeaves: value as SeverityInput["affectedLeaves"] }))}
                />
                <SeveritySelect
                  label="Spread"
                  value={severityInput.spread}
                  options={[
                    ["no", "Not spreading"],
                    ["slow", "Slow spread"],
                    ["fast", "Fast spread"]
                  ]}
                  onChange={(value) => setSeverityInput((current) => ({ ...current, spread: value as SeverityInput["spread"] }))}
                />
                <SeveritySelect
                  label="Fruit/stem"
                  value={severityInput.fruitOrStem}
                  options={[
                    ["no", "Not affected"],
                    ["yes", "Affected"]
                  ]}
                  onChange={(value) => setSeverityInput((current) => ({ ...current, fruitOrStem: value as SeverityInput["fruitOrStem"] }))}
                />
              </div>
              <div className="mt-4 rounded-2xl bg-leaf-50 p-4">
                <p className="font-black text-leaf-900">{severity.level} severity</p>
                <p className="mt-1 text-sm font-semibold leading-6 text-green-950/72">{severity.recommendation}</p>
              </div>
            </div>

            <div className="mt-5 rounded-2xl bg-leaf-50 p-4">
              <h3 className="font-black text-leaf-900">{labels.advice}</h3>
              <p className="mt-2 text-sm leading-6 text-green-950/72">{guidance.farmer_advice}</p>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                onClick={onKnowMore}
                className="inline-flex items-center justify-center gap-2 rounded-2xl border border-leaf-200 bg-white px-5 py-3 font-black text-leaf-900 transition hover:border-leaf-500 hover:bg-leaf-50"
              >
                <BookOpen className="h-5 w-5 text-leaf-600" />
                {labels.knowMore}
              </button>
              <button
                type="button"
                onClick={() => {
                  const dueAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
                  saveReminder({
                    disease: prediction.disease,
                    dueAt,
                    note: `Recheck ${prediction.disease} after treatment and field cleanup.`
                  });
                  setReminderSaved(true);
                  if ("Notification" in window && Notification.permission === "default") {
                    Notification.requestPermission().catch(() => undefined);
                  }
                }}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3 font-black text-white transition hover:bg-leaf-700"
              >
                <Bell className="h-5 w-5" />
                {reminderSaved ? "Follow-up saved" : "Remind in 3 days"}
              </button>
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-[1fr_auto]">
              <label className="relative">
                <MessageCircle className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-leaf-600" />
                <input
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                  placeholder={`${labels.phone} (+91...)`}
                  className="w-full rounded-2xl border-leaf-200 py-3 pl-12 pr-4 focus:border-leaf-600 focus:ring-leaf-600"
                />
              </label>
              <button
                type="button"
                onClick={onWhatsApp}
                disabled={isWhatsAppLoading}
                className="inline-flex items-center justify-center gap-2 rounded-2xl bg-leaf-600 px-5 py-3 font-black text-white transition hover:bg-leaf-700 disabled:opacity-60"
              >
                <Send className="h-5 w-5" />
                {labels.whatsapp}
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}

function SeveritySelect({
  label,
  value,
  options,
  onChange
}: {
  label: string;
  value: string;
  options: [string, string][];
  onChange: (value: string) => void;
}) {
  return (
    <label className="block">
      <span className="text-xs font-black uppercase tracking-wide text-green-950/52">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="mt-1 w-full rounded-2xl border-leaf-200 bg-leaf-50 text-sm font-bold text-leaf-900 focus:border-leaf-600 focus:ring-leaf-600"
      >
        {options.map(([optionValue, optionLabel]) => (
          <option key={optionValue} value={optionValue}>
            {optionLabel}
          </option>
        ))}
      </select>
    </label>
  );
}

function GuidanceList({ title, items }: { title: string; items: string[] }) {
  return (
    <div className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
      <h3 className="font-black text-leaf-900">{title}</h3>
      <ul className="mt-3 space-y-2 text-sm leading-6 text-green-950/72">
        {items.map((item) => (
          <li key={item} className="flex gap-2">
            <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-leaf-600" />
            <span>{item}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}
