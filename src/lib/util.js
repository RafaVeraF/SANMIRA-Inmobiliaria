/** Escapa texto para insertarlo con innerHTML de forma segura. */
export function esc(value) {
  return String(value ?? '')
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#39;');
}

export const $ = (sel, root = document) => root.querySelector(sel);
export const $$ = (sel, root = document) => [...root.querySelectorAll(sel)];

const LOCALES = { es: 'es-MX', en: 'en-US', de: 'de-DE' };

export function money(amount, currency = 'MXN', lang = 'es') {
  if (amount == null || amount === '') return '—';
  return new Intl.NumberFormat(LOCALES[lang] || 'es-MX', {
    style: 'currency',
    currency,
    maximumFractionDigits: 0,
  }).format(Number(amount));
}

export function num(value, lang = 'es', digits = 0) {
  if (value == null || value === '') return '—';
  return new Intl.NumberFormat(LOCALES[lang] || 'es-MX', { maximumFractionDigits: digits }).format(Number(value));
}

export function date(value, lang = 'es') {
  if (!value) return '—';
  return new Intl.DateTimeFormat(LOCALES[lang] || 'es-MX', { dateStyle: 'medium' }).format(new Date(value));
}

export function slugify(text) {
  return String(text)
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '')
    .slice(0, 80);
}

/** Mensaje flotante breve. type: 'ok' | 'error' | 'info' */
export function toast(message, type = 'info') {
  let host = document.getElementById('toast-host');
  if (!host) {
    host = document.createElement('div');
    host.id = 'toast-host';
    host.className = 'fixed bottom-5 right-5 z-[100] flex flex-col gap-2';
    host.setAttribute('aria-live', 'polite');
    document.body.appendChild(host);
  }
  const colors = { ok: 'bg-brand text-marfil', error: 'bg-danger text-white', info: 'bg-ink text-marfil' };
  const el = document.createElement('div');
  el.className = `rounded px-4 py-3 text-sm shadow-lg ${colors[type] || colors.info}`;
  el.textContent = message;
  host.appendChild(el);
  setTimeout(() => el.remove(), 4200);
}

/** Lee un <form> como objeto; convierte los campos vacíos en null. */
export function formData(form) {
  const out = {};
  for (const [k, v] of new FormData(form).entries()) {
    out[k] = typeof v === 'string' ? (v.trim() === '' ? null : v.trim()) : v;
  }
  return out;
}

export const MARK_SVG =
  '<svg viewBox="0 0 64 64" aria-hidden="true" class="h-full w-full"><path fill="currentColor" d="M4 60V24L32 6l28 18v36h-6V36a6 6 0 0 0-12 0v24h-4V30a6 6 0 0 0-12 0v30h-4V36a6 6 0 0 0-12 0v24z"/></svg>';
