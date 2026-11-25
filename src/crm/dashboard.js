import { supabase } from '../lib/supabase.js';
import { esc, money, date, toast } from '../lib/util.js';
import { ACTIVE_STAGES, STAGES, OPP_TYPES, check } from './shared.js';

export async function render(host, _param, { profile }) {
  const [opps, docs, propsCount, leadsCount] = await Promise.all([
    supabase
      .from('opportunities')
      .select('id, title, type, stage, advisor_id, budget_max, currency, updated_at, client:profiles!opportunities_client_id_fkey(full_name), advisor:profiles!opportunities_advisor_id_fkey(full_name)')
      .not('stage', 'in', '(ganada,perdida)')
      .order('updated_at', { ascending: false })
      .then(check),
    supabase
      .from('opportunity_documents')
      .select('id, name, uploaded_at, opportunity_id, opportunities(title)')
      .eq('status', 'enviado')
      .order('uploaded_at', { ascending: true })
      .limit(8)
      .then(check),
    supabase.from('properties').select('id', { count: 'exact', head: true }).eq('published', true),
    supabase.from('leads').select('id', { count: 'exact', head: true }).eq('handled', false),
  ]);

  const mine = opps.filter((o) => o.advisor_id === profile.id).length;
  const closing = opps.filter((o) => ['documentacion', 'cierre'].includes(o.stage)).length;

  const kpi = (label, value, href) => `
    <a href="${href}" class="card card-hover block p-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-muted">${esc(label)}</p>
      <p class="mt-2 font-serif text-4xl text-brand">${esc(value)}</p>
    </a>`;

  host.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div>
        <p class="eyebrow">CRM</p>
        <h1 class="mt-1 text-4xl">Tablero</h1>
      </div>
      <a href="#oportunidades" class="btn btn-primary" data-new-opp>+ Nueva oportunidad</a>
    </div>

    <div class="mt-8 grid grid-cols-2 gap-4 md:grid-cols-5">
      ${kpi('Oportunidades activas', opps.length, '#oportunidades')}
      ${kpi('Asignadas a mí', mine, '#oportunidades')}
      ${kpi('En documentación / cierre', closing, '#oportunidades')}
      ${kpi('Propiedades publicadas', propsCount.count ?? 0, '#propiedades')}
      ${kpi('Leads sin atender', leadsCount.count ?? 0, '#leads')}
    </div>

    <h2 class="mt-12 text-2xl">Pipeline</h2>
    <div class="mt-4 flex gap-4 overflow-x-auto pb-4">
      ${ACTIVE_STAGES.map((s) => {
        const list = opps.filter((o) => o.stage === s.id);
        return `
        <section class="w-72 shrink-0 rounded bg-eucalipto/50 p-3" data-stage="${s.id}">
          <h3 class="flex items-center justify-between px-1 font-sans text-sm font-semibold">
            ${esc(s.label)} <span class="text-xs font-normal text-muted">${list.length}</span>
          </h3>
          <div class="mt-3 space-y-2">
            ${list.map((o) => `
              <div class="card p-3 text-sm">
                <a href="#oportunidad/${o.id}" class="font-medium hover:text-brand">${esc(o.title)}</a>
                <p class="mt-1 text-xs text-muted">${esc(OPP_TYPES[o.type])}${o.client?.full_name ? ` · ${esc(o.client.full_name)}` : ''}</p>
                <div class="mt-2 flex items-center justify-between gap-2">
                  <span class="text-xs text-laton">${o.budget_max ? esc(money(o.budget_max, o.currency)) : ''}</span>
                  <select class="rounded-sm border border-line bg-white px-1 py-0.5 text-xs" data-move="${o.id}" aria-label="Mover etapa">
                    ${STAGES.map((st) => `<option value="${st.id}" ${st.id === o.stage ? 'selected' : ''}>${esc(st.label)}</option>`).join('')}
                  </select>
                </div>
              </div>`).join('') || '<p class="px-1 text-xs text-muted">—</p>'}
          </div>
        </section>`;
      }).join('')}
    </div>

    <h2 class="mt-10 text-2xl">Documentos por revisar</h2>
    <div class="card mt-4 overflow-x-auto">
      <table class="w-full">
        <thead><tr><th class="th">Documento</th><th class="th">Oportunidad</th><th class="th">Enviado</th></tr></thead>
        <tbody>
          ${docs.map((d) => `
            <tr>
              <td class="td">${esc(d.name)}</td>
              <td class="td"><a class="text-brand hover:underline" href="#oportunidad/${d.opportunity_id}/documentos">${esc(d.opportunities?.title || '')}</a></td>
              <td class="td text-muted">${esc(date(d.uploaded_at))}</td>
            </tr>`).join('') || '<tr><td class="td text-muted" colspan="3">No hay documentos pendientes de revisión.</td></tr>'}
        </tbody>
      </table>
    </div>`;

  host.querySelectorAll('[data-move]').forEach((sel) => {
    sel.addEventListener('change', async () => {
      const { error } = await supabase.from('opportunities').update({ stage: sel.value }).eq('id', sel.dataset.move);
      if (error) return toast(error.message, 'error');
      toast('Etapa actualizada', 'ok');
      render(host, null, { profile });
    });
  });

  host.querySelector('[data-new-opp]').addEventListener('click', (e) => {
    e.preventDefault();
    location.hash = 'oportunidades/nueva';
  });
}
