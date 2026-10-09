import { Readability, isProbablyReaderable } from '@mozilla/readability';
import type { ExtractionPayload } from '../utils/types';

{
  const MSG_EXTRACTED = 'P2L_EXTRACTED';
  const MSG_EXTRACTION_ERROR = 'P2L_EXTRACTION_ERROR';

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

  function escapeHtml(str: string): string {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#39;');
  }

  function getMetadata(): { title: string; url: string; description: string; author: string } {
    const title =
      document.querySelector('meta[property="og:title"]')?.getAttribute('content') ||
      document.querySelector('meta[name="twitter:title"]')?.getAttribute('content') ||
      document.title ||
      '';

    const url =
      document.querySelector('link[rel="canonical"]')?.getAttribute('href') ||
      window.location.href;

    const description =
      document.querySelector('meta[property="og:description"]')?.getAttribute('content') ||
      document.querySelector('meta[name="description"]')?.getAttribute('content') ||
      '';

    const author =
      document.querySelector('meta[name="author"]')?.getAttribute('content') ||
      document.querySelector('meta[property="article:author"]')?.getAttribute('content') ||
      '';

    return { title, url, description, author };
  }

  function cleanClone(element: Element): Element {
    const clone = element.cloneNode(true) as Element;
    for (const sel of NOISE_SELECTORS) {
      const nodes = clone.querySelectorAll(sel);
      nodes.forEach((n) => n.remove());
    }
    return clone;
  }

  function extractMainContent(): string {
    const selectors = [
      'article',
      '[role="main"]',
      'main',
      '.post-content',
      '.article-content',
      '.content',
      '.entry-content',
      '#content',
      '#main',
    ];

    for (const sel of selectors) {
      const el = document.querySelector(sel);
      if (el && el.textContent && el.textContent.trim().length > 200) {
        return cleanClone(el).outerHTML;
      }
    }

    const bodyClone = cleanClone(document.body);
    return bodyClone.outerHTML;
  }

  (async () => {
    try {
      const meta = getMetadata();
      const contentHtml = extractMainContent();

      chrome.runtime.sendMessage({
        type: MSG_EXTRACTED,
        payload: {
          title: meta.title,
          url: meta.url,
          description: meta.description,
          author: meta.author,
          html: contentHtml,
        },
      });
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : String(err);
      chrome.runtime.sendMessage({
        type: MSG_EXTRACTION_ERROR,
        payload: { error: message },
      });
    }
  })();
}
