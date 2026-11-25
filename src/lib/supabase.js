import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const key = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** true cuando el .env tiene credenciales reales de Supabase */
export const isConfigured = Boolean(url && key && !url.includes('TU-PROYECTO'));

export const supabase = isConfigured
  ? createClient(url, key, { auth: { persistSession: true, autoRefreshToken: true } })
  : null;

if (!isConfigured) {
  console.info('[SANMIRA] Supabase no está configurado: la landing muestra datos de ejemplo. Copia .env.example a .env.');
}
