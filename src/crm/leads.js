import { supabase } from '../lib/supabase.js';
import { esc, date, toast } from '../lib/util.js';
import { check } from './shared.js';
import { newOpportunityDialog } from './opportunities.js';

const INTEREST_TO_TYPE = {
  comprar: 'compra',
  vender: 'venta',
  rentar: 'renta_inquilino',
  'poner en renta': 'renta_propietario',
};

export async function render(host, _param, ctx) {
  const leads = check(await supabase.from('leads')
    .select('*, properties(title_es, slug)')
    .order('handled', { ascending: true })
    .order('created_at', { ascending: false })
    .limit(200));

  host.innerHTML = `
    <p class="eyebrow">CRM</p>
    <h1 class="mt-1 text-4xl">Leads del sitio web</h1>
    <p class="mt-2 text-sm text-muted">Mensajes del formulario de contacto. Conviértelos en oportunidad o márcalos como atendidos.</p>
    <div class="mt-6 space-y-3">
      ${leads.map((l) => `
        <article class="card p-5 ${l.handled ? 'opacity-60' : ''}" data-lead="${l.id}">
          <div class="flex flex-wrap items-start justify-between gap-3">
            <div>
              <p class="font-medium">${esc(l.name)} <span class="badge badge-neutral ml-1">${esc((l.language || 'es').toUpperCase())}</span> ${l.interest ? `<span class="badge badge-warn">${esc(l.interest)}</span>` : ''}</p>
              <p class="mt-1 text-sm"><a class="text-brand hover:underline" href="mailto:${esc(l.email)}">${esc(l.email)}</a>${l.phone ? ` · ${esc(l.phone)}` : ''}</p>
              ${l.properties ? `<p class="mt-1 text-xs text-muted">Propiedad: <a class="hover:underline" target="_blank" href="/propiedad.html?p=${encodeURIComponent(l.properties.slug)}">${esc(l.properties.title_es)}</a></p>` : ''}
            </div>
            <div class="flex items-center gap-2">
              <span class="text-xs text-muted">${esc(date(l.created_at))}</span>
              ${l.handled ? '' : '<button type="button" class="btn btn-primary btn-sm" data-convert>Crear oportunidad</button>'}
              <button type="button" class="btn btn-ghost btn-sm" data-toggle>${l.handled ? 'Reabrir' : 'Marcar atendido'}</button>
            </div>
          </div>
          ${l.message ? `<p class="mt-3 whitespace-pre-line border-t border-line pt-3 text-sm text-ink/85">${esc(l.message)}</p>` : ''}
        </article>`).join('') || '<div class="card p-6 text-muted">Aún no llegan mensajes.</div>'}
    </div>`;

  host.querySelectorAll('[data-lead]').forEach((card) => {
    const lead = leads.find((l) => l.id === card.dataset.lead);
    card.querySelector('[data-toggle]').addEventListener('click', async () => {
      const { error } = await supabase.from('leads').update({ handled: !lead.handled }).eq('id', lead.id);
      if (error) return toast(error.message, 'error');
      ctx.refreshBadges();
      render(host, null, ctx);
    });
    card.querySelector('[data-convert]')?.addEventListener('click', () => {
      newOpportunityDialog(ctx, {
        title: `${lead.name}${lead.properties ? ` · ${lead.properties.title_es}` : ''}`,
        type: INTEREST_TO_TYPE[lead.interest] || 'compra',
        source: 'web',
        notes: `Lead web (${(lead.language || 'es').toUpperCase()})\n${lead.email}${lead.phone ? ` · ${lead.phone}` : ''}\n\n${lead.message || ''}`,
        onCreated: async (oppId) => {
          await supabase.from('leads').update({ handled: true }).eq('id', lead.id);
          if (lead.property_id) {
            await supabase.from('opportunity_properties').insert({ opportunity_id: oppId, property_id: lead.property_id });
          }
          ctx.refreshBadges();
        },
      });
    });
  });
}
