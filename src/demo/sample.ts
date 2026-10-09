import type { ArticleMeta } from '../utils/types';

const DEMO_HTML = [
  '<p class="lead">در دنیای امروز، مدل‌های زبانی بزرگ (LLM) به بخش جدایی‌ناپذیر جعبه‌ابزار توسعه‌دهندگان تبدیل شده‌اند؛ اما کیفیت پاسخ آن‌ها مستقیماً به کیفیت ورودی — یعنی <strong>پرامپت</strong> — بستگی دارد.</p>',
  '<p>Prompt engineering is the practice of designing inputs that guide large language models toward accurate, useful and safe outputs. A well-structured prompt can outperform a fine-tuned model paired with a sloppy one.</p>',
  '<h2>چرا مهندسی پرامپت مهم است؟</h2>',
  '<p>یک پرامپت خوب سه کار را انجام می‌دهد: <em>هدف را مشخص می‌کند</em>، <em>قالب خروجی را تعیین می‌کند</em> و <em>محدوده‌ی موضوع را محدود می‌کند</em>. بر اساس <a href="https://arxiv.org/abs/2402.07927">مطالعه‌ی دانشگاهی اخیر</a>، ساختارمند بودن درخواست می‌تواند دقت پاسخ را تا ۴۰٪ افزایش دهد.</p>',
  '<blockquote>«بهترین پرامپت، کوتاه‌ترین پرامپتی است که مدل را دقیقاً به هدف شما برساند.»</blockquote>',
  '<h3>قواعد طلایی</h3>',
  '<ul><li>نقش مدل را روشن کنید («تو یک ویراستار حرفه‌ای هستی»)</li><li>خروجی مورد انتظار را ساختارمند بخواهید (فهرست، جدول، JSON)</li><li>نمونه‌ی ورودی و خروجی بدهید (Few-shot)</li><li>محدودیت طول و لحن را مشخص کنید</li></ul>',
  '<h2>مقایسه‌ی مدل‌های محبوب</h2>',
  '<table><thead><tr><th>مدل</th><th>پنجره‌ی متن</th><th>نقطه‌ی قوت</th></tr></thead><tbody><tr><td>GPT-4o</td><td>۱۲۸K</td><td>استدلال چندوجهی</td></tr><tr><td>Claude 3.5</td><td>۲۰۰K</td><td>متن‌های طولانی</td></tr><tr><td>Gemini 1.5</td><td>۱M</td><td>زمینه‌ی فوق‌العاده بزرگ</td></tr></tbody></table>',
  '<h2>نمونه کد: فراخوانی API</h2>',
  '<pre><code class="language-python">from openai import OpenAI\n\nclient = OpenAI()\n\nresponse = client.chat.completions.create(\n    model="gpt-4o",\n    messages=[\n        {"role": "system", "content": "You are a concise Persian editor."},\n        {"role": "user", "content": page_markdown},\n    ],\n)\nprint(response.choices[0].message.content)</code></pre>',
  '<p><img src="https://picsum.photos/seed/page2llm/800/420" alt="نمودار معماری سیستم"></p>',
  '<h2>جمع‌بندی</h2>',
  '<p>مهندسی پرامپت مهارتی است که با تمرین و بازخورد توسعه می‌یابد. برای مطالعه‌ی بیشتر، <a href="https://platform.openai.com/docs/guides/prompt-engineering">مستندات رسمی OpenAI</a> را از دست ندهید.</p>',
].join('\n');

export const DEMO_ARTICLE: ArticleMeta = {
  url: 'https://example.dev/blog/prompt-engineering-guide',
  title: 'راهنمای مهندسی پرامپت: از صفر تا تولید محتوای حرفه‌ای با LLM',
  siteName: 'مجله توسعه‌دهندگان',
  byline: 'سارا محمدی',
  publishedTime: '2025-11-02T09:30:00Z',
  lang: 'fa',
  dir: 'rtl',
  readerable: true,
  fallback: false,
  html: DEMO_HTML,
  textLength: 2400,
};
