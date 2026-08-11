"use client";

import { useCallback, useSyncExternalStore } from "react";

export type PaginationMode = "classic" | "infinite";

const STORAGE_KEY = "admin.paginationMode";
const DEFAULT_MODE: PaginationMode = "classic";

type Listener = () => void;

const listeners = new Set<Listener>();

function isPaginationMode(value: unknown): value is PaginationMode {
  return value === "classic" || value === "infinite";
}

function readStoredMode(): PaginationMode {
  if (typeof window === "undefined") return DEFAULT_MODE;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (isPaginationMode(raw)) return raw;
  } catch {
    /* ignore */
  }
  return DEFAULT_MODE;
}

let currentMode: PaginationMode = DEFAULT_MODE;
let hydrated = false;

function getClientSnapshot(): PaginationMode {
  if (!hydrated) {
    currentMode = readStoredMode();
    hydrated = true;
  }
  return currentMode;
}

function getServerSnapshot(): PaginationMode {
  return DEFAULT_MODE;
}

function emit() {
  for (const listener of listeners) listener();
}

function subscribe(listener: Listener) {
  listeners.add(listener);
  return () => listeners.delete(listener);
}

export function setPaginationMode(mode: PaginationMode) {
  if (!isPaginationMode(mode)) return;
  currentMode = mode;
  hydrated = true;
  try {
    window.localStorage.setItem(STORAGE_KEY, mode);
  } catch {
    /* ignore */
  }
  emit();
}

export function usePaginationMode() {
  const mode = useSyncExternalStore(subscribe, getClientSnapshot, getServerSnapshot);
  const setMode = useCallback((next: PaginationMode) => {
    setPaginationMode(next);
  }, []);
  return [mode, setMode] as const;
}
