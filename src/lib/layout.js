// Encabezado y pie compartidos por las páginas públicas.
import { applyI18n, bindLangSwitch } from './i18n.js';
import { getSession } from './auth.js';

const whatsapp = import.meta.env.VITE_WHATSAPP || '';

export function whatsappLink(text = '') {
  if (!whatsapp) return '#contacto';
  return `https://wa.me/${whatsapp}${text ? `?text=${encodeURIComponent(text)}` : ''}`;
}

const langSwitch = `
  <div class="flex items-center gap-2 text-xs font-medium tracking-wider" role="group" aria-label="Idioma / Language / Sprache">
    <button type="button" data-lang="es" class="cursor-pointer underline-offset-4 hover:underline">ES</button>
    <span class="opacity-40">·</span>
    <button type="button" data-lang="en" class="cursor-pointer underline-offset-4 hover:underline">EN</button>
    <span class="opacity-40">·</span>
    <button type="button" data-lang="de" class="cursor-pointer underline-offset-4 hover:underline">DE</button>
  </div>`;

export function renderHeader({ transparent = false } = {}) {
  const host = document.getElementById('site-header');
  if (!host) return;
  host.innerHTML = `
  <header class="${transparent ? 'absolute inset-x-0 top-0 z-30' : 'sticky top-0 z-30 border-b border-line bg-marfil/95 backdrop-blur'}">
    <div class="container-x flex h-20 items-center justify-between gap-6">
      <a href="/" class="shrink-0" aria-label="SANMIRA inicio">
        <img src="/brand/sanmira-logo-horizontal.svg" alt="SANMIRA Real Estate Querétaro" class="h-11 w-auto" width="183" height="44">
      </a>
      <nav class="hidden items-center gap-7 text-sm lg:flex" aria-label="Principal">
        <a href="/#inventario" class="hover:text-brand" data-i18n="nav.inventory"></a>
        <a href="/#servicios" class="hover:text-brand" data-i18n="nav.services"></a>
        <a href="/#nosotros" class="hover:text-brand" data-i18n="nav.about"></a>
        <a href="/#proceso" class="hover:text-brand" data-i18n="nav.process"></a>
        <a href="/#contacto" class="hover:text-brand" data-i18n="nav.contact"></a>
      </nav>
      <div class="flex items-center gap-5">
        ${langSwitch}
        <a href="/login.html" id="account-link" class="btn btn-primary btn-sm hidden sm:inline-flex" data-i18n="nav.login"></a>
        <button type="button" id="menu-btn" class="lg:hidden cursor-pointer p-2" aria-label="Menú" aria-expanded="false">
          <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5"><path d="M3 7h18M3 12h18M3 17h18"/></svg>
        </button>
      </div>
    </div>
    <nav id="mobile-menu" class="hidden border-t border-line bg-marfil lg:hidden" aria-label="Móvil">
      <div class="container-x flex flex-col gap-1 py-4 text-sm">
        <a href="/#inventario" class="py-2" data-i18n="nav.inventory"></a>
        <a href="/#servicios" class="py-2" data-i18n="nav.services"></a>
        <a href="/#nosotros" class="py-2" data-i18n="nav.about"></a>
        <a href="/#proceso" class="py-2" data-i18n="nav.process"></a>
        <a href="/#contacto" class="py-2" data-i18n="nav.contact"></a>
        <a href="/login.html" class="btn btn-primary mt-2" data-i18n="nav.login"></a>
      </div>
    </nav>
  </header>`;

  const btn = document.getElementById('menu-btn');
  const menu = document.getElementById('mobile-menu');
  btn.addEventListener('click', () => {
    const open = menu.classList.toggle('hidden') === false;
    btn.setAttribute('aria-expanded', String(open));
  });
  menu.querySelectorAll('a').forEach((a) => a.addEventListener('click', () => menu.classList.add('hidden')));

  // Si ya hay sesión, el botón lleva a "Mi cuenta".
  getSession().then((session) => {
    const link = document.getElementById('account-link');
    if (session && link) {
      link.dataset.i18n = 'nav.myaccount';
      link.href = '/login.html';
      applyI18n(host);
    }
  });
}

export function renderFooter() {
  const host = document.getElementById('site-footer');
  if (!host) return;
  const year = new Date().getFullYear();
  host.innerHTML = `
  <footer class="bg-brand text-marfil">
    <div class="container-x grid gap-10 py-16 md:grid-cols-3">
      <div>
        <img src="/brand/sanmira-logo-stacked-ivory.svg" alt="SANMIRA" class="h-28 w-auto" width="175" height="112">
      </div>
      <div class="text-sm text-marfil/80">
        <p class="font-serif text-xl text-marfil" data-i18n="footer.tagline"></p>
        <p class="mt-4">Querétaro, México</p>
        <p class="mt-1">ES · EN · DE</p>
      </div>
      <div class="flex flex-col gap-2 text-sm md:items-end">
        <a href="/#inventario" class="hover:text-laton-claro" data-i18n="nav.inventory"></a>
        <a href="/#contacto" class="hover:text-laton-claro" data-i18n="nav.contact"></a>
        <a href="/login.html" class="hover:text-laton-claro" data-i18n="nav.login"></a>
        ${langSwitch.replace('flex items-center', 'mt-4 flex items-center text-marfil/80')}
      </div>
    </div>
    <div class="border-t border-white/10">
      <div class="container-x flex flex-col justify-between gap-2 py-5 text-xs text-marfil/60 sm:flex-row">
        <span>© ${year} SANMIRA Real Estate. <span data-i18n="footer.rights"></span></span>
        <span class="tracking-[0.2em]">SANTIAGO · MIGUEL · RAFA</span>
      </div>
    </div>
  </footer>`;
}

export function initPublicPage(opts) {
  renderHeader(opts);
  renderFooter();
  bindLangSwitch();
  applyI18n();
}
