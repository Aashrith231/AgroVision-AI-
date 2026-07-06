import { FollowUpReminder, GuidanceResponse, PredictionResponse, ProgressRecord, ScanRecord } from "../types";

const HISTORY_KEY = "rootsage:scan-history";
const REMINDER_KEY = "rootsage:follow-up-reminders";
const PROGRESS_KEY = "rootsage:progress-records";

const LEGACY_STORAGE_KEYS: Record<string, string> = {
  "agrovision:scan-history": HISTORY_KEY,
  "agrovision:follow-up-reminders": REMINDER_KEY,
  "agrovision:progress-records": PROGRESS_KEY,
  "RootSage:scan-history": HISTORY_KEY,
  "RootSage:follow-up-reminders": REMINDER_KEY,
  "RootSage:progress-records": PROGRESS_KEY
};

function migrateLegacyStorage() {
  if (typeof window === "undefined") return;
  for (const [legacyKey, nextKey] of Object.entries(LEGACY_STORAGE_KEYS)) {
    const value = window.localStorage.getItem(legacyKey);
    if (value && !window.localStorage.getItem(nextKey)) {
      window.localStorage.setItem(nextKey, value);
    }
    if (value) window.localStorage.removeItem(legacyKey);
  }
}

export function getScanHistory(): ScanRecord[] {
  migrateLegacyStorage();
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(HISTORY_KEY) || "[]") as ScanRecord[];
  } catch {
    return [];
  }
}

export function saveScanRecord(record: Omit<ScanRecord, "id" | "createdAt">) {
  if (typeof window === "undefined") return undefined;
  const next: ScanRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  const history = [next, ...getScanHistory()].slice(0, 20);
  try {
    window.localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
  } catch {
    const compactHistory = [{ ...next, imageDataUrl: undefined }, ...getScanHistory().map((item) => ({ ...item, imageDataUrl: undefined }))].slice(0, 10);
    try {
      window.localStorage.setItem(HISTORY_KEY, JSON.stringify(compactHistory));
    } catch {
      window.localStorage.removeItem(HISTORY_KEY);
    }
  }
  return next;
}

export function clearScanHistory() {
  if (typeof window !== "undefined") window.localStorage.removeItem(HISTORY_KEY);
}

export function getProgressRecords(): ProgressRecord[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(window.localStorage.getItem(PROGRESS_KEY) || "[]") as ProgressRecord[];
  } catch {
    return [];
  }
}

export function saveProgressRecord(record: Omit<ProgressRecord, "id" | "createdAt">) {
  if (typeof window === "undefined") return undefined;
  const next: ProgressRecord = {
    ...record,
    id: crypto.randomUUID(),
    createdAt: new Date().toISOString()
  };
  const records = [next, ...getProgressRecords()].slice(0, 20);
  try {
    window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(records));
  } catch {
    const compactRecords = records.map((item) => ({
      ...item,
      previousScan: { ...item.previousScan, imageDataUrl: undefined },
      currentScan: { ...item.currentScan, imageDataUrl: undefined }
    }));
    try {
      window.localStorage.setItem(PROGRESS_KEY, JSON.stringify(compactRecords));
    } catch {
      window.localStorage.removeItem(PROGRESS_KEY);
    }
  }
  return next;
}

export function saveDiseaseHandoff(prediction: PredictionResponse, guidance: GuidanceResponse, language: string) {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(
    `rootsage:disease:${prediction.disease}:${language}`,
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
    reader.onload = () => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 420;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement("canvas");
        canvas.width = Math.max(1, Math.round(image.width * scale));
        canvas.height = Math.max(1, Math.round(image.height * scale));
        const context = canvas.getContext("2d");
        if (!context) {
          resolve(String(reader.result));
          return;
        }
        context.drawImage(image, 0, 0, canvas.width, canvas.height);
        resolve(canvas.toDataURL("image/jpeg", 0.58));
      };
      image.onerror = () => resolve(String(reader.result));
      image.src = String(reader.result);
    };
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}
