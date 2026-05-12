import { FollowUpReminder, GuidanceResponse, PredictionResponse, ScanRecord } from "../types";

const HISTORY_KEY = "agrovision:scan-history";
const REMINDER_KEY = "agrovision:follow-up-reminders";

export function getScanHistory(): ScanRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]") as ScanRecord[];
  } catch {
    return [];
  }
}

export function saveScanRecord(record: Omit<ScanRecord, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const next: ScanRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  const history = [next, ...getScanHistory()].slice(0, 30);
  window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
}

export function clearScanHistory() {
  if (typeof window !== "undefined") window.localStorage.removeItem(HISTORY_KEY);
}

export function saveDiseaseHandoff(prediction: PredictionResponse, guidance: GuidanceResponse, language: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `agrovision:disease:${prediction.disease}:${language}`,
    JSON.stringify({ prediction, guidance, language, savedAt: Date.now() })
  );
}

export function getReminders(): FollowUpReminder[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(REMINDER_KEY) || "[]") as FollowUpReminder[];
  } catch {
    return [];
  }
}

export function saveReminder(reminder: Omit<FollowUpReminder, "id" | "done">) {
  if (typeof window === "undefined") return;
  const next: FollowUpReminder = { ...reminder, id: crypto.randomUUID(), done: false };
  window.localStorage.setItem(REMINDER_KEY, JSON.stringify([next, ...getReminders()].slice(0, 20)));
}

export function updateReminder(id: string, updates: Partial<FollowUpReminder>) {
  if (typeof window === "undefined") return;
  const reminders = getReminders().map((item) => (item.id === id ? { ...item, ...updates } : item));
  window.localStorage.setItem(REMINDER_KEY, JSON.stringify(reminders));
}

export function fileToDataUrl(file: File): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
