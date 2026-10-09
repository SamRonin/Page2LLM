import { Readability, isProbablyReaderable } from '@mozilla/readability';
import type { ExtractionPayload } from '../utils/types';

const MSG_EXTRACTED = 'P2L_EXTRACTED';
const NOISE_SELECTORS =
  'script, style, noscript, iframe, template, svg, canvas, video, audio, source, track';

function escapeHtml(text: string): string {
  return text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function absoluteUrl(url: string): string {
  try {
    return new URL(url, document.baseURI).href;
  } catch {
    return url;
  }
}

function metaContent(names: string[]): string | null {
  for (const name of names) {
    const content = document
      .querySelector(`meta[property="${name}"], meta[name="${name}"]`)
      ?.getAttribute('content')
      ?.trim();
    if (content) return content;
  }
  return null;
}

function serializeFallback(): string {
  const text = (document.body?.innerText ?? document.body?.textContent ?? '')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
  return text
    .split(/\n{2,}/)
    .filter((chunk) => chunk.trim().length > 0)
    .map((chunk) => `<p>${escapeHtml(chunk.trim()).replace(/\n/g, '<br>')}</p>`)
    .join('\n');
}

function extract(): ExtractionPayload {
  const canonical = document
    .querySelector('link[rel="canonical"]')
    ?.getAttribute('href');
  const url = canonical ? absoluteUrl(canonical) : location.href;

  const clone = document.cloneNode(true) as Document;
  clone.querySelectorAll(NOISE_SELECTORS).forEach((node) => node.remove());

  const readerable = isProbablyReaderable(clone);
  const fallbackMeta = {
    siteName: metaContent(['og:site_name']),
    byline: metaContent(['author', 'article:author']),
    publishedTime: metaContent(['article:published_time', 'date', 'pubdate']),
  };

  let title = document.title.trim();
  let byline: string | null = fallbackMeta.byline;
  let html = '';
  let textLength = 0;
  let fallback = true;

  if (readerable) {
    const article = new Readability(clone).parse();
    if (article?.content) {
      fallback = false;
      title = (article.title || title).trim();
      byline = article.byline?.trim() || fallbackMeta.byline;
      html = article.content;
      textLength = (article.textContent ?? '').trim().length;
    }
  }

  if (fallback) {
    html = serializeFallback();
    textLength = (document.body?.innerText ?? '').trim().length;
  }

  return {
    ok: true,
    url,
    title: title || url,
    siteName: fallbackMeta.siteName,
    byline: byline || null,
    publishedTime: fallbackMeta.publishedTime,
    lang: document.documentElement.lang || null,
    dir: document.documentElement.getAttribute('dir') === 'rtl' ? 'rtl' : 'ltr',
    readerable,
    fallback,
    html,
    textLength,
  };
}

function send(payload: ExtractionPayload): void {
  try {
    void chrome.runtime.sendMessage({ type: MSG_EXTRACTED, payload });
  } catch {
    /* extension context is gone (popup closed) — nothing to do */
  }
}

(async () => {
  try {
    if (document.readyState === 'loading') {
      await new Promise<void>((resolve) =>
        document.addEventListener('DOMContentLoaded', () => resolve(), {
          once: true,
        }),
      );
    }
    send(extract());
  } catch (error) {
    send({ ok: false, reason: error instanceof Error ? error.message : String(error) });
  }
})();
