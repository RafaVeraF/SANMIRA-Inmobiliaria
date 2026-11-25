import { supabase } from '../lib/supabase.js';
import { esc, money, date } from '../lib/util.js';
import { check } from './shared.js';

// Historial de opiniones de valor. Se elaboran dentro del Expediente de cada
// oportunidad de venta / renta (método del Excel: comparables de terreno y
// construcción, coeficientes y capitalización de rentas).
export async function render(host) {
  const list = check(await supabase.from('valuations')
    .select('id, address, value_suggested, rent_suggested, cap_rate_monthly, currency, created_at, opportunity_id, opportunities(title, stage), properties(title_es)')
    .order('created_at', { ascending: false })
    .limit(200));

  host.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">CRM</p>
        <h1 class="mt-1 text-4xl">Opiniones de valor</h1>
        <p class="mt-2 max-w-2xl text-sm text-muted">
          Se elaboran en <b>Oportunidad → Expediente → Opinión de valor</b> (hojas 1 y 2: comparables de terreno y construcción,
          coeficientes, capitalización de rentas y conclusión con importe en letra). Desde ahí también se imprimen en PDF.
        </p>
      </div>
      <a href="#oportunidades/nueva" class="btn btn-primary">+ Nueva captación</a>
    </div>
    <div class="card mt-6 overflow-x-auto">
      <table class="w-full">
        <thead><tr><th class="th">Fecha</th><th class="th">Inmueble</th><th class="th">Oportunidad</th><th class="th">Valor</th><th class="th">Renta mensual</th><th class="th">Cap. anual</th><th class="th"></th></tr></thead>
        <tbody>
          ${list.map((v) => `
            <tr class="hover:bg-eucalipto/30">
              <td class="td text-muted">${esc(date(v.created_at))}</td>
              <td class="td">${esc(v.address)}${v.properties ? `<br><span class="text-xs text-muted">${esc(v.properties.title_es)}</span>` : ''}</td>
              <td class="td text-sm">${esc(v.opportunities?.title || '—')}</td>
              <td class="td whitespace-nowrap font-serif text-lg text-brand">${esc(money(v.value_suggested, v.currency))}</td>
              <td class="td whitespace-nowrap">${v.rent_suggested ? esc(money(v.rent_suggested, v.currency)) : '—'}</td>
              <td class="td">${v.cap_rate_monthly ? `${(v.cap_rate_monthly * 1200).toFixed(2)} %` : '—'}</td>
              <td class="td">${v.opportunity_id ? `<a class="btn btn-ghost btn-sm" href="#oportunidad/${v.opportunity_id}/expediente/opinion">Abrir</a>` : ''}</td>
            </tr>`).join('') || '<tr><td class="td text-muted" colspan="7">Aún no hay opiniones de valor. Crea una oportunidad de venta y llena su expediente.</td></tr>'}
        </tbody>
      </table>
    </div>`;
}
