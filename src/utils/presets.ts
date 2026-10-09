import type { CustomPreset, Lang, Preset } from './types';

const CONTENT_PLACEHOLDER = '{{content}}';

interface BuiltinDef {
  id: string;
  label: Record<Lang, string>;
  template: Record<Lang, string>;
}

const BUILTINS: BuiltinDef[] = [
  {
    id: 'summarize',
    label: { fa: 'خلاصه‌سازی', en: 'Summarize' },
    template: {
      fa: [
        'محتوای صفحه‌ی زیر را دقیق و ساختاریافته خلاصه کن.',
        '',
        '- ابتدا در یک یا دو جمله، پیام اصلی متن را بیان کن.',
        '- نکات کلیدی را به‌صورت فهرست گلوله‌ای مرتب کن.',
        '- اگر نکته‌ی عملی، عدد مهم یا هشدار مشخصی وجود دارد، در بخش جداگانه بیاور.',
        '- از حدس زدن و افزودن اطلاعات خارج از متن پرهیز کن.',
        '',
        '---',
        '',
        '{{content}}',
      ].join('\n'),
      en: [
        'Summarize the page content below accurately and in a structured way.',
        '',
        '- Start with the main message of the text in one or two sentences.',
        '- Organize the key points as a bulleted list.',
        '- Put actionable takeaways, important numbers or warnings in a separate section.',
        '- Do not speculate or add information that is not in the text.',
        '',
        '---',
        '',
        '{{content}}',
      ].join('\n'),
    },
  },
  {
    id: 'insights',
    label: { fa: 'نکات کلیدی', en: 'Key insights' },
    template: {
      fa: [
        'از محتوای زیر تحلیل عمیق و استخراج نکات کلیدی انجام بده:',
        '',
        '- ادعاها و استدلال‌های اصلی نویسنده',
        '- آمار، اعداد و منابع مهم',
        '- بینش‌های کاربردی و قابل اجرا',
        '- نقاط ضعف، سوگیری‌ها یا ابهام‌های متن',
        '',
        'پاسخ را کوتاه، دسته‌بندی‌شده و بدون حاشیه بنویس.',
        '',
        '---',
        '',
        '{{content}}',
      ].join('\n'),
      en: [
        'Analyze the content below and extract the key insights:',
        '',
        '- The main claims and arguments of the author',
        '- Important statistics, numbers and references',
        '- Practical, actionable insights',
        '- Weaknesses, biases or ambiguities in the text',
        '',
        'Keep the answer short, categorized and to the point.',
        '',
        '---',
        '',
        '{{content}}',
      ].join('\n'),
    },
  },
  {
    id: 'raw',
    label: { fa: 'متن خام', en: 'Raw Markdown' },
    template: { fa: '{{content}}', en: '{{content}}' },
  },
];

export function getBuiltinPresets(lang: Lang): Preset[] {
  return BUILTINS.map((def) => ({
    id: def.id,
    label: def.label[lang],
    template: def.template[lang],
    builtin: true,
  }));
}

export function mapCustomPresets(customs: CustomPreset[]): Preset[] {
  return customs.map((custom) => ({
    id: custom.id,
    label: custom.name,
    template: custom.prompt,
    builtin: false,
  }));
}

export function applyPreset(template: string, content: string): string {
  const trimmed = template.trim();
  if (trimmed.includes(CONTENT_PLACEHOLDER)) {
    return trimmed.split(CONTENT_PLACEHOLDER).join(content);
  }
  if (trimmed.length === 0) return content;
  return `${trimmed}\n\n---\n\n${content}`;
}
