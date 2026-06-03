import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useState } from "react";
import { CalendarClock, CheckCircle2, History, Trash2, TrendingUp } from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Language } from "../i18n/translations";
import { useTranslation } from "../hooks/useTranslation";
import { FollowUpReminder, ScanRecord } from "../types";
import { displayDiseaseName, diseaseToSlug } from "../utils/disease";
import { clearScanHistory, getReminders, getScanHistory, saveDiseaseHandoff, updateReminder } from "../utils/storage";

export default function HistoryPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const t = useTranslation(language);

  function refresh() {
    setHistory(getScanHistory());
    setReminders(getReminders());
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <>
      <Head>
        <title>Scan History | AgroVision AI</title>
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main className="bg-leaf-50">
        <section className="border-b border-leaf-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Local records</p>
              <h1 className="mt-2 text-4xl font-black text-leaf-900">Scan History</h1>
              <p className="mt-3 text-sm font-semibold text-green-950/64">Saved only in this browser on this device.</p>
            </div>
            <button
              onClick={() => {
                clearScanHistory();
                refresh();
              }}
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-red-100 bg-white px-4 py-3 font-black text-red-700"
            >
              <Trash2 className="h-5 w-5" />
              Clear history
            </button>
          </div>
        </section>

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1fr_24rem] lg:px-8">
          <div className="space-y-4">
            {history.length === 0 && (
              <div className="rounded-3xl border border-leaf-100 bg-white p-8 text-center">
                <History className="mx-auto h-10 w-10 text-leaf-600" />
                <h2 className="mt-4 text-2xl font-black text-leaf-900">No scans yet</h2>
                <p className="mt-2 text-green-950/64">Run a diagnosis and it will appear here.</p>
              </div>
            )}
            {history.map((record) => (
              <article key={record.id} className="grid gap-4 rounded-3xl border border-leaf-100 bg-white p-4 shadow-sm sm:grid-cols-[9rem_1fr]">
                <div className="relative h-36 overflow-hidden rounded-2xl bg-leaf-50">
                  {record.imageDataUrl ? (
                    <Image src={record.imageDataUrl} alt="Scanned leaf" fill className="object-cover" sizes="144px" />
                  ) : (
                    <div className="grid h-full place-items-center text-leaf-600">
                      <History className="h-8 w-8" />
                    </div>
                  )}
                </div>
                <div>
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div>
                      <p className="text-xs font-black uppercase tracking-[0.14em] text-leaf-600">
                        {new Date(record.createdAt).toLocaleString()}
                      </p>
                      <h2 className="mt-1 text-2xl font-black text-leaf-900">{displayDiseaseName(record.prediction.disease)}</h2>
                    </div>
                    <span className="rounded-full bg-leaf-50 px-3 py-1 text-sm font-black text-leaf-700">Saved scan</span>
                  </div>
                  <p className="mt-3 line-clamp-2 text-sm font-semibold leading-6 text-green-950/68">{record.guidance.explanation}</p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <Link
                      href={`/disease/${diseaseToSlug(record.prediction.disease)}?lang=${language}`}
                      onClick={() => saveDiseaseHandoff(record.prediction, record.guidance, language)}
                      className="inline-flex rounded-full bg-leaf-600 px-4 py-2 text-sm font-black text-white"
                    >
                      Open details
                    </Link>
                    <Link
                      href={`/progress?scan=${record.id}`}
                      className="inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white px-4 py-2 text-sm font-black text-leaf-900"
                    >
                      <TrendingUp className="h-4 w-4 text-leaf-600" />
                      Track progress
                    </Link>
                  </div>
                </div>
              </article>
            ))}
          </div>

          <aside className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft">
            <div className="flex items-center gap-3">
              <CalendarClock className="h-6 w-6 text-leaf-600" />
              <h2 className="text-xl font-black text-leaf-900">Follow-ups</h2>
            </div>
            <div className="mt-4 space-y-3">
              {reminders.length === 0 && <p className="text-sm font-semibold leading-6 text-green-950/64">No reminders saved yet.</p>}
              {reminders.map((reminder) => (
                <div key={reminder.id} className="rounded-2xl bg-leaf-50 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="font-black text-leaf-900">{displayDiseaseName(reminder.disease)}</p>
                      <p className="mt-1 text-xs font-bold uppercase tracking-wide text-green-950/52">
                        Due {new Date(reminder.dueAt).toLocaleDateString()}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        updateReminder(reminder.id, { done: !reminder.done });
                        refresh();
                      }}
                      className={`rounded-full p-2 ${reminder.done ? "bg-leaf-600 text-white" : "bg-white text-leaf-700"}`}
                      aria-label="Toggle reminder"
                    >
                      <CheckCircle2 className="h-5 w-5" />
                    </button>
                  </div>
                  <p className="mt-2 text-sm leading-6 text-green-950/68">{reminder.note}</p>
                </div>
              ))}
            </div>
          </aside>
        </section>
      </main>
      <Footer brand={t.brand} />
    </>
  );
}
