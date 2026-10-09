import { Readability, isProbablyReaderable } from '@mozilla/readability';
import type { ExtractionPayload } from '../utils/types';

{
  const MSG_EXTRACTED = 'P2L_EXTRACTED';

  const NOISE_SELECTORS = [
    'nav', 'footer', 'header', 'aside',
    '.nav', '.navbar', '.footer', '.sidebar', '.menu',
    '.ad', '.ads', '.advertisement', '.banner',
    '.social-share', '.share-buttons',
    '.comments', '.comment-section',
    '#comments', '#disqus_thread',
    'script', 'style', 'noscript', 'iframe', 'svg',
    '[role="navigation"]', '[role="banner"]', '[role="contentinfo"]',
    '[aria-hidden="true"]',
  ];

  const MAIN_SELECTORS = [
    'article',
    '[role="main"]',
    'main',
    '.post-content',
    '.article-content',
    '.entry-content',
    '.content',
    '#content',
    '#main',
  ];

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function postMessage(payload: ExtractionPayload): void {
    try {
      // callback form swallows "Receiving end does not exist" when the popup is closed
      chrome.runtime.sendMessage({ type: MSG_EXTRACTED, payload }, () => {
        void chrome.runtime.lastError;
      });
    } catch {
      /* extension context invalidated — nothing to report to */
    }
  }

  function metaContent(selectors: string[]): string | null {
    for (const selector of selectors) {
      const content = document
        .querySelector(selector)
        ?.getAttribute('content')
        ?.trim();
      if (content) return content;
    }
    return null;
  }

  function getMetadata(): {
    title: string;
    url: string;
    siteName: string | null;
    byline: string | null;
    publishedTime: string | null;
    lang: string | null;
  } {
    const title =
      metaContent(['meta[property="og:title"]', 'meta[name="twitter:title"]']) ??
      document.title ??
      '';

    const url =
      document.querySelector('link[rel="canonical"]')?.getAttribute('href') ??
      window.location.href;

    return {
      title,
      url,
      siteName: metaContent(['meta[property="og:site_name"]']),
      byline: metaContent([
        'meta[name="author"]',
        'meta[property="article:author"]',
      ]),
      publishedTime: metaContent([
        'meta[property="article:published_time"]',
        'meta[name="date"]',
      ]),
      lang: document.documentElement.lang || null,
    };
  }

  function cleanClone(element: Element): Element {
    const clone = element.cloneNode(true) as Element;
    for (const selector of NOISE_SELECTORS) {
      clone.querySelectorAll(selector).forEach((node) => node.remove());
    }
    return clone;
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

  function extractWithReadability(cleanedHtml: string): string | null {
    const doc = new DOMParser().parseFromString(cleanedHtml, 'text/html');
    const article = new Readability(doc).parse();
    const content = article?.content;
    const text = article?.textContent?.replace(/\s+/g, ' ').trim() ?? '';
    if (!content || text.length < 200) return null;
    return content;
  }

  function extractMainContent(): { html: string; structured: boolean } {
    for (const selector of MAIN_SELECTORS) {
      const el = document.querySelector(selector);
      if (el && (el.textContent ?? '').trim().length > 200) {
        return { html: cleanClone(el).outerHTML, structured: true };
      }
    }

    const bodyClone = cleanClone(document.body);
    const rescued = extractWithReadability(bodyClone.outerHTML);
    if (rescued) return { html: rescued, structured: true };

    return { html: serializeFallback(), structured: false };
  }

  function textLengthOf(html: string): number {
    const doc = document.implementation.createHTMLDocument('');
    doc.body.innerHTML = html;
    return (doc.body.textContent ?? '').replace(/\s+/g, ' ').trim().length;
  }

  (async () => {
    try {
      const meta = getMetadata();
      const { html, structured } = extractMainContent();
      const dir: 'ltr' | 'rtl' =
        getComputedStyle(document.documentElement).direction === 'rtl'
          ? 'rtl'
          : 'ltr';

      postMessage({
        ok: true,
        url: meta.url,
        title: meta.title,
        siteName: meta.siteName,
        byline: meta.byline,
        publishedTime: meta.publishedTime,
        lang: meta.lang,
        dir,
        readerable: isProbablyReaderable(document),
        fallback: !structured,
        html,
        textLength: textLengthOf(html),
      });
    } catch (err: unknown) {
      postMessage({
        ok: false,
        reason: err instanceof Error ? err.message : String(err),
      });
    }
  })();
}
