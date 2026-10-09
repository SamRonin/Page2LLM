import type { Lang } from './types';

type Dict = Record<string, string>;

const fa: Dict = {
  tagline: 'متن صفحه را برای مدل‌های زبانی آماده کن',
  tabPreview: 'پیش‌نمایش',
  tabPresets: 'قالب‌ها',
  statWords: 'واژه',
  statTokens: 'توکن',
  statChars: 'نویسه',
  statRead: 'دقیقه مطالعه',
  copy: 'کپی برای LLM',
  copied: 'کپی شد!',
  copyFail: 'کپی ناموفق بود',
  sendHint: 'محتوا کپی شد؛ در تب جدید با Ctrl+V بچسبانید',
  loading: 'در حال استخراج محتوای صفحه…',
  errorRestricted: 'استخراج در این صفحه ممکن نیست (صفحات سیستمی مرورگر یا فروشگاه کروم)',
  errorTimeout: 'پاسخی از صفحه دریافت نشد. دوباره تلاش کنید',
  errorNoContent: 'متنی برای استخراج در این صفحه پیدا نشد',
  fallbackNotice: 'ساختار اصلی صفحه شناسایی نشد؛ حالت جایگزین استفاده شد',
  retry: 'تلاش مجدد',
  presetsTitle: 'قالب پرامپت فعال',
  optionsTitle: 'گزینه‌های خروجی',
  includeMeta: 'درج اطلاعات صفحه (عنوان، نویسنده، منبع)',
  stripImages: 'حذف تصاویر از خروجی',
  addPresetTitle: 'افزودن قالب دلخواه',
  presetNamePh: 'نام قالب (مثلاً: ترجمه به انگلیسی)',
  presetTemplatePh: 'متن پرامپت… از {{content}} به‌عنوان جایگاه محتوا استفاده کنید',
  templateHint: 'اگر {{content}} را ننویسید، محتوا به‌صورت خودکار به انتهای پرامپت اضافه می‌شود',
  savePreset: 'افزودن قالب',
  deletePreset: 'حذف قالب',
  presetNameRequired: 'نام قالب را وارد کنید',
  presetSaved: 'قالب ذخیره شد',
  presetDeleted: 'قالب حذف شد',
  presetLimit: 'به حداکثر تعداد قالب‌های دلخواه (۱۰) رسیده‌اید',
  themeToggle: 'تغییر پوسته روشن/تیره',
  langToggle: 'تغییر زبان / Switch language',
  metaSource: 'منبع',
  metaAuthor: 'نویسنده',
  metaPublished: 'تاریخ انتشار',
  metaSite: 'وب‌سایت',
};

const en: Dict = {
  tagline: 'Turn any page into clean Markdown for LLMs',
  tabPreview: 'Preview',
  tabPresets: 'Presets',
  statWords: 'words',
  statTokens: 'tokens',
  statChars: 'chars',
  statRead: 'min read',
  copy: 'Copy for LLM',
  copied: 'Copied!',
  copyFail: 'Copy failed',
  sendHint: 'Content copied — paste it in the new tab with Ctrl+V',
  loading: 'Extracting page content…',
  errorRestricted: 'Extraction is not possible here (browser system pages or Chrome Web Store)',
  errorTimeout: 'No response from the page. Please try again',
  errorNoContent: 'No readable text found on this page',
  fallbackNotice: 'Main article not detected — fallback extraction was used',
  retry: 'Retry',
  presetsTitle: 'Active prompt preset',
  optionsTitle: 'Output options',
  includeMeta: 'Include page info (title, author, source)',
  stripImages: 'Strip images from output',
  addPresetTitle: 'Add custom preset',
  presetNamePh: 'Preset name (e.g. Translate to English)',
  presetTemplatePh: 'Prompt text… use {{content}} as the content placeholder',
  templateHint: 'If {{content}} is omitted, the content is appended to the end of the prompt',
  savePreset: 'Add preset',
  deletePreset: 'Delete preset',
  presetNameRequired: 'Please enter a preset name',
  presetSaved: 'Preset saved',
  presetDeleted: 'Preset deleted',
  presetLimit: 'Custom preset limit reached (10)',
  themeToggle: 'Toggle light/dark theme',
  langToggle: 'تغییر زبان / Switch language',
  metaSource: 'Source',
  metaAuthor: 'Author',
  metaPublished: 'Published',
  metaSite: 'Website',
};

const dictionaries: Record<Lang, Dict> = { fa, en };

let currentLang: Lang = 'fa';

export function setLang(lang: Lang): void {
  currentLang = lang;
}

export function getLang(): Lang {
  return currentLang;
}

export function t(key: string): string {
  return dictionaries[currentLang][key] ?? dictionaries.fa[key] ?? key;
}

export function applyI18n(root: ParentNode = document): void {
  document.documentElement.lang = currentLang;
  document.documentElement.dir = currentLang === 'fa' ? 'rtl' : 'ltr';

  root.querySelectorAll<HTMLElement>('[data-i18n]').forEach((node) => {
    const key = node.dataset.i18n;
    if (key) node.textContent = t(key);
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-placeholder]').forEach((node) => {
    const key = node.dataset.i18nPlaceholder;
    if (key) node.setAttribute('placeholder', t(key));
  });
  root.querySelectorAll<HTMLElement>('[data-i18n-title]').forEach((node) => {
    const key = node.dataset.i18nTitle;
    if (key) {
      const label = t(key);
      node.setAttribute('title', label);
      node.setAttribute('aria-label', label);
    }
  });
}

export function formatNumber(value: number): string {
  return value.toLocaleString(currentLang === 'fa' ? 'fa-IR' : 'en-US');
}
