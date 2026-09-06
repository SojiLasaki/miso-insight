import type { MisoResponse } from "./types";

/**
 * Tiny client-side store holding the most recent orchestration response so the
 * Canvas experience can inspect and edit it. No credentials are ever stored.
 */
let current: MisoResponse | null = null;
const listeners = new Set<() => void>();

export function setLastResponse(response: MisoResponse) {
  current = response;
  if (typeof window !== "undefined") {
    window.sessionStorage.setItem("miso:last-response", JSON.stringify(response));
  }
  listeners.forEach((l) => l());
}

export function getLastResponse(): MisoResponse | null {
  if (current) return current;
  if (typeof window === "undefined") return null;
  const raw = window.sessionStorage.getItem("miso:last-response");
  if (!raw) return null;
  try {
    current = JSON.parse(raw) as MisoResponse;
    return current;
  } catch {
    return null;
  }
}

export function subscribeLastResponse(listener: () => void) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}
