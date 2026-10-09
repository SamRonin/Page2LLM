export type Theme = 'light' | 'dark' | 'system';
export type Lang = 'fa' | 'en';

export interface Settings {
  theme: Theme;
  lang: Lang;
  includeMeta: boolean;
  stripImages: boolean;
  activePresetId: string;
}

export interface CustomPreset {
  id: string;
  name: string;
  prompt: string;
}

export interface Preset {
  id: string;
  label: string;
  template: string;
  builtin: boolean;
}

export interface ArticleMeta {
  url: string;
  title: string;
  siteName: string | null;
  byline: string | null;
  publishedTime: string | null;
  lang: string | null;
  dir: 'ltr' | 'rtl';
  readerable: boolean;
  fallback: boolean;
  html: string;
  textLength: number;
}

export type ExtractionPayload =
  | ({ ok: true } & ArticleMeta)
  | { ok: false; reason: string };

export const MSG_EXTRACTED = 'P2L_EXTRACTED';
export const MSG_OPEN_TARGET = 'P2L_OPEN_TARGET';
