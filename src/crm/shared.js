import { supabase } from '../lib/supabase.js';
import { esc } from '../lib/util.js';

export const STAGES = [
  { id: 'prospecto', label: 'Prospecto' },
  { id: 'perfilamiento', label: 'Perfilamiento' },
  { id: 'visitas', label: 'Visitas' },
  { id: 'oferta', label: 'Oferta' },
  { id: 'documentacion', label: 'Documentación' },
  { id: 'cierre', label: 'Cierre' },
  { id: 'ganada', label: 'Ganada' },
  { id: 'perdida', label: 'Perdida' },
];
export const ACTIVE_STAGES = STAGES.filter((s) => !['ganada', 'perdida'].includes(s.id));
export const stageLabel = (id) => STAGES.find((s) => s.id === id)?.label || id;

export const OPP_TYPES = {
  compra: 'Compra (comprador)',
  venta: 'Venta (vendedor)',
  renta_inquilino: 'Renta (inquilino)',
  renta_propietario: 'Renta (propietario)',
};

/** Rol de cliente que corresponde a cada tipo de oportunidad */
export const CLIENT_ROLE_FOR = {
  compra: 'comprador',
  venta: 'vendedor',
  renta_inquilino: 'arrendatario',
  renta_propietario: 'arrendador',
};

export const ROLES = {
  admin: 'Administrador',
  asesor: 'Asesor',
  comprador: 'Comprador',
  arrendatario: 'Arrendatario',
  vendedor: 'Vendedor',
  arrendador: 'Arrendador',
};

export const DOC_STATUS = {
  pendiente: ['Pendiente', 'badge-neutral'],
  enviado: ['Enviado', 'badge-warn'],
  en_revision: ['En revisión', 'badge-warn'],
  aprobado: ['Aprobado', 'badge-ok'],
  rechazado: ['Rechazado', 'badge-danger'],
  no_aplica: ['No aplica', 'badge-neutral'],
};

export const PROPERTY_STATUS = {
  borrador: ['Borrador', 'badge-neutral'],
  disponible: ['Disponible', 'badge-ok'],
  apartada: ['Apartada', 'badge-warn'],
  vendida: ['Vendida', 'badge-info'],
  rentada: ['Rentada', 'badge-info'],
};

export const LINK_STATUS = {
  propuesta: 'Propuesta',
  visitada: 'Visitada',
  favorita: 'Favorita',
  descartada: 'Descartada',
  ofertada: 'Ofertada',
};

export const PROPERTY_TYPES = {
  casa: 'Casa',
  departamento: 'Departamento',
  terreno: 'Terreno',
  local: 'Local',
  oficina: 'Oficina',
};

export function options(map, selected) {
  return Object.entries(map)
    .map(([v, l]) => `<option value="${esc(v)}" ${v === selected ? 'selected' : ''}>${esc(Array.isArray(l) ? l[0] : l)}</option>`)
    .join('');
}

export function badge([label, cls]) {
  return `<span class="badge ${cls}">${esc(label)}</span>`;
}

export async function listProfiles(roles) {
  let q = supabase.from('profiles').select('id, full_name, email, phone, role, language').order('full_name');
  if (roles) q = q.in('role', roles);
  const { data, error } = await q;
  if (error) throw error;
  return data;
}

export function personLabel(p) {
  if (!p) return '—';
  return p.full_name ? `${p.full_name} · ${p.email ?? ''}` : p.email ?? '—';
}

/** Lanza el error de Supabase para que el router lo muestre. */
export function check({ data, error }) {
  if (error) throw error;
  return data;
}

/** Abre un <dialog> con contenido HTML. Devuelve el elemento. */
export function openDialog(html, { wide = false } = {}) {
  const dlg = document.createElement('dialog');
  dlg.className = 'm-auto rounded border border-line bg-marfil p-0 text-ink shadow-2xl';
  dlg.style.width = `min(96vw, ${wide ? '880px' : '560px'})`;
  dlg.innerHTML = html;
  document.body.appendChild(dlg);
  dlg.addEventListener('close', () => dlg.remove());
  dlg.querySelectorAll('[data-close]').forEach((b) => b.addEventListener('click', () => dlg.close()));
  dlg.showModal();
  return dlg;
}

export const dialogHeader = (title) => `
  <div class="flex items-center justify-between border-b border-line px-6 py-4">
    <h2 class="text-2xl">${esc(title)}</h2>
    <button type="button" data-close class="cursor-pointer p-1 text-muted hover:text-ink" aria-label="Cerrar">✕</button>
  </div>`;
