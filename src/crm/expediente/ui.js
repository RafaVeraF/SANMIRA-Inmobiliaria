// Pequeños ayudantes para construir los formularios del expediente.
import { esc } from '../../lib/util.js';

/** Campo de captura del asesor (los "rojos" del Excel). */
export function input(values, name, label, { type = 'text', span = 1, placeholder = '', step, min } = {}) {
  return `
    <div class="${spanCls(span)}">
      <label class="label" for="x-${name}">${esc(label)}</label>
      <input id="x-${name}" name="${name}" type="${type}" class="input" value="${esc(values[name] ?? '')}"
        ${placeholder ? `placeholder="${esc(placeholder)}"` : ''} ${step ? `step="${step}"` : ''} ${min != null ? `min="${min}"` : ''}>
    </div>`;
}

export function select(values, name, label, opts, { span = 1, empty = true } = {}) {
  const v = values[name] ?? '';
  return `
    <div class="${spanCls(span)}">
      <label class="label" for="x-${name}">${esc(label)}</label>
      <select id="x-${name}" name="${name}" class="input">
        ${empty ? '<option value="">—</option>' : ''}
        ${opts.map((o) => `<option ${String(o) === String(v) ? 'selected' : ''}>${esc(o)}</option>`).join('')}
      </select>
    </div>`;
}

export function textarea(values, name, label, { rows = 3, span = 2, placeholder = '' } = {}) {
  return `
    <div class="${spanCls(span)}">
      <label class="label" for="x-${name}">${esc(label)}</label>
      <textarea id="x-${name}" name="${name}" rows="${rows}" class="input" ${placeholder ? `placeholder="${esc(placeholder)}"` : ''}>${esc(values[name] ?? '')}</textarea>
    </div>`;
}

/** Valor calculado o tomado de otro módulo (no editable). */
export function readonly(label, value, { span = 1, hint = '' } = {}) {
  return `
    <div class="${spanCls(span)}">
      <p class="label">${esc(label)}</p>
      <p class="min-h-[38px] rounded-sm border border-dashed border-line bg-eucalipto/40 px-3 py-2 text-sm">${esc(value ?? '—') || '—'}</p>
      ${hint ? `<p class="mt-1 text-xs text-muted">${esc(hint)}</p>` : ''}
    </div>`;
}

export function section(title, body, { cols = 4 } = {}) {
  const grid = { 2: 'md:grid-cols-2', 3: 'md:grid-cols-3', 4: 'md:grid-cols-2 xl:grid-cols-4' }[cols];
  return `
    <section class="card p-6">
      <h3 class="font-serif text-xl">${esc(title)}</h3>
      <div class="mt-4 grid gap-4 ${grid}">${body}</div>
    </section>`;
}

function spanCls(span) {
  return { 1: '', 2: 'md:col-span-2', 3: 'md:col-span-3', 4: 'md:col-span-2 xl:col-span-4' }[span] || '';
}

/** Lee un formulario como objeto plano (sin convertir a null, para conservar "0"). */
export function readForm(form) {
  const out = {};
  for (const [k, v] of new FormData(form).entries()) {
    if (typeof v === 'string') out[k] = v.trim();
  }
  return out;
}
