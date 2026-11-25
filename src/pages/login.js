import { supabase, isConfigured } from '../lib/supabase.js';
import { applyI18n, bindLangSwitch, t, getLang } from '../lib/i18n.js';
import { getProfile, homeFor, isStaff } from '../lib/auth.js';
import { $, $$, formData, toast } from '../lib/util.js';

bindLangSwitch();
applyI18n();

function safeNext(profile) {
  const next = new URLSearchParams(location.search).get('next');
  // Solo rutas internas, y el CRM solo para el equipo.
  if (next && next.startsWith('/') && !next.startsWith('//')) {
    if (next.startsWith('/crm') && !isStaff(profile)) return homeFor(profile);
    return next;
  }
  return homeFor(profile);
}

async function goHome() {
  const profile = await getProfile();
  if (profile) window.location.replace(safeNext(profile));
}

function showTab(name) {
  $$('.tab').forEach((b) => {
    const active = b.dataset.tab === name;
    b.classList.toggle('border-brand', active);
    b.classList.toggle('text-brand', active);
    b.classList.toggle('border-transparent', !active);
    b.classList.toggle('text-muted', !active);
    b.setAttribute('aria-selected', String(active));
  });
  $$('[data-panel]').forEach((p) => {
    const show = p.dataset.panel === name;
    p.classList.toggle('hidden', !show);
    p.classList.toggle('grid', show);
  });
}

$$('.tab').forEach((b) => b.addEventListener('click', () => showTab(b.dataset.tab)));
showTab(location.hash === '#signup' ? 'signup' : 'signin');

if (!isConfigured) {
  $('#not-configured').classList.remove('hidden');
  $$('form button[type="submit"]').forEach((b) => { b.disabled = true; });
} else {
  // Recuperación de contraseña: Supabase redirige aquí con un evento PASSWORD_RECOVERY.
  supabase.auth.onAuthStateChange((event) => {
    if (event === 'PASSWORD_RECOVERY') {
      $$('[data-panel]').forEach((p) => p.classList.add('hidden'));
      $('.tab').parentElement.classList.add('hidden');
      $('#reset-form').classList.remove('hidden');
      $('#reset-form').classList.add('grid');
    }
  });

  if (!location.hash.includes('type=recovery')) {
    const { data } = await supabase.auth.getSession();
    if (data.session) await goHome();
  }

  $('#signin-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { email, password } = formData(e.target);
    const btn = e.submitter;
    btn.disabled = true;
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    btn.disabled = false;
    if (error) return toast(t('login.error'), 'error');
    await goHome();
  });

  $('#signup-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!e.target.reportValidity()) return;
    const d = formData(e.target);
    const btn = e.submitter;
    btn.disabled = true;
    const { data, error } = await supabase.auth.signUp({
      email: d.email,
      password: d.password,
      options: {
        emailRedirectTo: `${location.origin}/login.html`,
        data: { full_name: d.full_name, phone: d.phone, role: d.role, language: getLang() },
      },
    });
    btn.disabled = false;
    if (error) return toast(error.message, 'error');
    if (data.session) return goHome(); // confirmación de correo desactivada
    toast(t('login.signup.ok'), 'ok');
    showTab('signin');
  });

  $('#forgot').addEventListener('click', async () => {
    const email = $('#si-email').value.trim();
    if (!email) {
      $('#si-email').focus();
      return;
    }
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: `${location.origin}/login.html`,
    });
    toast(error ? error.message : t('login.reset.sent'), error ? 'error' : 'ok');
  });

  $('#reset-form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const { password } = formData(e.target);
    const { error } = await supabase.auth.updateUser({ password });
    if (error) return toast(error.message, 'error');
    await goHome();
  });
}
