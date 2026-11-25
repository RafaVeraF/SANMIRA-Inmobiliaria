import { supabase, isConfigured } from './supabase.js';

export const STAFF_ROLES = ['admin', 'asesor'];
export const CLIENT_ROLES = ['comprador', 'arrendatario', 'vendedor', 'arrendador'];

export async function getSession() {
  if (!isConfigured) return null;
  const { data } = await supabase.auth.getSession();
  return data.session;
}

export async function getProfile() {
  const session = await getSession();
  if (!session) return null;
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', session.user.id)
    .single();
  if (error) {
    console.error(error);
    return null;
  }
  return data;
}

export const isStaff = (profile) => STAFF_ROLES.includes(profile?.role);

/** Página según el rol: equipo → CRM, clientes → portal. */
export function homeFor(profile) {
  return isStaff(profile) ? '/crm.html' : '/portal.html';
}

/**
 * Protege una página. Si no hay sesión o el rol no está permitido, redirige.
 * Devuelve el perfil cuando el acceso es válido.
 */
export async function requireRole(allowed) {
  if (!isConfigured) {
    window.location.replace('/login.html');
    return null;
  }
  const profile = await getProfile();
  if (!profile) {
    window.location.replace(`/login.html?next=${encodeURIComponent(location.pathname)}`);
    return null;
  }
  if (!allowed.includes(profile.role)) {
    window.location.replace(homeFor(profile));
    return null;
  }
  return profile;
}

export async function signOut() {
  if (isConfigured) await supabase.auth.signOut();
  window.location.replace('/');
}
