import { supabase } from '../lib/supabase.js';
import { requireRole, signOut, STAFF_ROLES } from '../lib/auth.js';
import { $, $$, esc } from '../lib/util.js';
import { ROLES } from '../crm/shared.js';
import * as dashboard from '../crm/dashboard.js';
import * as opportunities from '../crm/opportunities.js';
import * as properties from '../crm/properties.js';
import * as valuations from '../crm/valuations.js';
import * as leads from '../crm/leads.js';
import * as users from '../crm/users.js';

const profile = await requireRole(STAFF_ROLES);

const routes = {
  tablero: dashboard.render,
  oportunidades: opportunities.renderList,
  oportunidad: opportunities.renderDetail,
  propiedades: properties.renderList,
  propiedad: properties.renderEdit,
  valuaciones: valuations.render,
  leads: leads.render,
  usuarios: users.render,
};

async function route() {
  const [name = 'tablero', ...rest] = location.hash.replace(/^#/, '').split('/');
  const param = rest.length ? rest.map(decodeURIComponent).join('/') : null;
  const view = routes[name] ? name : 'tablero';
  const navKey = { oportunidad: 'oportunidades', propiedad: 'propiedades' }[view] || view;
  $$('[data-nav]').forEach((a) => a.classList.toggle('active', a.dataset.nav === navKey));
  $('#sidebar').classList.add('-translate-x-full');

  const host = $('#view');
  host.innerHTML = '<div class="h-40 animate-pulse rounded bg-eucalipto/60"></div>';
  try {
    await routes[view](host, param, { profile, refreshBadges });
  } catch (err) {
    console.error(err);
    host.innerHTML = `<div class="card max-w-xl p-6"><p class="font-medium text-danger">Ocurrió un error</p><p class="mt-2 text-sm text-muted">${esc(err.message || err)}</p></div>`;
  }
  window.scrollTo(0, 0);
}

async function refreshBadges() {
  const { count } = await supabase.from('leads').select('id', { count: 'exact', head: true }).eq('handled', false);
  const el = $('#leads-count');
  el.textContent = count ?? '';
  el.classList.toggle('hidden', !count);
}

if (profile) {
  $('#me-name').textContent = profile.full_name || profile.email;
  $('#me-role').textContent = ROLES[profile.role];
  $('#logout').addEventListener('click', signOut);
  $('#sidebar-btn').addEventListener('click', () => $('#sidebar').classList.toggle('-translate-x-full'));
  window.addEventListener('hashchange', route);
  route();
  refreshBadges();
}
