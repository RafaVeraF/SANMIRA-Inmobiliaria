import { supabase } from '../lib/supabase.js';
import { esc, date, toast } from '../lib/util.js';
import { ROLES, options, check } from './shared.js';

export async function render(host, _param, { profile }) {
  const users = check(await supabase.from('profiles').select('*').order('created_at', { ascending: false }));
  const isAdmin = profile.role === 'admin';

  host.innerHTML = `
    <p class="eyebrow">CRM</p>
    <h1 class="mt-1 text-4xl">Usuarios</h1>
    <p class="mt-2 max-w-2xl text-sm text-muted">
      Los clientes crean su cuenta en <a class="text-brand hover:underline" href="/login.html#signup" target="_blank">/login.html</a> y eligen su tipo.
      ${isAdmin ? 'Como administrador puedes cambiar roles, por ejemplo para dar acceso de asesor a Santiago y Miguel.' : 'Solo un administrador puede cambiar roles.'}
    </p>
    <input id="q" class="input mt-6 max-w-xs" placeholder="Buscar por nombre o correo…">
    <div class="card mt-4 overflow-x-auto">
      <table class="w-full">
        <thead><tr><th class="th">Nombre</th><th class="th">Correo</th><th class="th">Teléfono</th><th class="th">Idioma</th><th class="th">Rol</th><th class="th">Alta</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>`;

  const draw = () => {
    const q = host.querySelector('#q').value.toLowerCase();
    host.querySelector('#rows').innerHTML = users
      .filter((u) => !q || `${u.full_name ?? ''} ${u.email ?? ''}`.toLowerCase().includes(q))
      .map((u) => `
        <tr>
          <td class="td font-medium">${esc(u.full_name || '—')}</td>
          <td class="td">${esc(u.email || '')}</td>
          <td class="td">${esc(u.phone || '')}</td>
          <td class="td">${esc((u.language || 'es').toUpperCase())}</td>
          <td class="td">${isAdmin && u.id !== profile.id
            ? `<select class="input py-1" data-role="${u.id}">${options(ROLES, u.role)}</select>`
            : `<span class="badge ${['admin', 'asesor'].includes(u.role) ? 'badge-info' : 'badge-neutral'}">${esc(ROLES[u.role])}</span>`}</td>
          <td class="td text-muted">${esc(date(u.created_at))}</td>
        </tr>`).join('');
    host.querySelectorAll('[data-role]').forEach((sel) => sel.addEventListener('change', async () => {
      const { error } = await supabase.from('profiles').update({ role: sel.value }).eq('id', sel.dataset.role);
      if (error) return toast(error.message, 'error');
      users.find((u) => u.id === sel.dataset.role).role = sel.value;
      toast('Rol actualizado', 'ok');
    }));
  };
  host.querySelector('#q').addEventListener('input', draw);
  draw();
}
