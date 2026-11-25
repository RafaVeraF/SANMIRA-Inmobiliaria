import { initPublicPage, whatsappLink } from '../lib/layout.js';
import { onLangChange, t, tf, getLang } from '../lib/i18n.js';
import { getBySlug, priceLabel, photo } from '../lib/properties.js';
import { bindContactForm } from '../lib/leads.js';
import { $, esc, num } from '../lib/util.js';

initPublicPage();

const slug = new URLSearchParams(location.search).get('p');
let property = null;

function spec(label, value) {
  if (value == null || value === '') return '';
  return `<div class="border-t border-line py-3"><dt class="text-xs uppercase tracking-wider text-muted">${esc(label)}</dt><dd class="mt-1 font-serif text-2xl">${esc(value)}</dd></div>`;
}

function render() {
  const host = $('#property');
  if (!property) {
    host.innerHTML = `<p class="text-lg text-muted">${esc(t('prop.notfound'))}</p>`;
    return;
  }
  const p = property;
  const lang = getLang();
  const title = tf(p, 'title');
  document.title = `${title} · SANMIRA`;

  const gallery = (p.images || []).slice(0, 6);
  host.innerHTML = `
  <div class="grid gap-10 lg:grid-cols-[1.25fr_1fr]">
    <div>
      <div class="arch aspect-[4/3.4] overflow-hidden">${photo(p)}</div>
      ${gallery.length > 1 ? `<div class="mt-4 grid grid-cols-3 gap-3">${gallery.slice(1).map((src) =>
        `<a href="${esc(src)}" target="_blank" rel="noopener" class="block aspect-[4/3] overflow-hidden rounded"><img src="${esc(src)}" alt="" loading="lazy" class="h-full w-full object-cover"></a>`).join('')}</div>` : ''}
    </div>
    <div>
      <p class="eyebrow">${esc(t(`type.${p.property_type}`))} · ${esc(p.operation === 'renta' ? t('inv.rent') : t('inv.sale'))}</p>
      <h1 class="mt-3 text-4xl leading-tight md:text-5xl">${esc(title)}</h1>
      <p class="mt-2 text-muted">${esc([p.zone, p.city].filter(Boolean).join(', '))}</p>
      <p class="mt-6 font-serif text-4xl text-brand">${priceLabel(p)}</p>
      <p class="mt-6 whitespace-pre-line leading-7 text-ink/90">${esc(tf(p, 'description'))}</p>

      <h2 class="mt-10 text-2xl">${esc(t('prop.features'))}</h2>
      <dl class="mt-3 grid grid-cols-2 gap-x-8">
        ${spec(t('inv.beds'), p.bedrooms)}
        ${spec(t('feat.baths'), p.bathrooms != null ? num(p.bathrooms, lang, 1) : null)}
        ${spec(t('feat.parking'), p.parking)}
        ${spec(t('feat.built'), p.construction_m2 != null ? num(p.construction_m2, lang) : null)}
        ${spec(t('feat.land'), p.land_m2 != null ? num(p.land_m2, lang) : null)}
      </dl>

      ${p.amenities?.length ? `
      <h2 class="mt-10 text-2xl">${esc(t('prop.amenities'))}</h2>
      <ul class="mt-4 flex flex-wrap gap-2">${p.amenities.map((a) => `<li class="badge badge-neutral px-3 py-1">${esc(a)}</li>`).join('')}</ul>` : ''}
    </div>
  </div>`;

  $('#c-msg').value = `${t('prop.msg')}${title}`;
  $('#wa-link').href = whatsappLink(`${t('prop.msg')}${title} – ${location.href}`);
}

async function load() {
  property = slug ? await getBySlug(slug) : null;
  if (property) {
    $('#c-interest').value = property.operation === 'renta' ? 'rentar' : 'comprar';
    bindContactForm($('#contact-form'), { propertyId: property.id?.startsWith?.('demo') ? null : property.id });
  }
  render();
}

onLangChange(render);
load();
