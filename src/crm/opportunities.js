import { supabase } from '../lib/supabase.js';
import { esc, money, date, toast, formData } from '../lib/util.js';
import {
  STAGES, OPP_TYPES, CLIENT_ROLE_FOR, DOC_STATUS, LINK_STATUS, PROPERTY_STATUS,
  stageLabel, options, badge, listProfiles, personLabel, check, openDialog, dialogHeader,
} from './shared.js';
import { renderExpediente, hasExpediente } from './expediente/index.js';

const OPP_SELECT = `
  id, title, type, stage, budget_min, budget_max, currency, source, notes, profiling, expected_close,
  client_id, advisor_id, created_at, updated_at,
  client:profiles!opportunities_client_id_fkey ( id, full_name, email, phone, language ),
  advisor:profiles!opportunities_advisor_id_fkey ( id, full_name, email, phone )`;

// =====================================================================
// Lista
// =====================================================================
export async function renderList(host, param, ctx) {
  const opps = check(await supabase.from('opportunities').select(OPP_SELECT).order('updated_at', { ascending: false }));

  host.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="eyebrow">CRM</p><h1 class="mt-1 text-4xl">Oportunidades</h1></div>
      <button type="button" class="btn btn-primary" id="new-opp">+ Nueva oportunidad</button>
    </div>
    <div class="mt-6 flex flex-wrap gap-3">
      <input id="q" class="input max-w-xs" placeholder="Buscar por título o cliente…">
      <select id="f-stage" class="input w-auto"><option value="">Todas las etapas</option>${STAGES.map((s) => `<option value="${s.id}">${esc(s.label)}</option>`).join('')}</select>
      <select id="f-type" class="input w-auto"><option value="">Todos los tipos</option>${options(OPP_TYPES)}</select>
      <label class="flex items-center gap-2 text-sm"><input type="checkbox" id="f-mine" class="accent-brand"> Solo mías</label>
    </div>
    <div class="card mt-5 overflow-x-auto">
      <table class="w-full">
        <thead><tr>
          <th class="th">Oportunidad</th><th class="th">Tipo</th><th class="th">Etapa</th>
          <th class="th">Cliente</th><th class="th">Asesor</th><th class="th">Presupuesto</th><th class="th">Actualizada</th>
        </tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>`;

  const draw = () => {
    const q = host.querySelector('#q').value.toLowerCase();
    const st = host.querySelector('#f-stage').value;
    const ty = host.querySelector('#f-type').value;
    const mine = host.querySelector('#f-mine').checked;
    const list = opps.filter((o) =>
      (!st || o.stage === st) && (!ty || o.type === ty) && (!mine || o.advisor_id === ctx.profile.id) &&
      (!q || `${o.title} ${o.client?.full_name ?? ''} ${o.client?.email ?? ''}`.toLowerCase().includes(q)));
    host.querySelector('#rows').innerHTML = list.map((o) => `
      <tr class="hover:bg-eucalipto/30">
        <td class="td"><a href="#oportunidad/${o.id}" class="font-medium text-brand hover:underline">${esc(o.title)}</a></td>
        <td class="td">${esc(OPP_TYPES[o.type])}</td>
        <td class="td"><span class="badge ${o.stage === 'ganada' ? 'badge-ok' : o.stage === 'perdida' ? 'badge-danger' : 'badge-neutral'}">${esc(stageLabel(o.stage))}</span></td>
        <td class="td">${esc(o.client?.full_name || o.client?.email || '—')}</td>
        <td class="td">${esc(o.advisor?.full_name || '—')}</td>
        <td class="td whitespace-nowrap">${o.budget_max ? esc(money(o.budget_max, o.currency)) : '—'}</td>
        <td class="td text-muted">${esc(date(o.updated_at))}</td>
      </tr>`).join('') || '<tr><td class="td text-muted" colspan="7">Sin resultados.</td></tr>';
  };
  host.querySelectorAll('#q, #f-stage, #f-type, #f-mine').forEach((el) => el.addEventListener('input', draw));
  draw();

  host.querySelector('#new-opp').addEventListener('click', () => newOpportunityDialog(ctx));
  if (param === 'nueva') newOpportunityDialog(ctx);
}

/** Diálogo para crear oportunidad. `prefill` permite crearla desde un lead. */
export async function newOpportunityDialog(ctx, prefill = {}) {
  const [clients, staff] = await Promise.all([
    listProfiles(['comprador', 'arrendatario', 'vendedor', 'arrendador']),
    listProfiles(['admin', 'asesor']),
  ]);
  const dlg = openDialog(`
    ${dialogHeader('Nueva oportunidad')}
    <form class="grid gap-4 p-6 md:grid-cols-2">
      <div class="md:col-span-2"><label class="label">Título</label><input name="title" required class="input" placeholder="Ej. Familia Müller · casa en Juriquilla" value="${esc(prefill.title || '')}"></div>
      <div><label class="label">Tipo</label><select name="type" class="input" required>${options(OPP_TYPES, prefill.type)}</select></div>
      <div><label class="label">Asesor</label><select name="advisor_id" class="input">${staff.map((s) => `<option value="${s.id}" ${s.id === ctx.profile.id ? 'selected' : ''}>${esc(s.full_name || s.email)}</option>`).join('')}</select></div>
      <div class="md:col-span-2">
        <label class="label">Cliente (usuario registrado)</label>
        <select name="client_id" class="input"><option value="">— Sin usuario aún (se asigna cuando el cliente cree su cuenta) —</option>
          ${clients.map((c) => `<option value="${c.id}">${esc(personLabel(c))} (${esc(c.role)})</option>`).join('')}</select>
        <p class="mt-1 text-xs text-muted">El cliente crea su cuenta en /login.html; después aparece aquí. Al crear la oportunidad se genera su checklist de documentos y sus pasos.</p>
      </div>
      <div><label class="label">Presupuesto mínimo</label><input name="budget_min" type="number" min="0" step="1000" class="input"></div>
      <div><label class="label">Presupuesto máximo</label><input name="budget_max" type="number" min="0" step="1000" class="input"></div>
      <div><label class="label">Moneda</label><select name="currency" class="input"><option>MXN</option><option>USD</option><option>EUR</option></select></div>
      <div><label class="label">Origen</label><input name="source" class="input" placeholder="web, referido, redes…" value="${esc(prefill.source || '')}"></div>
      <div class="md:col-span-2"><label class="label">Notas</label><textarea name="notes" rows="3" class="input">${esc(prefill.notes || '')}</textarea></div>
      <div class="flex justify-end gap-2 md:col-span-2">
        <button type="button" data-close class="btn btn-ghost">Cancelar</button>
        <button type="submit" class="btn btn-primary">Crear oportunidad</button>
      </div>
    </form>`, { wide: true });

  dlg.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const { data, error } = await supabase.from('opportunities').insert(d).select('id').single();
    if (error) return toast(error.message, 'error');
    if (prefill.onCreated) await prefill.onCreated(data.id);
    dlg.close();
    toast('Oportunidad creada con su checklist', 'ok');
    location.hash = `oportunidad/${data.id}`;
  });
}

// =====================================================================
// Detalle
// =====================================================================
const TABS = [
  ['resumen', 'Resumen'],
  ['perfil', 'Perfilamiento'],
  ['propiedades', 'Propiedades'],
  ['documentos', 'Documentos'],
  ['pasos', 'Pasos'],
];

export async function renderDetail(host, param, ctx) {
  const [id, tabParam, sub] = (param || '').split('/');
  const opp = check(await supabase.from('opportunities').select(OPP_SELECT).eq('id', id).single());
  // En captaciones (venta / renta propietario) el perfilamiento vive en el Expediente
  const tabs = hasExpediente(opp) ? [TABS[0], ['expediente', 'Expediente'], ...TABS.slice(2)] : TABS;
  const tab = tabParam || (hasExpediente(opp) ? 'expediente' : 'resumen');

  host.innerHTML = `
    <a href="#oportunidades" class="text-sm text-laton hover:underline">← Oportunidades</a>
    <div class="mt-3 flex flex-wrap items-start justify-between gap-4">
      <div>
        <p class="eyebrow">${esc(OPP_TYPES[opp.type])}</p>
        <h1 class="mt-1 text-4xl">${esc(opp.title)}</h1>
        <p class="mt-1 text-sm text-muted">Cliente: ${esc(personLabel(opp.client))} · Asesor: ${esc(opp.advisor?.full_name || '—')}</p>
      </div>
      <label class="text-sm">Etapa
        <select id="stage" class="input mt-1 w-48">${STAGES.map((s) => `<option value="${s.id}" ${s.id === opp.stage ? 'selected' : ''}>${esc(s.label)}</option>`).join('')}</select>
      </label>
    </div>
    <nav class="mt-6 flex gap-1 overflow-x-auto border-b border-line text-sm">
      ${tabs.map(([k, l]) => `<a href="#oportunidad/${id}/${k}" class="-mb-px whitespace-nowrap border-b-2 px-4 py-2 ${k === tab ? 'border-brand font-medium text-brand' : 'border-transparent text-muted hover:text-ink'}">${l}</a>`).join('')}
    </nav>
    <div id="tab" class="mt-6"></div>`;

  host.querySelector('#stage').addEventListener('change', async (e) => {
    const { error } = await supabase.from('opportunities').update({ stage: e.target.value }).eq('id', id);
    toast(error ? error.message : 'Etapa actualizada', error ? 'error' : 'ok');
  });

  const tabHost = host.querySelector('#tab');
  if (tab === 'expediente') return renderExpediente(tabHost, opp, ctx, sub);
  const views = { resumen: tabSummary, perfil: tabProfiling, propiedades: tabProperties, documentos: tabDocuments, pasos: tabSteps };
  await (views[tab] || tabSummary)(tabHost, opp, ctx);
}

// ---------- Resumen ----------
async function tabSummary(host, opp) {
  const [clients, staff] = await Promise.all([
    listProfiles([CLIENT_ROLE_FOR[opp.type], 'comprador', 'arrendatario', 'vendedor', 'arrendador']),
    listProfiles(['admin', 'asesor']),
  ]);
  host.innerHTML = `
    <form class="card grid max-w-4xl gap-4 p-6 md:grid-cols-2">
      <div class="md:col-span-2"><label class="label">Título</label><input name="title" required class="input" value="${esc(opp.title)}"></div>
      <div class="md:col-span-2"><label class="label">Cliente</label>
        <select name="client_id" class="input"><option value="">— Sin usuario —</option>
          ${clients.map((c) => `<option value="${c.id}" ${c.id === opp.client_id ? 'selected' : ''}>${esc(personLabel(c))} (${esc(c.role)})</option>`).join('')}
        </select></div>
      <div><label class="label">Asesor</label><select name="advisor_id" class="input"><option value="">—</option>${staff.map((s) => `<option value="${s.id}" ${s.id === opp.advisor_id ? 'selected' : ''}>${esc(s.full_name || s.email)}</option>`).join('')}</select></div>
      <div><label class="label">Cierre estimado</label><input name="expected_close" type="date" class="input" value="${esc(opp.expected_close || '')}"></div>
      <div><label class="label">Presupuesto mínimo</label><input name="budget_min" type="number" min="0" step="1000" class="input" value="${esc(opp.budget_min ?? '')}"></div>
      <div><label class="label">Presupuesto máximo</label><input name="budget_max" type="number" min="0" step="1000" class="input" value="${esc(opp.budget_max ?? '')}"></div>
      <div><label class="label">Moneda</label><select name="currency" class="input">${['MXN', 'USD', 'EUR'].map((c) => `<option ${c === opp.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
      <div><label class="label">Origen</label><input name="source" class="input" value="${esc(opp.source || '')}"></div>
      <div class="md:col-span-2"><label class="label">Notas</label><textarea name="notes" rows="5" class="input">${esc(opp.notes || '')}</textarea></div>
      <div class="flex items-center justify-between md:col-span-2">
        <button type="button" id="del" class="btn btn-danger btn-sm">Eliminar oportunidad</button>
        <button type="submit" class="btn btn-primary">Guardar cambios</button>
      </div>
    </form>
    ${opp.client ? `<p class="mt-4 text-sm text-muted">Contacto: ${esc(opp.client.email || '')} ${opp.client.phone ? `· ${esc(opp.client.phone)}` : ''} · idioma ${esc((opp.client.language || 'es').toUpperCase())}</p>` : ''}`;

  host.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { error } = await supabase.from('opportunities').update(formData(e.target)).eq('id', opp.id);
    toast(error ? error.message : 'Guardado', error ? 'error' : 'ok');
  });
  host.querySelector('#del').addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta oportunidad con sus documentos y pasos? No se puede deshacer.')) return;
    const { error } = await supabase.from('opportunities').delete().eq('id', opp.id);
    if (error) return toast(error.message, 'error');
    toast('Oportunidad eliminada', 'ok');
    location.hash = 'oportunidades';
  });
}

// ---------- Perfilamiento ----------
const PROFILE_FIELDS = {
  common: [
    ['nacionalidad', 'Nacionalidad', 'text'],
    ['idioma', 'Idioma preferido', 'select', ['Español', 'English', 'Deutsch']],
    ['residencia_mx', 'Situación migratoria en México', 'select', ['Turista / sin residencia', 'Residente temporal', 'Residente permanente', 'Mexicano']],
    ['ocupacion', 'Ocupación / empresa', 'text'],
    ['contacto_preferido', 'Medio de contacto preferido', 'select', ['WhatsApp', 'Correo', 'Llamada', 'Videollamada']],
  ],
  demand: [ // compra o renta (inquilino)
    ['motivo', 'Motivo', 'select', ['Vivir', 'Inversión para renta', 'Inversión plusvalía', 'Retiro', 'Reubicación laboral']],
    ['zonas', 'Zonas de interés', 'text'],
    ['tipo_propiedad', 'Tipo de propiedad', 'select', ['Casa', 'Departamento', 'Terreno', 'Local', 'Oficina']],
    ['recamaras_min', 'Recámaras mínimas', 'number'],
    ['forma_pago', 'Forma de pago', 'select', ['Contado', 'Crédito bancario mexicano', 'Crédito del extranjero', 'Mixto']],
    ['plazo', 'Plazo para decidir', 'select', ['Inmediato', '1–3 meses', '3–6 meses', 'Más de 6 meses']],
    ['fideicomiso', '¿Requiere fideicomiso / asesoría legal para extranjeros?', 'select', ['Sí', 'No', 'No sabe']],
    ['mascotas', 'Mascotas / necesidades especiales', 'text'],
  ],
  supply: [ // venta o renta (propietario)
    ['precio_esperado', 'Precio esperado por el propietario', 'number'],
    ['motivo_venta', 'Motivo de la operación', 'text'],
    ['urgencia', 'Urgencia', 'select', ['Alta', 'Media', 'Baja']],
    ['gravamen', '¿Tiene hipoteca o gravamen?', 'select', ['No', 'Sí', 'No sabe']],
    ['escrituras', 'Estado de escrituras', 'select', ['En orden', 'En trámite', 'Intestado / sucesión', 'No sabe']],
    ['exclusiva', '¿Firma exclusiva?', 'select', ['Sí', 'No', 'Por definir']],
  ],
};

function field([key, label, kind, opts], values) {
  const v = values[key] ?? '';
  if (kind === 'select') {
    return `<div><label class="label">${esc(label)}</label><select name="${key}" class="input"><option value="">—</option>${opts.map((o) => `<option ${o === v ? 'selected' : ''}>${esc(o)}</option>`).join('')}</select></div>`;
  }
  return `<div><label class="label">${esc(label)}</label><input name="${key}" type="${kind}" class="input" value="${esc(v)}"></div>`;
}

async function tabProfiling(host, opp) {
  const values = opp.profiling || {};
  const demand = ['compra', 'renta_inquilino'].includes(opp.type);
  const fields = [...PROFILE_FIELDS.common, ...(demand ? PROFILE_FIELDS.demand : PROFILE_FIELDS.supply)];
  const filled = fields.filter(([k]) => values[k]).length;

  host.innerHTML = `
    <form class="card max-w-4xl p-6">
      <div class="flex items-center justify-between">
        <h2 class="text-2xl">Perfil del cliente</h2>
        <span class="text-sm text-muted">${filled} de ${fields.length} campos</span>
      </div>
      <div class="mt-5 grid gap-4 md:grid-cols-2">${fields.map((f) => field(f, values)).join('')}</div>
      <div class="mt-4"><label class="label">Observaciones del asesor</label><textarea name="observaciones" rows="4" class="input">${esc(values.observaciones || '')}</textarea></div>
      <div class="mt-5 flex justify-end"><button type="submit" class="btn btn-primary">Guardar perfil</button></div>
    </form>`;

  host.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const profiling = Object.fromEntries(Object.entries(formData(e.target)).filter(([, v]) => v != null));
    const update = { profiling };
    if (opp.stage === 'prospecto') update.stage = 'perfilamiento';
    const { error } = await supabase.from('opportunities').update(update).eq('id', opp.id);
    toast(error ? error.message : 'Perfil guardado', error ? 'error' : 'ok');
  });
}

// ---------- Propiedades vinculadas ----------
async function tabProperties(host, opp) {
  const [links, all] = await Promise.all([
    supabase.from('opportunity_properties')
      .select('property_id, status, notes, properties(id, title_es, zone, price, currency, operation, status)')
      .eq('opportunity_id', opp.id).then(check),
    supabase.from('properties').select('id, title_es, zone, price, currency, operation').order('title_es').then(check),
  ]);
  const linked = new Set(links.map((l) => l.property_id));
  const available = all.filter((p) => !linked.has(p.id));

  host.innerHTML = `
    <div class="card max-w-5xl p-6">
      <form id="link-form" class="flex flex-wrap items-end gap-3">
        <div class="min-w-64 flex-1"><label class="label">Vincular propiedad</label>
          <select name="property_id" class="input" required><option value="">Selecciona…</option>
            ${available.map((p) => `<option value="${p.id}">${esc(p.title_es)} · ${esc(p.zone || '')} · ${esc(money(p.price, p.currency))}</option>`).join('')}</select></div>
        <button class="btn btn-primary" type="submit">Vincular</button>
      </form>
      <table class="mt-6 w-full">
        <thead><tr><th class="th">Propiedad</th><th class="th">Precio</th><th class="th">Estado propiedad</th><th class="th">Estado con el cliente</th><th class="th">Notas</th><th class="th"></th></tr></thead>
        <tbody>
          ${links.map((l) => `
            <tr data-pid="${l.property_id}">
              <td class="td"><a href="#propiedad/${l.property_id}" class="text-brand hover:underline">${esc(l.properties?.title_es)}</a><br><span class="text-xs text-muted">${esc(l.properties?.zone || '')}</span></td>
              <td class="td whitespace-nowrap">${esc(money(l.properties?.price, l.properties?.currency))}</td>
              <td class="td">${l.properties ? badge(PROPERTY_STATUS[l.properties.status]) : ''}</td>
              <td class="td"><select class="input py-1" data-field="status">${options(LINK_STATUS, l.status)}</select></td>
              <td class="td"><input class="input py-1" data-field="notes" value="${esc(l.notes || '')}" placeholder="Comentario de la visita…"></td>
              <td class="td"><button type="button" class="btn btn-danger btn-sm" data-unlink>Quitar</button></td>
            </tr>`).join('') || '<tr><td class="td text-muted" colspan="6">Aún no hay propiedades vinculadas.</td></tr>'}
        </tbody>
      </table>
      <p class="mt-3 text-xs text-muted">El cliente ve en su portal las propiedades vinculadas (excepto las descartadas) si están publicadas.</p>
    </div>`;

  host.querySelector('#link-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { property_id } = formData(e.target);
    const { error } = await supabase.from('opportunity_properties').insert({ opportunity_id: opp.id, property_id });
    if (error) return toast(error.message, 'error');
    tabProperties(host, opp);
  });

  host.querySelectorAll('tr[data-pid]').forEach((row) => {
    const pid = row.dataset.pid;
    row.querySelectorAll('[data-field]').forEach((input) => {
      input.addEventListener('change', async () => {
        const { error } = await supabase.from('opportunity_properties')
          .update({ [input.dataset.field]: input.value || null })
          .eq('opportunity_id', opp.id).eq('property_id', pid);
        toast(error ? error.message : 'Actualizado', error ? 'error' : 'ok');
      });
    });
    row.querySelector('[data-unlink]').addEventListener('click', async () => {
      const { error } = await supabase.from('opportunity_properties').delete().eq('opportunity_id', opp.id).eq('property_id', pid);
      if (error) return toast(error.message, 'error');
      tabProperties(host, opp);
    });
  });
}

// ---------- Documentos ----------
async function tabDocuments(host, opp) {
  const docs = check(await supabase.from('opportunity_documents')
    .select('id, name, status, file_path, reviewer_note, uploaded_at, reviewed_at, document_templates(sort_order)')
    .eq('opportunity_id', opp.id));
  docs.sort((a, b) => (a.document_templates?.sort_order ?? 99) - (b.document_templates?.sort_order ?? 99));
  const approved = docs.filter((d) => d.status === 'aprobado').length;
  const applicable = docs.filter((d) => d.status !== 'no_aplica').length;

  host.innerHTML = `
    <div class="card max-w-5xl p-6">
      <div class="flex flex-wrap items-center justify-between gap-3">
        <h2 class="text-2xl">Checklist de documentos <span class="font-sans text-sm text-muted">${approved} / ${applicable} aprobados</span></h2>
        <form id="add-doc" class="flex gap-2"><input name="name" required class="input" placeholder="Agregar documento extra…"><button class="btn btn-ghost" type="submit">Agregar</button></form>
      </div>
      <ul class="mt-5 divide-y divide-line">
        ${docs.map((d) => `
          <li class="grid gap-3 py-4 md:grid-cols-[1fr_auto] md:items-center" data-doc="${d.id}">
            <div>
              <p class="font-medium">${esc(d.name)}</p>
              <p class="text-xs text-muted">${d.uploaded_at ? `Subido ${esc(date(d.uploaded_at))}` : 'Sin archivo'}${d.reviewed_at ? ` · Revisado ${esc(date(d.reviewed_at))}` : ''}</p>
              ${d.reviewer_note ? `<p class="mt-1 text-xs text-danger">Nota: ${esc(d.reviewer_note)}</p>` : ''}
            </div>
            <div class="flex flex-wrap items-center gap-2">
              ${badge(DOC_STATUS[d.status])}
              ${d.file_path ? `<button type="button" class="btn btn-ghost btn-sm" data-view="${esc(d.file_path)}">Ver archivo</button>` : ''}
              <label class="btn btn-ghost btn-sm">Subir<input type="file" class="hidden" data-upload accept=".pdf,.jpg,.jpeg,.png,.webp,.heic"></label>
              ${d.file_path && !['aprobado', 'no_aplica'].includes(d.status) ? '<button type="button" class="btn btn-primary btn-sm" data-approve>Aprobar</button>' : ''}
              ${d.file_path && d.status !== 'rechazado' ? '<button type="button" class="btn btn-danger btn-sm" data-reject>Rechazar</button>' : ''}
              <button type="button" class="cursor-pointer px-1 text-muted hover:text-danger" data-remove title="Quitar del checklist">✕</button>
            </div>
          </li>`).join('') || '<li class="py-4 text-sm text-muted">Sin documentos. Revisa las plantillas en la tabla document_templates.</li>'}
      </ul>
    </div>`;

  const reload = () => tabDocuments(host, opp);

  host.querySelector('#add-doc').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { name } = formData(e.target);
    const { error } = await supabase.from('opportunity_documents').insert({ opportunity_id: opp.id, name });
    if (error) return toast(error.message, 'error');
    reload();
  });

  host.querySelectorAll('[data-doc]').forEach((li) => {
    const id = li.dataset.doc;
    const update = async (patch, msg) => {
      const { error } = await supabase.from('opportunity_documents').update(patch).eq('id', id);
      if (error) return toast(error.message, 'error');
      toast(msg, 'ok');
      reload();
    };
    li.querySelector('[data-view]')?.addEventListener('click', async (e) => {
      const { data, error } = await supabase.storage.from('documentos').createSignedUrl(e.currentTarget.dataset.view, 300);
      if (error) return toast(error.message, 'error');
      window.open(data.signedUrl, '_blank', 'noopener');
    });
    li.querySelector('[data-approve]')?.addEventListener('click', () =>
      update({ status: 'aprobado', reviewer_note: null, reviewed_at: new Date().toISOString() }, 'Documento aprobado'));
    li.querySelector('[data-reject]')?.addEventListener('click', () => {
      const note = prompt('Motivo del rechazo (lo verá el cliente):');
      if (note === null) return;
      update({ status: 'rechazado', reviewer_note: note || 'Documento ilegible o incompleto', reviewed_at: new Date().toISOString() }, 'Documento rechazado');
    });
    li.querySelector('[data-remove]').addEventListener('click', async () => {
      if (!confirm('¿Quitar este documento del checklist?')) return;
      const { error } = await supabase.from('opportunity_documents').delete().eq('id', id);
      if (error) return toast(error.message, 'error');
      reload();
    });
    li.querySelector('[data-upload]').addEventListener('change', async (e) => {
      const file = e.target.files?.[0];
      if (!file) return;
      const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80);
      const path = `${opp.id}/${id}/${Date.now()}-${safe}`;
      const { error } = await supabase.storage.from('documentos').upload(path, file);
      if (error) return toast(error.message, 'error');
      update({ file_path: path, status: 'en_revision', uploaded_at: new Date().toISOString() }, 'Archivo subido');
    });
  });
}

// ---------- Pasos ----------
async function tabSteps(host, opp) {
  const steps = check(await supabase.from('opportunity_steps').select('*').eq('opportunity_id', opp.id).order('sort_order'));
  host.innerHTML = `
    <div class="card max-w-3xl p-6">
      <h2 class="text-2xl">Pasos del cierre</h2>
      <p class="mt-1 text-sm text-muted">El cliente ve estos pasos en su portal (en su idioma).</p>
      <ol class="mt-5 divide-y divide-line">
        ${steps.map((s, i) => `
          <li class="flex flex-wrap items-center gap-3 py-3" data-step="${s.id}">
            <input type="checkbox" class="h-5 w-5 accent-brand" ${s.done ? 'checked' : ''} data-done aria-label="Completado">
            <span class="w-6 text-sm text-muted">${i + 1}.</span>
            <span class="flex-1 ${s.done ? 'text-muted line-through' : ''}">${esc(s.title_es)}</span>
            <input type="date" class="input w-40 py-1" value="${esc(s.due_date || '')}" data-due aria-label="Fecha objetivo">
            <button type="button" class="cursor-pointer px-1 text-muted hover:text-danger" data-del title="Eliminar">✕</button>
          </li>`).join('')}
      </ol>
      <form id="add-step" class="mt-5 grid gap-2 md:grid-cols-[1fr_1fr_1fr_auto]">
        <input name="title_es" required class="input" placeholder="Paso (ES)">
        <input name="title_en" class="input" placeholder="Step (EN)">
        <input name="title_de" class="input" placeholder="Schritt (DE)">
        <button class="btn btn-ghost" type="submit">Agregar</button>
      </form>
    </div>`;

  const reload = () => tabSteps(host, opp);
  host.querySelectorAll('[data-step]').forEach((li) => {
    const id = li.dataset.step;
    li.querySelector('[data-done]').addEventListener('change', async (e) => {
      const done = e.target.checked;
      const { error } = await supabase.from('opportunity_steps').update({ done, done_at: done ? new Date().toISOString() : null }).eq('id', id);
      if (error) return toast(error.message, 'error');
      reload();
    });
    li.querySelector('[data-due]').addEventListener('change', async (e) => {
      const { error } = await supabase.from('opportunity_steps').update({ due_date: e.target.value || null }).eq('id', id);
      toast(error ? error.message : 'Fecha guardada', error ? 'error' : 'ok');
    });
    li.querySelector('[data-del]').addEventListener('click', async () => {
      if (!confirm('¿Eliminar este paso?')) return;
      const { error } = await supabase.from('opportunity_steps').delete().eq('id', id);
      if (error) return toast(error.message, 'error');
      reload();
    });
  });
  host.querySelector('#add-step').addEventListener('submit', async (e) => {
    e.preventDefault();
    const d = formData(e.target);
    const { error } = await supabase.from('opportunity_steps').insert({ ...d, opportunity_id: opp.id, sort_order: steps.length + 1 });
    if (error) return toast(error.message, 'error');
    reload();
  });
}
