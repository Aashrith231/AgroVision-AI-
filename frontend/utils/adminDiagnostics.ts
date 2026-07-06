import { ApiDiagnostic } from "../types";

const DIAGNOSTICS_KEY = "rootsage:admin-diagnostics";
const MAX_DIAGNOSTICS = 30;

export function saveApiDiagnostic(entry: Omit<ApiDiagnostic, "id" | "createdAt">) {
  if (typeof window === "undefined") return;
  const diagnostic: ApiDiagnostic = {
    ...entry,
    id: `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    createdAt: new Date().toISOString(),
  };

  try {
    const existing = getApiDiagnostics();
    window.localStorage.setItem(DIAGNOSTICS_KEY, JSON.stringify([diagnostic, ...existing].slice(0, MAX_DIAGNOSTICS)));
  } catch {
    window.localStorage.removeItem(DIAGNOSTICS_KEY);
  }
}

export function getApiDiagnostics(): ApiDiagnostic[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = window.localStorage.getItem(DIAGNOSTICS_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export function clearApiDiagnostics() {
  if (typeof window === "undefined") return;
  window.localStorage.removeItem(DIAGNOSTICS_KEY);
}
