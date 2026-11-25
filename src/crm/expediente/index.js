// Pestaña "Expediente" de una oportunidad: los módulos del Excel del asesor.
import { supabase } from '../../lib/supabase.js';
import { esc, toast, date } from '../../lib/util.js';
import * as M from './modules.js';
import { printModules, PRINT_ORDER } from './print.js';

export const MODULES = [
  ['captura', 'Hoja de captura'],
  ['perfilamiento', 'Perfilamiento'],
  ['documentos', 'Documentos'],
  ['derechos', 'Carta de derechos'],
  ['levantamiento', 'Levantamiento'],
  ['opinion', 'Opinión de valor'],
  ['ficha', 'Ficha técnica'],
];

/** Tipos de oportunidad que llevan expediente del inmueble (captación). */
export const hasExpediente = (opp) => ['venta', 'renta_propietario'].includes(opp.type);

async function loadOrCreate(oppId, profile) {
  const { data, error } = await supabase.from('expedientes').select('*').eq('opportunity_id', oppId).maybeSingle();
  if (error) throw error;
  if (data) return data;
  const created = await supabase.from('expedientes')
    .insert({ opportunity_id: oppId, data: {}, updated_by: profile.id })
    .select('*').single();
  if (created.error) throw created.error;
  return created.data;
}

function completion(data) {
  const c = data.captura || {};
  return {
    captura: Boolean(c.p_nombre && c.i_direccion && c.i_m2_terreno),
    perfilamiento: Boolean(data.perfilamiento?.anio_escritura),
    documentos: Boolean(data.documentos?.fecha_solicitud),
    derechos: data.derechos?.entregada === 'SI',
    levantamiento: Boolean(c.i_distribucion),
    opinion: Boolean(data.opinion?.terreno?.some((r) => Number(r.precio) > 0)),
    ficha: Boolean(data.ficha?.descripcion),
  };
}

export async function renderExpediente(host, opp, { profile }, module = 'captura') {
  if (!hasExpediente(opp)) {
    host.innerHTML = '<div class="card max-w-xl p-6 text-sm text-muted">El expediente del inmueble aplica a oportunidades de <b>venta</b> y <b>renta (propietario)</b>.</div>';
    return;
  }
  const exp = await loadOrCreate(opp.id, profile);
  const data = exp.data || {};
  const current = MODULES.some(([k]) => k === module) ? module : 'captura';

  const ctx = {
    opp, exp, data, profile,
    async loadDocs() {
      const { data: docs, error } = await supabase.from('opportunity_documents')
        .select('id, name, status, file_path, uploaded_at, document_templates(section, condition, sort_order)')
        .eq('opportunity_id', opp.id);
      if (error) { toast(error.message, 'error'); return []; }
      return docs
        .map((d) => ({ ...d, section: d.document_templates?.section || 'general', condition: d.document_templates?.condition || null, sort: d.document_templates?.sort_order ?? 99 }))
        .sort((a, b) => a.sort - b.sort);
    },
    async signedUrl(path) {
      const { data: s, error } = await supabase.storage.from('documentos').createSignedUrl(path, 3600);
      if (error) { console.error(error); return null; }
      return s.signedUrl;
    },
    /** Guarda los valores de un módulo dentro de expedientes.data */
    async save(key, values, { message = 'Guardado', silent = false, rerender = false } = {}) {
      data[key] = values;
      const { error } = await supabase.from('expedientes')
        .update({ data, updated_by: profile.id })
        .eq('id', exp.id);
      if (error) { toast(error.message, 'error'); return false; }
      if (!silent) toast(message, 'ok');
      drawNav();
      if (rerender) M[current](body, ctx);
      return true;
    },
  };

  host.innerHTML = `
    <div class="flex flex-col gap-5 xl:flex-row">
      <aside class="xl:w-60 xl:shrink-0">
        <nav id="exp-nav" class="card flex gap-1 overflow-x-auto p-2 xl:flex-col" aria-label="Módulos del expediente"></nav>
        <div class="card mt-3 space-y-2 p-4 text-sm">
          <button type="button" id="print-one" class="btn btn-ghost btn-sm w-full">Imprimir este módulo</button>
          <button type="button" id="print-all" class="btn btn-primary btn-sm w-full">Imprimir expediente completo</button>
          <p class="pt-1 text-xs text-muted">Actualizado ${esc(date(exp.updated_at))}</p>
        </div>
      </aside>
      <div id="exp-body" class="min-w-0 flex-1"></div>
    </div>`;
  const body = host.querySelector('#exp-body');

  function drawNav() {
    const done = completion(data);
    host.querySelector('#exp-nav').innerHTML = MODULES.map(([k, l], i) => `
      <a href="#oportunidad/${opp.id}/expediente/${k}"
         class="flex items-center gap-3 whitespace-nowrap rounded px-3 py-2 text-sm ${k === current ? 'bg-brand text-marfil' : 'hover:bg-eucalipto'}">
        <span class="flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[10px] font-semibold
          ${done[k] ? (k === current ? 'bg-laton-claro text-brand' : 'bg-brand text-marfil') : (k === current ? 'border border-marfil/60' : 'border border-line text-muted')}">${done[k] ? '✓' : i + 1}</span>
        ${esc(l)}
      </a>`).join('');
  }

  drawNav();
  host.querySelector('#print-one').addEventListener('click', () => printModules(ctx, [current]));
  host.querySelector('#print-all').addEventListener('click', () => printModules(ctx, PRINT_ORDER));
  await M[current](body, ctx);
}
