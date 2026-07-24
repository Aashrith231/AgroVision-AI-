import { FollowUpReminder, ScanRecord } from "../types";
import { displayDiseaseName, cropFromDisease } from "./disease";

export type DayScans = {
  key: string; // local YYYY-MM-DD
  scans: ScanRecord[];
  hasDisease: boolean;
  allHealthy: boolean;
};

export type CalendarCell = {
  date: Date;
  key: string;
  inMonth: boolean;
  isToday: boolean;
  scans: ScanRecord[];
  hasDisease: boolean;
  allHealthy: boolean;
  reminders: FollowUpReminder[];
};

export type CalendarStats = {
  totalScans: number;
  activeDays: number;
  currentStreak: number;
  diseasedDays: number;
  topCrop: string | null;
};

function isHealthy(disease: string) {
  return /healthy/i.test(disease);
}

/** Local-timezone date key so grouping matches what the user sees on the clock. */
export function toDayKey(value: string | Date): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

export function groupScansByDay(scans: ScanRecord[]): Map<string, DayScans> {
  const map = new Map<string, DayScans>();
  for (const scan of scans) {
    const key = toDayKey(scan.createdAt);
    const existing = map.get(key);
    if (existing) {
      existing.scans.push(scan);
    } else {
      map.set(key, { key, scans: [scan], hasDisease: false, allHealthy: true });
    }
  }
  // for (const day of map.values()) {
  for (const day of Array.from(map.values())) {
    day.hasDisease = day.scans.some((s) => !isHealthy(s.prediction.disease));
    day.allHealthy = day.scans.every((s) => isHealthy(s.prediction.disease));
    day.scans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  }
  return map;
}

function groupRemindersByDay(reminders: FollowUpReminder[]): Map<string, FollowUpReminder[]> {
  const map = new Map<string, FollowUpReminder[]>();
  for (const reminder of reminders) {
    if (!reminder.dueAt) continue;
    const key = toDayKey(reminder.dueAt);
    const list = map.get(key) || [];
    list.push(reminder);
    map.set(key, list);
  }
  return map;
}

/** Builds a 6-row (42 cell) month grid starting on Sunday. */
export function buildMonthGrid(
  viewYear: number,
  viewMonth: number,
  scans: ScanRecord[],
  reminders: FollowUpReminder[],
  today: Date
): CalendarCell[] {
  const scanMap = groupScansByDay(scans);
  const reminderMap = groupRemindersByDay(reminders);
  const todayKey = toDayKey(today);

  const firstOfMonth = new Date(viewYear, viewMonth, 1);
  const gridStart = new Date(viewYear, viewMonth, 1 - firstOfMonth.getDay());

  const cells: CalendarCell[] = [];
  for (let i = 0; i < 42; i += 1) {
    const date = new Date(gridStart.getFullYear(), gridStart.getMonth(), gridStart.getDate() + i);
    const key = toDayKey(date);
    const day = scanMap.get(key);
    cells.push({
      date,
      key,
      inMonth: date.getMonth() === viewMonth,
      isToday: key === todayKey,
      scans: day?.scans || [],
      hasDisease: day?.hasDisease || false,
      allHealthy: day ? day.allHealthy : false,
      reminders: reminderMap.get(key) || []
    });
  }
  return cells;
}

export function computeStats(scans: ScanRecord[], today: Date): CalendarStats {
  const dayMap = groupScansByDay(scans);
  const totalScans = scans.length;
  const activeDays = dayMap.size;
  const diseasedDays = Array.from(dayMap.values()).filter((d) => d.hasDisease).length;

  // Current streak: consecutive days (ending today or yesterday) with at least one scan.
  let currentStreak = 0;
  const cursor = new Date(today.getFullYear(), today.getMonth(), today.getDate());
  if (!dayMap.has(toDayKey(cursor))) {
    cursor.setDate(cursor.getDate() - 1); // allow streak to still count if today has no scan yet
  }
  while (dayMap.has(toDayKey(cursor))) {
    currentStreak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  // Most-scanned crop across all diseased scans.
  const cropCounts = new Map<string, number>();
  for (const scan of scans) {
    if (isHealthy(scan.prediction.disease)) continue;
    const crop = cropFromDisease(scan.prediction.disease);
    cropCounts.set(crop, (cropCounts.get(crop) || 0) + 1);
  }
  let topCrop: string | null = null;
  let topCount = 0;
  // for (const [crop, count] of cropCounts.entries()) {
  for (const [crop, count] of Array.from(cropCounts.entries())) {
    if (count > topCount) {
      topCount = count;
      topCrop = crop;
    }
  }

  return { totalScans, activeDays, currentStreak, diseasedDays, topCrop };
}

export function formatDayLabel(key: string): string {
  const [year, month, day] = key.split("-").map(Number);
  return new Date(year, month - 1, day).toLocaleDateString(undefined, {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric"
  });
}

export function scanTitle(scan: ScanRecord): string {
  return displayDiseaseName(scan.prediction.disease);
}

export const MONTH_NAMES = [
  "January",
  "February",
  "March",
  "April",
  "May",
  "June",
  "July",
  "August",
  "September",
  "October",
  "November",
  "December"
];

export const WEEKDAY_LABELS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
