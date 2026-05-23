import { useMemo, useState } from "react";
import { Bell, BookOpen, CheckCircle2, ChevronDown, ChevronUp, MessageCircle, PauseCircle, PlayCircle, Send, Sparkles } from "lucide-react";
import { Language } from "../i18n/translations";
import { GuidanceResponse, PredictionResponse, SeverityInput } from "../types";
import { displayDiseaseName } from "../utils/disease";
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
  const [showAlternatives, setShowAlternatives] = useState(false);
  const severity = useMemo(() => calculateSeverity(severityInput), [severityInput]);

  if (!prediction) {
    return null;
  }

  const alternativePredictions = prediction.top_predictions.slice(1, 3);
  const isBackground =
    prediction.disease.toLowerCase().includes("background") ||
    prediction.disease.toLowerCase().includes("without_leaves") ||
    prediction.disease.toLowerCase().includes("without leaves");
  const predictedTitle = isBackground ? "No clear leaf detected" : displayDiseaseName(prediction.disease);
  const modeLabel = prediction.model_mode === "medicinal" ? "Medicinal plant disease model" : "Normal crop disease model";

  return (
    <section className="bg-leaf-50 py-14 sm:py-20">
      <div className="mx-auto grid max-w-7xl gap-6 px-4 sm:px-6 lg:grid-cols-[0.9fr_1.1fr] lg:px-8">
        <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Prediction</p>
              <p className="mt-2 inline-flex rounded-full bg-leaf-50 px-3 py-1 text-xs font-black uppercase tracking-[0.12em] text-green-950/55">
                {modeLabel}
              </p>
              <h2 className="mt-2 text-3xl font-black text-leaf-900">{predictedTitle}</h2>
              <p className="mt-2 text-sm font-semibold leading-6 text-green-950/64">
                {isBackground
                  ? "Please upload a close-up photo of a clear plant leaf for disease diagnosis."
                  : "AgroVision AI identified this as the most likely disease from the uploaded leaf image."}
              </p>
            </div>
            <CheckCircle2 className="h-8 w-8 text-leaf-600" />
          </div>

          <div className="mt-6 rounded-3xl border border-leaf-100 bg-leaf-50 p-4">
            <div className="flex items-center gap-3">
              <div className="grid h-10 w-10 place-items-center rounded-2xl bg-white text-leaf-700">
                <Sparkles className="h-5 w-5" />
              </div>
              <div>
                <h3 className="font-black text-leaf-900">AI leaf analysis</h3>
                <p className="text-sm font-semibold text-green-950/64">
                  {isBackground ? "Retake the image with one leaf centered in good light." : "Guidance is prepared from the predicted condition."}
                </p>
              </div>
            </div>
          </div>

          {alternativePredictions.length > 0 && (
            <div className="mt-5">
              <button
                type="button"
                onClick={() => setShowAlternatives((value) => !value)}
                className="inline-flex w-full items-center justify-between rounded-2xl border border-leaf-200 bg-white px-4 py-3 text-left font-black text-leaf-900 transition hover:bg-leaf-50"
              >
                Other possible matches
                {showAlternatives ? <ChevronUp className="h-5 w-5 text-leaf-600" /> : <ChevronDown className="h-5 w-5 text-leaf-600" />}
              </button>
              {showAlternatives && (
                <div className="mt-3 space-y-3">
                  {alternativePredictions.map((item) => (
                    <div key={item.label} className="rounded-2xl border border-leaf-100 bg-leaf-50 p-4">
                      <div className="flex items-center gap-3 text-sm font-bold">
                        <span className="h-2 w-2 shrink-0 rounded-full bg-leaf-600" />
                        <span className="text-leaf-900">{displayDiseaseName(item.label)}</span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
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

            {!isBackground && (
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
            )}

            <div className="mt-5 rounded-2xl bg-leaf-50 p-4">
              <h3 className="font-black text-leaf-900">{labels.advice}</h3>
              <p className="mt-2 text-sm leading-6 text-green-950/72">{guidance.farmer_advice}</p>
            </div>

            {!isBackground && (
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
            )}

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
