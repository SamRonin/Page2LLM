const ARABIC_SCRIPT =
  /[\u0600-\u06FF\u0750-\u077F\u08A0-\u08FF\uFB50-\uFDFF\uFE70-\uFEFF]/g;
const CJK =
  /[\u3040-\u30FF\u3100-\u312F\u3130-\u318F\u3400-\u4DBF\u4E00-\u9FFF\uAC00-\uD7AF\uF900-\uFAFF]/g;

export function countWords(text: string): number {
  const trimmed = text.trim();
  return trimmed ? trimmed.split(/\s+/).length : 0;
}

export function countCharacters(text: string): number {
  return Array.from(text).length;
}

/**
 * Rough token estimation for LLM context planning.
 * Heuristics: CJK ≈ 1 token/char, Arabic script (Persian) ≈ 2.5 chars/token,
 * everything else (Latin, spaces, punctuation, markup) ≈ 4 chars/token.
 */
export function estimateTokens(text: string): number {
  const cjk = (text.match(CJK) ?? []).length;
  const arabic = (text.match(ARABIC_SCRIPT) ?? []).length;
  const rest = Math.max(text.length - cjk - arabic, 0);
  return Math.ceil(cjk / 1.1) + Math.ceil(arabic / 2.5) + Math.ceil(rest / 4);
}

export function estimateReadingMinutes(words: number): number {
  return Math.max(1, Math.round(words / 200));
}
