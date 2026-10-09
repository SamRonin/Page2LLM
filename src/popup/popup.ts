import 'vazirmatn/Vazirmatn-Variable-font-face.css';
import './popup.css';

import { applyI18n, formatNumber, setLang, t } from '../utils/i18n';
import { buildMetadataHeader, htmlToMarkdown } from '../utils/markdown';
import { applyPreset, getBuiltinPresets, mapCustomPresets } from '../utils/presets';
import {
  isExtension,
  loadCustomPresets,
  loadSettings,
  saveCustomPresets,
  saveSettings,
} from '../utils/storage';
import {
  countCharacters,
  countWords,
  estimateReadingMinutes,
  estimateTokens,
} from '../utils/tokens';
import { MSG_EXTRACTED, MSG_OPEN_TARGET } from '../utils/types';
import type {
  ArticleMeta,
  CustomPreset,
  ExtractionPayload,
  Preset,
  Settings,
} from '../utils/types';
import { DEMO_ARTICLE } from '../demo/sample';

type Status = 'loading' | 'ready' | 'error';
type Panel = 'preview' | 'presets';

interface State {
  settings: Settings;
  customPresets: CustomPreset[];
  meta: ArticleMeta | null;
  markdown: string;
  finalOutput: string;
  panel: Panel;
  status: Status;
  tabId: number | null;
  extractionTimer: number | undefined;
}

const state: State = {
  settings: {
    theme: 'system',
    lang: 'fa',
    includeMeta: true,
    stripImages: false,
    activePresetId: 'summarize',
  },
  customPresets: [],
  meta: null,
  markdown: '',
  finalOutput: '',
  panel: 'preview',
  status: 'loading',
  tabId: null,
  extractionTimer: undefined,
};

const TRASH_SVG =
  '<svg class="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/><path d="M10 11v6M14 11v6"/></svg>';

function el<K extends keyof HTMLElementTagNameMap>(
  tag: K,
  className?: string,
): HTMLElementTagNameMap[K] {
  const node = document.createElement(tag);
  if (className) node.className = className;
  return node;
}

function byId<T extends Element>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Popup element #${id} is missing`);
  return node as unknown as T;
}

const els = {
  btnLang: byId<HTMLButtonElement>('btn-lang'),
  langLabel: byId<HTMLSpanElement>('lang-label'),
  btnTheme: byId<HTMLButtonElement>('btn-theme'),
  iconSun: byId<SVGElement>('icon-sun'),
  iconMoon: byId<SVGElement>('icon-moon'),
  siteTitle: byId<HTMLSpanElement>('site-title'),
  siteHost: byId<HTMLSpanElement>('site-host'),
  tabBtnPreview: byId<HTMLButtonElement>('tab-btn-preview'),
  tabBtnPresets: byId<HTMLButtonElement>('tab-btn-presets'),
  panelPreview: byId<HTMLElement>('panel-preview'),
  panelPresets: byId<HTMLElement>('panel-presets'),
  statWords: byId<HTMLDivElement>('stat-words'),
  statTokens: byId<HTMLDivElement>('stat-tokens'),
  statChars: byId<HTMLDivElement>('stat-chars'),
  statRead: byId<HTMLDivElement>('stat-read'),
  presetPills: byId<HTMLDivElement>('preset-pills'),
  presetList: byId<HTMLDivElement>('preset-list'),
  fallbackNotice: byId<HTMLParagraphElement>('fallback-notice'),
  preview: byId<HTMLPreElement>('preview'),
  optMeta: byId<HTMLInputElement>('opt-meta'),
  optImages: byId<HTMLInputElement>('opt-images'),
  presetForm: byId<HTMLFormElement>('preset-form'),
  presetName: byId<HTMLInputElement>('preset-name'),
  presetTemplate: byId<HTMLTextAreaElement>('preset-template'),
  btnCopy: byId<HTMLButtonElement>('btn-copy'),
  copyLabel: byId<HTMLSpanElement>('copy-label'),
  btnChatGPT: byId<HTMLButtonElement>('btn-chatgpt'),
  btnClaude: byId<HTMLButtonElement>('btn-claude'),
  statusLoading: byId<HTMLDivElement>('status-loading'),
  statusError: byId<HTMLDivElement>('status-error'),
  errorText: byId<HTMLParagraphElement>('error-text'),
  btnRetry: byId<HTMLButtonElement>('btn-retry'),
  toast: byId<HTMLDivElement>('toast'),
};

function isDemoMode(): boolean {
  return !isExtension || new URLSearchParams(window.location.search).has('demo');
}

function allPresets(): Preset[] {
  return [
    ...getBuiltinPresets(state.settings.lang),
    ...mapCustomPresets(state.customPresets),
  ];
}

function activePreset(): Preset | undefined {
  const presets = allPresets();
  return (
    presets.find((preset) => preset.id === state.settings.activePresetId) ??
    presets[0]
  );
}

function applyTheme(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const dark =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && prefersDark);
  document.documentElement.classList.toggle('dark', dark);
  els.iconSun.classList.toggle('hidden', !dark);
  els.iconMoon.classList.toggle('hidden', dark);
}

function setPanel(panel: Panel): void {
  state.panel = panel;
  els.tabBtnPreview.setAttribute('aria-selected', String(panel === 'preview'));
  els.tabBtnPresets.setAttribute('aria-selected', String(panel === 'presets'));
  els.panelPreview.classList.toggle('hidden', panel !== 'preview');
  els.panelPresets.classList.toggle('hidden', panel !== 'presets');
}

function setStatus(status: Status): void {
  state.status = status;
  els.statusLoading.classList.toggle('hidden', status !== 'loading');
  els.statusError.classList.toggle('hidden', status !== 'error');
}

function showError(messageKey: string): void {
  els.errorText.textContent = t(messageKey);
  setStatus('error');
}

let toastTimer: number | undefined;

function showToast(message: string): void {
  els.toast.textContent = message;
  els.toast.classList.add('show');
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => els.toast.classList.remove('show'), 2200);
}

function renderSiteInfo(url: string, title: string): void {
  let host = url;
  try {
    host = new URL(url).hostname.replace(/^www\./, '');
  } catch {
    /* keep raw url */
  }
  els.siteTitle.textContent = title || host;
  els.siteTitle.title = title;
  els.siteHost.textContent = host;
}

function renderStats(): void {
  const text = state.finalOutput;
  if (!text) {
    els.statWords.textContent = '—';
    els.statTokens.textContent = '—';
    els.statChars.textContent = '—';
    els.statRead.textContent = '—';
    return;
  }
  const words = countWords(text);
  els.statWords.textContent = formatNumber(words);
  els.statTokens.textContent = formatNumber(estimateTokens(text));
  els.statChars.textContent = formatNumber(countCharacters(text));
  els.statRead.textContent = formatNumber(
    estimateReadingMinutes(countWords(state.markdown)),
  );
}

function renderPreview(): void {
  els.preview.textContent = state.finalOutput || '—';
  els.preview.scrollTop = 0;
  els.fallbackNotice.classList.toggle(
    'hidden',
    !(state.meta?.fallback && state.finalOutput.length > 0),
  );
}

function rebuild(): void {
  const meta = state.meta;
  if (!meta) return;

  state.markdown = htmlToMarkdown(meta.html, {
    stripImages: state.settings.stripImages,
  });

  if (state.markdown.trim().length < 40 && meta.fallback) {
    showError('errorNoContent');
    return;
  }

  const body = state.settings.includeMeta
    ? buildMetadataHeader(meta) + state.markdown
    : state.markdown;
  const preset = activePreset();
  state.finalOutput = preset ? applyPreset(preset.template, body) : body;

  renderPreview();
  renderStats();
}

function selectPreset(id: string): void {
  state.settings.activePresetId = id;
  void saveSettings(state.settings);
  renderPresetPills();
  renderPresetList();
  rebuild();
}

function renderPresetPills(): void {
  els.presetPills.replaceChildren();
  for (const preset of allPresets()) {
    const btn = el('button', 'pill');
    btn.type = 'button';
    btn.textContent = preset.label;
    btn.setAttribute(
      'aria-pressed',
      String(preset.id === state.settings.activePresetId),
    );
    btn.addEventListener('click', () => selectPreset(preset.id));
    els.presetPills.append(btn);
  }
}

function renderPresetList(): void {
  els.presetList.replaceChildren();
  for (const preset of allPresets()) {
    const card = el('label', 'preset-card');
    const input = el('input', 'sr-only');
    input.type = 'radio';
    input.name = 'p2llm-preset';
    input.value = preset.id;
    input.checked = preset.id === state.settings.activePresetId;
    input.addEventListener('change', () => {
      if (input.checked) selectPreset(preset.id);
    });

    const row = el('div', 'flex items-start justify-between gap-2');
    const info = el('div', 'min-w-0');
    const name = el('div', 'text-xs font-bold');
    name.textContent = preset.label;
    const excerpt = el(
      'div',
      'mt-1 line-clamp-2 text-[10px] leading-4 text-zinc-500 dark:text-zinc-400',
    );
    excerpt.textContent = preset.template.replace(/\s+/g, ' ').slice(0, 140);
    info.append(name, excerpt);
    row.append(info);

    if (!preset.builtin) {
      const remove = el(
        'button',
        'shrink-0 rounded-md p-1 text-zinc-400 transition hover:bg-red-500/10 hover:text-red-500',
      );
      remove.type = 'button';
      remove.setAttribute('aria-label', t('deletePreset'));
      remove.innerHTML = TRASH_SVG;
      remove.addEventListener('click', (event) => {
        event.preventDefault();
        event.stopPropagation();
        void removeCustomPreset(preset.id);
      });
      row.append(remove);
    }

    card.append(input, row);
    els.presetList.append(card);
  }
}

async function removeCustomPreset(id: string): Promise<void> {
  state.customPresets = state.customPresets.filter(
    (preset) => preset.id !== id,
  );
  await saveCustomPresets(state.customPresets);
  if (state.settings.activePresetId === id) {
    state.settings.activePresetId = 'summarize';
    await saveSettings(state.settings);
  }
  renderPresetPills();
  renderPresetList();
  rebuild();
  showToast(t('presetDeleted'));
}

async function addCustomPreset(event: Event): Promise<void> {
  event.preventDefault();
  const name = els.presetName.value.trim();
  const prompt = els.presetTemplate.value.trim();
  if (!name) {
    showToast(t('presetNameRequired'));
    return;
  }
  if (state.customPresets.length >= 10) {
    showToast(t('presetLimit'));
    return;
  }
  const preset: CustomPreset = { id: `custom-${Date.now()}`, name, prompt };
  state.customPresets.push(preset);
  await saveCustomPresets(state.customPresets);
  state.settings.activePresetId = preset.id;
  await saveSettings(state.settings);
  els.presetForm.reset();
  renderPresetPills();
  renderPresetList();
  rebuild();
  showToast(t('presetSaved'));
}

async function copyText(text: string): Promise<boolean> {
  if (!text) return false;
  try {
    await navigator.clipboard.writeText(text);
    return true;
  } catch {
    try {
      const helper = el('textarea', 'sr-only');
      helper.value = text;
      document.body.append(helper);
      helper.select();
      const ok = document.execCommand('copy');
      helper.remove();
      return ok;
    } catch {
      return false;
    }
  }
}

async function handleCopy(): Promise<void> {
  const ok = await copyText(state.finalOutput);
  if (!ok) {
    showToast(t('copyFail'));
    return;
  }
  els.copyLabel.textContent = t('copied');
  window.setTimeout(() => {
    els.copyLabel.textContent = t('copy');
  }, 1600);
  showToast(t('copied'));
}

async function handleSend(target: 'chatgpt' | 'claude'): Promise<void> {
  const copied = await copyText(state.finalOutput);
  if (!copied) {
    showToast(t('copyFail'));
    return;
  }
  const url = target === 'chatgpt' ? 'https://chatgpt.com/' : 'https://claude.ai/new';
  if (isExtension) {
    try {
      const res = (await chrome.runtime.sendMessage({
        type: MSG_OPEN_TARGET,
        url,
      })) as { ok?: boolean } | undefined;
      if (!res?.ok) await chrome.tabs.create({ url, active: true });
    } catch {
      try {
        await chrome.tabs.create({ url, active: true });
      } catch {
        /* ignore */
      }
    }
  } else {
    window.open(url, '_blank', 'noopener');
  }
  showToast(t('sendHint'));
}

function handleThemeToggle(): void {
  const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
  const darkNow =
    state.settings.theme === 'dark' ||
    (state.settings.theme === 'system' && prefersDark);
  state.settings.theme = darkNow ? 'light' : 'dark';
  void saveSettings(state.settings);
  applyTheme();
}

async function handleLangToggle(): Promise<void> {
  state.settings.lang = state.settings.lang === 'fa' ? 'en' : 'fa';
  await saveSettings(state.settings);
  refreshLanguage();
}

function refreshLanguage(): void {
  setLang(state.settings.lang);
  applyI18n();
  els.langLabel.textContent = state.settings.lang === 'fa' ? 'EN' : 'FA';
  renderPresetPills();
  renderPresetList();
  renderStats();
  if (state.meta) rebuild();
}

function registerMessageListener(): void {
  chrome.runtime.onMessage.addListener((message: unknown, sender) => {
    if (typeof message !== 'object' || message === null) return;
    const typed = message as { type?: unknown; payload?: unknown };
    if (typed.type !== MSG_EXTRACTED) return;
    if (sender.tab?.id !== state.tabId) return;

    window.clearTimeout(state.extractionTimer);
    const payload = typed.payload as ExtractionPayload | undefined;
    if (!payload || !payload.ok) {
      showError('errorRestricted');
      return;
    }
    state.meta = payload;
    renderSiteInfo(payload.url, payload.title);
    setStatus('ready');
    rebuild();
  });
}

async function getActiveTab(): Promise<chrome.tabs.Tab | null> {
  try {
    const [tab] = await chrome.tabs.query({ active: true, currentWindow: true });
    return tab ?? null;
  } catch {
    return null;
  }
}

function startExtractionTimeout(): void {
  state.extractionTimer = window.setTimeout(() => {
    if (state.status === 'loading') showError('errorTimeout');
  }, 12000);
}

async function extractFromActiveTab(): Promise<void> {
  const tab = await getActiveTab();
  if (!tab?.id) {
    showError('errorTimeout');
    return;
  }
  if (!/^https?:/i.test(tab.url ?? '')) {
    showError('errorRestricted');
    return;
  }
  state.tabId = tab.id;
  renderSiteInfo(tab.url ?? '', tab.title ?? '');
  registerMessageListener();
  startExtractionTimeout();
  try {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ['content/extractor.js'],
    });
  } catch {
    window.clearTimeout(state.extractionTimer);
    showError('errorRestricted');
  }
}

async function loadDemo(): Promise<void> {
  await new Promise((resolve) => window.setTimeout(resolve, 350));
  state.meta = { ...DEMO_ARTICLE };
  renderSiteInfo(DEMO_ARTICLE.url, DEMO_ARTICLE.title);
  setStatus('ready');
  rebuild();
}

function wireEvents(): void {
  els.tabBtnPreview.addEventListener('click', () => setPanel('preview'));
  els.tabBtnPresets.addEventListener('click', () => setPanel('presets'));
  els.btnTheme.addEventListener('click', handleThemeToggle);
  els.btnLang.addEventListener('click', () => {
    void handleLangToggle();
  });
  els.optMeta.addEventListener('change', () => {
    state.settings.includeMeta = els.optMeta.checked;
    void saveSettings(state.settings);
    rebuild();
  });
  els.optImages.addEventListener('change', () => {
    state.settings.stripImages = els.optImages.checked;
    void saveSettings(state.settings);
    rebuild();
  });
  els.presetForm.addEventListener('submit', (event) => {
    void addCustomPreset(event);
  });
  els.btnCopy.addEventListener('click', () => {
    void handleCopy();
  });
  els.btnChatGPT.addEventListener('click', () => {
    void handleSend('chatgpt');
  });
  els.btnClaude.addEventListener('click', () => {
    void handleSend('claude');
  });
  els.btnRetry.addEventListener('click', () => window.location.reload());
  window
    .matchMedia('(prefers-color-scheme: dark)')
    .addEventListener('change', () => {
      if (state.settings.theme === 'system') applyTheme();
    });
}

async function init(): Promise<void> {
  state.settings = await loadSettings();
  state.customPresets = await loadCustomPresets();

  els.optMeta.checked = state.settings.includeMeta;
  els.optImages.checked = state.settings.stripImages;

  refreshLanguage();
  applyTheme();
  setPanel('preview');
  setStatus('loading');
  wireEvents();

  if (isDemoMode()) {
    await loadDemo();
    return;
  }
  await extractFromActiveTab();
}

void init();
