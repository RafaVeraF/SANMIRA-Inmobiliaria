import { supabase } from '../lib/supabase.js';
import { applyI18n, bindLangSwitch, onLangChange, t, tf, getLang } from '../lib/i18n.js';
import { requireRole, signOut, CLIENT_ROLES } from '../lib/auth.js';
import { $, esc, toast, date } from '../lib/util.js';
import { photo, priceLabel } from '../lib/properties.js';

bindLangSwitch();
applyI18n();
$('#logout').addEventListener('click', signOut);

const profile = await requireRole(CLIENT_ROLES);
let opportunities = [];

const DOC_BADGE = {
  pendiente: 'badge-neutral',
  enviado: 'badge-warn',
  en_revision: 'badge-warn',
  aprobado: 'badge-ok',
  rechazado: 'badge-danger',
  no_aplica: 'badge-neutral',
};

const ROLE_LABEL = {
  comprador: 'login.r.comprador',
  arrendatario: 'login.r.arrendatario',
  vendedor: 'login.r.vendedor',
  arrendador: 'login.r.arrendador',
};

async function load() {
  const { data, error } = await supabase
    .from('opportunities')
    .select(`
      id, title, type, stage, expected_close,
      advisor:profiles!opportunities_advisor_id_fkey ( full_name, email, phone ),
      opportunity_steps ( id, title_es, title_en, title_de, sort_order, done, done_at, due_date ),
      opportunity_documents ( id, name, status, file_path, reviewer_note, uploaded_at, created_at,
        document_templates ( name_es, name_en, name_de, help_es, help_en, help_de, sort_order, section ) ),
      opportunity_properties ( status, properties ( slug, title_es, title_en, title_de, operation, property_type,
        price, currency, zone, city, cover_url, images, bedrooms, bathrooms, construction_m2, land_m2 ) )
    `)
    .eq('client_id', profile.id)
    .not('stage', 'eq', 'perdida')
    .order('created_at', { ascending: false });

  if (error) {
    console.error(error);
    toast(error.message, 'error');
  }
  opportunities = data || [];
  render();
}

function docName(d) {
  return d.document_templates ? tf(d.document_templates, 'name') : d.name;
}

function stepsBlock(o) {
  const steps = [...(o.opportunity_steps || [])].sort((a, b) => a.sort_order - b.sort_order);
  const done = steps.filter((s) => s.done).length;
  const pct = steps.length ? Math.round((done / steps.length) * 100) : 0;
  const nextIdx = steps.findIndex((s) => !s.done);
  return `
  <section class="card p-6 md:p-8">
    <div class="flex items-end justify-between gap-4">
      <h2 class="text-2xl">${esc(t('portal.steps'))}</h2>
      <p class="text-sm text-muted"><span class="font-serif text-2xl text-brand">${pct}%</span> ${esc(t('portal.progress'))}</p>
    </div>
    <div class="mt-4 h-1.5 overflow-hidden rounded bg-eucalipto"><div class="h-full bg-brand" style="width:${pct}%"></div></div>
    <ol class="mt-6 space-y-1">
      ${steps.map((s, i) => `
        <li class="flex items-start gap-4 rounded px-3 py-3 ${i === nextIdx ? 'bg-eucalipto/60' : ''}">
          <span class="mt-0.5 flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold
            ${s.done ? 'bg-brand text-marfil' : i === nextIdx ? 'border-2 border-brand text-brand' : 'border border-line text-muted'}">
            ${s.done ? '✓' : i + 1}
          </span>
          <div class="flex-1">
            <p class="${s.done ? 'text-muted line-through decoration-line' : 'font-medium'}">${esc(tf(s, 'title'))}</p>
            ${s.done && s.done_at ? `<p class="text-xs text-muted">${esc(date(s.done_at, getLang()))}</p>` : ''}
            ${!s.done && s.due_date ? `<p class="text-xs text-laton">${esc(date(s.due_date, getLang()))}</p>` : ''}
          </div>
        </li>`).join('')}
    </ol>
  </section>`;
}

function docRow(d, o) {
  const canUpload = ['pendiente', 'rechazado', 'enviado'].includes(d.status);
  const help = d.document_templates ? tf(d.document_templates, 'help') : '';
  return `
    <li class="flex flex-col gap-3 py-4 sm:flex-row sm:items-center ${d.status === 'no_aplica' ? 'opacity-50' : ''}">
      <div class="flex-1">
        <p class="font-medium">${esc(docName(d))}</p>
        ${help ? `<p class="text-xs text-muted">${esc(help)}</p>` : ''}
        ${d.status === 'rechazado' && d.reviewer_note ? `<p class="mt-1 text-xs text-danger">${esc(d.reviewer_note)}</p>` : ''}
      </div>
      <div class="flex items-center gap-2">
        <span class="badge ${DOC_BADGE[d.status]}">${esc(t(`doc.${d.status}`))}</span>
        ${d.file_path ? `<button type="button" class="btn btn-ghost btn-sm" data-view="${esc(d.file_path)}">${esc(t('portal.view'))}</button>` : ''}
        ${canUpload ? `<button type="button" class="btn btn-primary btn-sm" data-upload="${esc(d.id)}" data-opp="${esc(o.id)}">${esc(d.file_path ? t('portal.replace') : t('portal.upload'))}</button>` : ''}
      </div>
    </li>`;
}

const SECTION_ORDER = ['vendedor', 'comprador', 'conyuge', 'inmueble', 'nom247', 'general'];

function docsBlock(o) {
  const docs = [...(o.opportunity_documents || [])].sort(
    (a, b) => (a.document_templates?.sort_order ?? 99) - (b.document_templates?.sort_order ?? 99));
  const applicable = docs.filter((d) => d.status !== 'no_aplica');
  const approved = applicable.filter((d) => d.status === 'aprobado').length;
  const groups = {};
  for (const d of docs) (groups[d.document_templates?.section || 'general'] ||= []).push(d);
  const keys = SECTION_ORDER.filter((k) => groups[k]);
  return `
  <section class="card p-6 md:p-8">
    <div class="flex items-end justify-between gap-4">
      <h2 class="text-2xl">${esc(t('portal.docs'))}</h2>
      <p class="text-sm text-muted">${approved} ${esc(t('portal.of'))} ${applicable.length}</p>
    </div>
    <p class="mt-1 text-sm text-muted">${esc(t('portal.docsLead'))}</p>
    ${keys.map((k) => `
      ${keys.length > 1 ? `<h3 class="mt-6 font-sans text-xs font-semibold uppercase tracking-wider text-laton">${esc(t(`sec.${k}`))}</h3>` : ''}
      <ul class="mt-2 divide-y divide-line">${groups[k].map((d) => docRow(d, o)).join('')}</ul>`).join('')}
  </section>`;
}

function propsBlock(o) {
  const links = (o.opportunity_properties || []).filter((l) => l.properties && l.status !== 'descartada');
  if (!links.length) return '';
  return `
  <section>
    <h2 class="text-2xl">${esc(t('portal.properties'))}</h2>
    <div class="mt-5 grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
      ${links.map(({ status, properties: p }) => `
        <a href="/propiedad.html?p=${encodeURIComponent(p.slug)}" class="card card-hover overflow-hidden">
          <div class="aspect-[4/3]">${photo(p)}</div>
          <div class="p-5">
            <span class="badge badge-neutral">${esc(t(`link.${status}`))}</span>
            <p class="mt-2 font-serif text-xl">${esc(tf(p, 'title'))}</p>
            <p class="mt-1 font-serif text-lg text-brand">${priceLabel(p)}</p>
          </div>
        </a>`).join('')}
    </div>
  </section>`;
}

function advisorBlock(o) {
  if (!o.advisor) return '';
  const a = o.advisor;
  return `
  <section class="card flex items-center gap-4 p-6">
    <div class="arch h-14 w-12 shrink-0 bg-brand"></div>
    <div class="text-sm">
      <p class="eyebrow">${esc(t('portal.advisor'))}</p>
      <p class="mt-1 font-serif text-xl">${esc(a.full_name || '')}</p>
      ${a.email ? `<a class="text-laton hover:underline" href="mailto:${esc(a.email)}">${esc(a.email)}</a>` : ''}
      ${a.phone ? `<p class="text-muted">${esc(a.phone)}</p>` : ''}
    </div>
  </section>`;
}

function render() {
  $('#user-name').textContent = profile.full_name || profile.email;
  $('#role-label').textContent = t(ROLE_LABEL[profile.role] || 'login.r.comprador');
  const host = $('#portal');

  if (!opportunities.length) {
    host.innerHTML = `<div class="card max-w-xl p-8"><p class="text-muted">${esc(t('portal.none'))}</p></div>`;
    return;
  }

  host.innerHTML = opportunities.map((o) => `
    <article class="mb-14">
      <div class="mb-6 flex flex-wrap items-center gap-3">
        <span class="badge badge-info">${esc(t(`opp.${o.type}`))}</span>
        <h2 class="text-3xl">${esc(o.title)}</h2>
      </div>
      <div class="grid gap-6 lg:grid-cols-[1fr_1.3fr]">
        <div class="space-y-6">${stepsBlock(o)}${advisorBlock(o)}</div>
        ${docsBlock(o)}
      </div>
      <div class="mt-10">${propsBlock(o)}</div>
    </article>`).join('');
}

// ---------- Subir y ver documentos ----------
let pending = null;
const input = $('#file-input');

$('#portal').addEventListener('click', async (e) => {
  const up = e.target.closest('[data-upload]');
  const view = e.target.closest('[data-view]');
  if (up) {
    pending = { docId: up.dataset.upload, oppId: up.dataset.opp, button: up };
    input.value = '';
    input.click();
  }
  if (view) {
    const { data, error } = await supabase.storage.from('documentos').createSignedUrl(view.dataset.view, 120);
    if (error) return toast(error.message, 'error');
    window.open(data.signedUrl, '_blank', 'noopener');
  }
});

input.addEventListener('change', async () => {
  const file = input.files?.[0];
  if (!file || !pending) return;
  if (file.size > 15 * 1024 * 1024) return toast('Máx. 15 MB', 'error');

  const { docId, oppId, button } = pending;
  button.disabled = true;
  const safe = file.name.normalize('NFD').replace(/[^\w.-]+/g, '_').slice(-80);
  const path = `${oppId}/${docId}/${Date.now()}-${safe}`;

  const { error: upErr } = await supabase.storage.from('documentos').upload(path, file, { upsert: false });
  if (upErr) {
    button.disabled = false;
    return toast(upErr.message, 'error');
  }
  const { error } = await supabase
    .from('opportunity_documents')
    .update({ file_path: path, status: 'enviado', uploaded_at: new Date().toISOString() })
    .eq('id', docId);
  if (error) {
    button.disabled = false;
    return toast(error.message, 'error');
  }
  toast(t('portal.uploaded'), 'ok');
  await load();
});

onLangChange(render);
if (profile) load();
