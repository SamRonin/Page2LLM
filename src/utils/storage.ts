import type { CustomPreset, Settings } from './types';

export const isExtension: boolean =
  typeof chrome !== 'undefined' && !!chrome.runtime?.id;

export const KEYS = {
  settings: 'p2llm.settings',
  customPresets: 'p2llm.presets',
} as const;

export const DEFAULT_SETTINGS: Settings = {
  theme: 'system',
  lang: 'fa',
  includeMeta: true,
  stripImages: false,
  activePresetId: 'summarize',
};

export async function storageGet<T>(key: string, fallback: T): Promise<T> {
  if (isExtension) {
    try {
      const bag = await chrome.storage.local.get(key);
      const value = bag[key];
      return value === undefined ? fallback : (value as T);
    } catch {
      return fallback;
    }
  }
  try {
    const raw = window.localStorage.getItem(key);
    return raw === null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export async function storageSet(key: string, value: unknown): Promise<void> {
  if (isExtension) {
    try {
      await chrome.storage.local.set({ [key]: value });
    } catch {
      /* storage unavailable — ignore */
    }
    return;
  }
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* storage unavailable — ignore */
  }
}

export async function loadSettings(): Promise<Settings> {
  const stored = await storageGet<Partial<Settings>>(KEYS.settings, {});
  return { ...DEFAULT_SETTINGS, ...stored };
}

export function saveSettings(settings: Settings): Promise<void> {
  return storageSet(KEYS.settings, settings);
}

export async function loadCustomPresets(): Promise<CustomPreset[]> {
  const stored = await storageGet<CustomPreset[]>(KEYS.customPresets, []);
  return Array.isArray(stored) ? stored : [];
}

export function saveCustomPresets(presets: CustomPreset[]): Promise<void> {
  return storageSet(KEYS.customPresets, presets);
}
