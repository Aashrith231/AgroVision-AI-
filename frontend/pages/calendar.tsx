import Head from "next/head";
import Image from "next/image";
import Link from "next/link";
import type React from "react";
import { useEffect, useMemo, useState } from "react";
import {
  Activity,
  CalendarDays,
  ChevronLeft,
  ChevronRight,
  Flame,
  Leaf,
  ShieldAlert,
  Sprout,
  TrendingUp
} from "lucide-react";
import { Footer } from "../components/Footer";
import { Header } from "../components/Header";
import { Language } from "../i18n/translations";
import { useTranslation } from "../hooks/useTranslation";
import { FollowUpReminder, ScanRecord } from "../types";
import { diseaseToSlug } from "../utils/disease";
import { getReminders, getScanHistory, saveDiseaseHandoff } from "../utils/storage";
import {
  buildMonthGrid,
  CalendarCell,
  computeStats,
  formatDayLabel,
  MONTH_NAMES,
  scanTitle,
  WEEKDAY_LABELS
} from "../utils/calendar";

export default function CalendarPage() {
  const [language, setLanguage] = useState<Language>("en");
  const [history, setHistory] = useState<ScanRecord[]>([]);
  const [reminders, setReminders] = useState<FollowUpReminder[]>([]);
  const [today, setToday] = useState<Date | null>(null);
  const [viewYear, setViewYear] = useState<number>(2026);
  const [viewMonth, setViewMonth] = useState<number>(6);
  const [selectedKey, setSelectedKey] = useState<string | null>(null);
  const t = useTranslation(language);

  useEffect(() => {
    const now = new Date();
    setToday(now);
    setViewYear(now.getFullYear());
    setViewMonth(now.getMonth());
    setHistory(getScanHistory());
    setReminders(getReminders());
  }, []);

  const stats = useMemo(() => (today ? computeStats(history, today) : null), [history, today]);

  const cells = useMemo(
    () => (today ? buildMonthGrid(viewYear, viewMonth, history, reminders, today) : []),
    [viewYear, viewMonth, history, reminders, today]
  );

  const selectedCell = useMemo(
    () => cells.find((cell) => cell.key === selectedKey) || null,
    [cells, selectedKey]
  );

  function changeMonth(delta: number) {
    const next = new Date(viewYear, viewMonth + delta, 1);
    setViewYear(next.getFullYear());
    setViewMonth(next.getMonth());
    setSelectedKey(null);
  }

  function goToday() {
    if (!today) return;
    setViewYear(today.getFullYear());
    setViewMonth(today.getMonth());
    setSelectedKey(null);
  }

  return (
    <>
      <Head>
        <title>Scan Calendar | RootSage AI</title>
        <meta name="description" content="Track which days you scanned crops and when plant disease was detected." />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      <Header brand={t.brand} language={language} setLanguage={setLanguage} />
      <main className="bg-leaf-50">
        <section className="border-b border-leaf-100 bg-white">
          <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-8 sm:flex-row sm:items-end sm:justify-between sm:px-6 lg:px-8">
            <div>
              <p className="text-sm font-black uppercase tracking-[0.18em] text-leaf-600">Monitoring timeline</p>
              <h1 className="mt-2 text-4xl font-black text-leaf-900">Scan Calendar</h1>
              <p className="mt-3 text-sm font-semibold text-green-950/64">
                See which days you checked your crops, when disease showed up, and upcoming follow-ups.
              </p>
            </div>
            <Link
              href="/history"
              className="inline-flex items-center justify-center gap-2 rounded-2xl border border-leaf-200 bg-white px-4 py-3 font-black text-leaf-900"
            >
              <Activity className="h-5 w-5 text-leaf-600" />
              Open history
            </Link>
          </div>
        </section>

        {stats && (
          <section className="mx-auto grid max-w-7xl gap-4 px-4 pt-8 sm:grid-cols-2 sm:px-6 lg:grid-cols-4 lg:px-8">
            <StatCard icon={<CalendarDays className="h-5 w-5" />} label="Active scan days" value={String(stats.activeDays)} />
            <StatCard icon={<Flame className="h-5 w-5" />} label="Current streak" value={`${stats.currentStreak} ${stats.currentStreak === 1 ? "day" : "days"}`} />
            <StatCard icon={<ShieldAlert className="h-5 w-5" />} label="Days with disease" value={String(stats.diseasedDays)} tone={stats.diseasedDays > 0 ? "warn" : "good"} />
            <StatCard icon={<Sprout className="h-5 w-5" />} label="Most affected crop" value={stats.topCrop || "None yet"} />
          </section>
        )}

        <section className="mx-auto grid max-w-7xl gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[1.35fr_1fr] lg:px-8">
          <div className="rounded-3xl border border-leaf-100 bg-white p-4 shadow-soft sm:p-6">
            <div className="flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-leaf-900">
                {MONTH_NAMES[viewMonth]} {viewYear}
              </h2>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => changeMonth(-1)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-leaf-200 bg-white text-leaf-800 hover:border-leaf-500"
                  aria-label="Previous month"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>
                <button
                  onClick={goToday}
                  className="rounded-xl border border-leaf-200 bg-white px-3 py-2 text-sm font-black text-leaf-800 hover:border-leaf-500"
                >
                  Today
                </button>
                <button
                  onClick={() => changeMonth(1)}
                  className="grid h-10 w-10 place-items-center rounded-xl border border-leaf-200 bg-white text-leaf-800 hover:border-leaf-500"
                  aria-label="Next month"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>

            <div className="mt-5 grid grid-cols-7 gap-1 text-center">
              {WEEKDAY_LABELS.map((label) => (
                <div key={label} className="pb-2 text-xs font-black uppercase tracking-wide text-green-950/45">
                  {label}
                </div>
              ))}
              {cells.map((cell) => (
                <CalendarDayCell
                  key={cell.key}
                  cell={cell}
                  selected={cell.key === selectedKey}
                  onSelect={() => setSelectedKey(cell.key === selectedKey ? null : cell.key)}
                />
              ))}
            </div>

            <div className="mt-5 flex flex-wrap gap-4 text-xs font-bold text-green-950/60">
              <LegendDot className="bg-leaf-500" label="Healthy scan" />
              <LegendDot className="bg-red-500" label="Disease detected" />
              <LegendDot className="bg-amber-400" label="Follow-up due" />
            </div>
          </div>

          <aside className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft sm:p-6">
            {!selectedCell && (
              <div className="grid h-full min-h-[16rem] place-items-center text-center">
                <div>
                  <CalendarDays className="mx-auto h-10 w-10 text-leaf-600" />
                  <h3 className="mt-4 text-xl font-black text-leaf-900">Pick a day</h3>
                  <p className="mt-2 text-sm font-semibold text-green-950/60">
                    Tap any date to see the scans and follow-ups recorded on it.
                  </p>
                </div>
              </div>
            )}

            {selectedCell && (
              <div>
                <p className="text-xs font-black uppercase tracking-[0.14em] text-leaf-600">Selected day</p>
                <h3 className="mt-1 text-xl font-black text-leaf-900">{formatDayLabel(selectedCell.key)}</h3>

                {selectedCell.reminders.length > 0 && (
                  <div className="mt-4 rounded-2xl border border-amber-100 bg-amber-50 p-4">
                    <p className="text-xs font-black uppercase tracking-wide text-amber-700">Follow-ups due</p>
                    {selectedCell.reminders.map((reminder) => (
                      <p key={reminder.id} className="mt-2 text-sm font-semibold leading-6 text-amber-900">
                        {reminder.note || "Recheck this plant."}
                      </p>
                    ))}
                  </div>
                )}

                <div className="mt-4 space-y-3">
                  {selectedCell.scans.length === 0 && (
                    <p className="rounded-2xl bg-leaf-50 p-4 text-sm font-semibold text-green-950/64">
                      No scans recorded on this day.
                    </p>
                  )}
                  {selectedCell.scans.map((scan) => {
                    const healthy = /healthy/i.test(scan.prediction.disease);
                    return (
                      <Link
                        key={scan.id}
                        href={`/disease/${diseaseToSlug(scan.prediction.disease)}?lang=${language}`}
                        onClick={() => saveDiseaseHandoff(scan.prediction, scan.guidance, language)}
                        className="flex items-center gap-3 rounded-2xl border border-leaf-100 bg-[#fbfef9] p-3 transition hover:border-leaf-300"
                      >
                        <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl bg-leaf-50">
                          {scan.imageDataUrl ? (
                            <Image src={scan.imageDataUrl} alt="Scanned leaf" fill className="object-cover" sizes="56px" />
                          ) : (
                            <div className="grid h-full place-items-center text-leaf-600">
                              <Leaf className="h-5 w-5" />
                            </div>
                          )}
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="truncate font-black text-leaf-900">{scanTitle(scan)}</p>
                          <p className="text-xs font-bold uppercase tracking-wide text-green-950/50">
                            {new Date(scan.createdAt).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                          </p>
                        </div>
                        <span
                          className={`rounded-full px-3 py-1 text-xs font-black ${
                            healthy ? "bg-leaf-100 text-leaf-700" : "bg-red-100 text-red-700"
                          }`}
                        >
                          {healthy ? "Healthy" : "Disease"}
                        </span>
                      </Link>
                    );
                  })}
                </div>

                {selectedCell.scans.length >= 2 && (
                  <Link
                    href={`/progress?scan=${selectedCell.scans[0].id}`}
                    className="mt-4 inline-flex items-center gap-2 rounded-full border border-leaf-200 bg-white px-4 py-2 text-sm font-black text-leaf-900"
                  >
                    <TrendingUp className="h-4 w-4 text-leaf-600" />
                    Compare this day&apos;s scans
                  </Link>
                )}
              </div>
            )}
          </aside>
        </section>
      </main>
      <Footer brand={t.brand} />
    </>
  );
}

function CalendarDayCell({ cell, selected, onSelect }: { cell: CalendarCell; selected: boolean; onSelect: () => void }) {
  const hasScans = cell.scans.length > 0;
  const base =
    "relative flex aspect-square flex-col items-center justify-center rounded-xl border text-sm font-black transition";
  const tone = !cell.inMonth
    ? "border-transparent text-green-950/25"
    : cell.hasDisease
    ? "border-red-200 bg-red-50 text-red-800 hover:border-red-400"
    : hasScans
    ? "border-leaf-200 bg-leaf-50 text-leaf-800 hover:border-leaf-500"
    : "border-leaf-50 bg-white text-green-950/70 hover:border-leaf-200";
  const ring = selected ? "ring-2 ring-leaf-600 ring-offset-1" : cell.isToday ? "ring-1 ring-leaf-400" : "";

  return (
    <button onClick={onSelect} className={`${base} ${tone} ${ring}`} aria-label={cell.key}>
      <span>{cell.date.getDate()}</span>
      <span className="mt-1 flex h-2 items-center gap-0.5">
        {hasScans && (
          <span className={`h-1.5 w-1.5 rounded-full ${cell.hasDisease ? "bg-red-500" : "bg-leaf-500"}`} />
        )}
        {cell.scans.length > 1 && (
          <span className="text-[9px] font-black leading-none text-green-950/45">{cell.scans.length}</span>
        )}
        {cell.reminders.length > 0 && <span className="h-1.5 w-1.5 rounded-full bg-amber-400" />}
      </span>
    </button>
  );
}

function StatCard({
  icon,
  label,
  value,
  tone = "neutral"
}: {
  icon: React.ReactNode;
  label: string;
  value: string;
  tone?: "neutral" | "good" | "warn";
}) {
  const accent = tone === "warn" ? "bg-amber-100 text-amber-700" : tone === "good" ? "bg-leaf-100 text-leaf-700" : "bg-leaf-100 text-leaf-700";
  return (
    <div className="rounded-3xl border border-leaf-100 bg-white p-5 shadow-soft">
      <div className={`grid h-11 w-11 place-items-center rounded-2xl ${accent}`}>{icon}</div>
      <p className="mt-4 text-xs font-black uppercase tracking-[0.14em] text-green-950/45">{label}</p>
      <p className="mt-1 text-2xl font-black text-leaf-900">{value}</p>
    </div>
  );
}

function LegendDot({ className, label }: { className: string; label: string }) {
  return (
    <span className="inline-flex items-center gap-2">
      <span className={`h-2.5 w-2.5 rounded-full ${className}`} />
      {label}
    </span>
  );
}
