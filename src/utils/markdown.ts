import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';
import { getLang, t } from './i18n';
import type { ArticleMeta } from './types';

export interface MarkdownOptions {
  stripImages: boolean;
}

const turndown = new TurndownService({
  headingStyle: 'atx',
  hr: '---',
  bulletListMarker: '-',
  codeBlockStyle: 'fenced',
  emDelimiter: '*',
  strongDelimiter: '**',
  linkStyle: 'inlined',
});

turndown.use(gfm);
turndown.remove(['script', 'style', 'noscript']);

turndown.addRule('dropEmptyLinks', {
  filter: (node) =>
    node.nodeName === 'A' &&
    !(node.textContent ?? '').trim() &&
    !node.querySelector('img'),
  replacement: () => '',
});

turndown.addRule('fencedCodeWithLanguage', {
  filter: (node) =>
    node.nodeName === 'PRE' && node.firstChild?.nodeName === 'CODE',
  replacement: (_content, node) => {
    const code = node.firstChild;
    if (!(code instanceof HTMLElement)) return '';
    const className = code.getAttribute('class') ?? '';
    const lang = /language-(\S+)/.exec(className)?.[1] ?? '';
    const text = (code.textContent ?? '').replace(/\n$/, '');
    const runs = (text.match(/`+/g) ?? []).map((run) => run.length);
    const fence = '`'.repeat(Math.max(3, Math.max(0, ...runs) + 1));
    return `\n\n${fence}${lang}\n${text}\n${fence}\n\n`;
  },
});

function cleanupDocument(doc: Document, options: MarkdownOptions): void {
  doc
    .querySelectorAll(
      'script, style, noscript, iframe, form, button, input, select, textarea, video, audio, map, object, embed',
    )
    .forEach((node) => node.remove());

  doc.querySelectorAll('picture source').forEach((node) => node.remove());

  doc.querySelectorAll('img').forEach((img) => {
    const src = img.getAttribute('src') ?? '';
    if (!src || options.stripImages || /^(data|blob|about):/i.test(src)) {
      img.remove();
      return;
    }
    try {
      img.setAttribute('src', new URL(src, doc.baseURI).href);
      img.removeAttribute('srcset');
      img.removeAttribute('loading');
      img.removeAttribute('decoding');
    } catch {
      img.remove();
    }
  });
}

function collapseBlankLines(markdown: string): string {
  return markdown
    .replace(/\r\n/g, '\n')
    .replace(/[ \t]+\n/g, '\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim();
}

export function htmlToMarkdown(html: string, options: MarkdownOptions): string {
  const doc = new DOMParser().parseFromString(html, 'text/html');
  cleanupDocument(doc, options);
  const root = doc.body ?? doc.documentElement;
  return collapseBlankLines(turndown.turndown(root));
}

function formatDate(value: string): string {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  try {
    return date.toLocaleDateString(getLang() === 'fa' ? 'fa-IR' : 'en-US');
  } catch {
    return value;
  }
}

export function buildMetadataHeader(meta: ArticleMeta): string {
  const lines: string[] = [`# ${meta.title || meta.url}`, ''];

  const info: string[] = [];
  info.push(`${t('metaSource')}: ${meta.url}`);
  if (meta.byline) info.push(`${t('metaAuthor')}: ${meta.byline}`);
  if (meta.publishedTime) info.push(`${t('metaPublished')}: ${formatDate(meta.publishedTime)}`);
  if (meta.siteName) info.push(`${t('metaSite')}: ${meta.siteName}`);
  for (const line of info) lines.push(`> ${line}`);

  lines.push('', '---', '');
  return lines.join('\n');
}
