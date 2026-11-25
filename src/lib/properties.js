import { supabase, isConfigured } from './supabase.js';
import { demoProperties } from '../data/demo-properties.js';
import { t, tf, getLang } from './i18n.js';
import { esc, money, num } from './util.js';

const PUBLIC_COLUMNS =
  'id,slug,operation,property_type,status,title_es,title_en,title_de,description_es,description_en,description_de,price,currency,zone,city,bedrooms,bathrooms,parking,construction_m2,land_m2,amenities,cover_url,images,featured';

export async function listPublished() {
  if (!isConfigured) return { data: demoProperties, demo: true };
  const { data, error } = await supabase
    .from('properties')
    .select(PUBLIC_COLUMNS)
    .eq('published', true)
    .in('status', ['disponible', 'apartada'])
    .order('featured', { ascending: false })
    .order('created_at', { ascending: false });
  if (error) {
    console.error(error);
    return { data: [], demo: false, error };
  }
  return { data, demo: false };
}

export async function getBySlug(slug) {
  if (!isConfigured) return demoProperties.find((p) => p.slug === slug) || null;
  const { data, error } = await supabase
    .from('properties')
    .select(PUBLIC_COLUMNS)
    .eq('slug', slug)
    .eq('published', true)
    .maybeSingle();
  if (error) console.error(error);
  return data;
}

export function priceLabel(p) {
  const base = money(p.price, p.currency, getLang());
  return p.operation === 'renta' ? `${base} <span class="font-sans text-sm text-muted">${t('inv.month')}</span>` : base;
}

export function specsLine(p) {
  const lang = getLang();
  const parts = [];
  if (p.bedrooms) parts.push(`${num(p.bedrooms, lang)} ${t('spec.beds')}`);
  if (p.bathrooms) parts.push(`${num(p.bathrooms, lang, 1)} ${t('spec.baths')}`);
  if (p.construction_m2) parts.push(`${num(p.construction_m2, lang)} ${t('spec.built')}`);
  else if (p.land_m2) parts.push(`${num(p.land_m2, lang)} ${t('spec.land')}`);
  return parts.map(esc).join('<span class="mx-2 text-line">|</span>');
}

/** Foto de portada o placeholder de marca. */
export function photo(p, cls = '') {
  const src = p.cover_url || p.images?.[0];
  if (src) return `<img src="${esc(src)}" alt="${esc(tf(p, 'title'))}" loading="lazy" class="h-full w-full object-cover ${cls}">`;
  const warm = p.operation === 'renta' ? 'ph-photo-warm' : 'ph-photo';
  return `<div class="${warm} flex h-full w-full items-end justify-end p-5 ${cls}"><span class="h-10 w-10 text-marfil/40">${MARK}</span></div>`;
}

const MARK =
  '<svg viewBox="0 0 64 64" class="h-full w-full" aria-hidden="true"><path fill="currentColor" d="M4 60V24L32 6l28 18v36h-6V36a6 6 0 0 0-12 0v24h-4V30a6 6 0 0 0-12 0v30h-4V36a6 6 0 0 0-12 0v24z"/></svg>';

export function propertyCard(p, { arched = false } = {}) {
  const opBadge = p.operation === 'renta' ? t('inv.rent') : t('inv.sale');
  return `
  <article class="group card card-hover flex flex-col overflow-hidden">
    <a href="/propiedad.html?p=${encodeURIComponent(p.slug)}" class="block">
      <div class="relative overflow-hidden ${arched ? 'm-4 mb-0 arch aspect-square' : 'aspect-[4/3]'}">
        ${photo(p, 'transition-transform duration-500 group-hover:scale-[1.03]')}
        <span class="absolute left-3 ${arched ? 'bottom-3' : 'top-3'} badge badge-info">${esc(opBadge)}</span>
      </div>
    </a>
    <div class="flex flex-1 flex-col p-6">
      <p class="eyebrow">${esc(t(`type.${p.property_type}`))} · ${esc(p.zone || p.city)}</p>
      <h3 class="mt-2 text-2xl leading-tight">
        <a href="/propiedad.html?p=${encodeURIComponent(p.slug)}" class="hover:text-brand">${esc(tf(p, 'title'))}</a>
      </h3>
      <p class="mt-3 text-sm text-muted">${specsLine(p)}</p>
      <div class="mt-auto flex items-end justify-between pt-6">
        <p class="font-serif text-2xl text-brand">${priceLabel(p)}</p>
        <a href="/propiedad.html?p=${encodeURIComponent(p.slug)}" class="text-sm font-medium text-laton hover:underline">${esc(t('inv.details'))} →</a>
      </div>
    </div>
  </article>`;
}
