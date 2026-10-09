# Contributing to Page2LLM | مشارکت در Page2LLM

<div dir="rtl">

## راهنمای فارسی

از علاقه‌ی شما به مشارکت سپاسگزاریم! این پروژه عمداً سبک و مینیمال نگه داشته می‌شود.

### شروع سریع

```bash
git clone https://github.com/SamRonin/Page2LLM.git
cd Page2LLM
bun install        # یا npm install
bun run dev        # بیلد watch برای توسعه
bun run typecheck  # بررسی تایپ‌ها
```

سپس پوشه‌ی `dist/` را در `chrome://extensions` با Developer mode بارگذاری کنید.

### قواعد

- کد TypeScript strict و بدون هیچ `TODO` یا کد مرده باشد.
- برای هر تغییر، یک Pull Request جدا با توضیح شفاف ارسال کنید.
- از Conventional Commits استفاده کنید (`feat:`, `fix:`, `docs:`, `refactor:`).
- هیچ وابستگی سنگین (فریم‌ورک UI، باندل‌ر جدید، ...) اضافه نکنید.
- پیش از ارسال PR مطمئن شوید `bun run typecheck` و `bun run build` بدون خطا اجرا می‌شوند.

### ایده‌های مناسب برای شروع

- افزودن قالب‌های پرامپت آماده‌ی جدید
- افزودن زبان‌های جدید به `src/utils/i18n.ts`
- بهبود دقت تخمین توکن در `src/utils/tokens.ts`
- پیشنهاد دکمه‌های «ارسال به» برای مدل‌های دیگر

</div>

---

<div dir="ltr">

## English Guide

Thanks for your interest in contributing! This project is intentionally kept lightweight and minimal.

### Quick start

```bash
git clone https://github.com/SamRonin/Page2LLM.git
cd Page2LLM
bun install        # or npm install
bun run dev        # watch-mode build
bun run typecheck  # type check
```

Then load `dist/` via `chrome://extensions` with Developer mode.

### Ground rules

- Keep the code strictly-typed TypeScript with no `TODO`s or dead code.
- Open one pull request per change with a clear description.
- Use Conventional Commits (`feat:`, `fix:`, `docs:`, `refactor:`).
- Do not introduce heavy dependencies (UI frameworks, new bundlers, ...).
- Make sure `bun run typecheck` and `bun run build` pass before opening a PR.

### Good first contributions

- New built-in prompt presets
- New languages in `src/utils/i18n.ts`
- Better token estimation accuracy in `src/utils/tokens.ts`
- New "send to" targets for other LLM providers

</div>
