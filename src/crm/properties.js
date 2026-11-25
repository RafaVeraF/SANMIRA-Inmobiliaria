import { supabase } from '../lib/supabase.js';
import { esc, money, toast, formData, slugify, num } from '../lib/util.js';
import { PROPERTY_STATUS, PROPERTY_TYPES, options, badge, listProfiles, personLabel, check } from './shared.js';

// =====================================================================
// Lista
// =====================================================================
export async function renderList(host) {
  const props = check(await supabase.from('properties')
    .select('id, slug, title_es, zone, operation, property_type, status, price, currency, published, featured, cover_url, images, construction_m2, bedrooms')
    .order('updated_at', { ascending: false }));

  host.innerHTML = `
    <div class="flex flex-wrap items-end justify-between gap-4">
      <div><p class="eyebrow">CRM</p><h1 class="mt-1 text-4xl">Propiedades</h1></div>
      <a href="#propiedad/nueva" class="btn btn-primary">+ Nueva propiedad</a>
    </div>
    <div class="mt-6 flex flex-wrap gap-3">
      <input id="q" class="input max-w-xs" placeholder="Buscar…">
      <select id="f-op" class="input w-auto"><option value="">Venta y renta</option><option value="venta">Venta</option><option value="renta">Renta</option></select>
      <select id="f-st" class="input w-auto"><option value="">Todos los estados</option>${options(PROPERTY_STATUS)}</select>
    </div>
    <div class="card mt-5 overflow-x-auto">
      <table class="w-full">
        <thead><tr><th class="th"></th><th class="th">Propiedad</th><th class="th">Operación</th><th class="th">Precio</th><th class="th">Estado</th><th class="th">Web</th></tr></thead>
        <tbody id="rows"></tbody>
      </table>
    </div>`;

  const draw = () => {
    const q = host.querySelector('#q').value.toLowerCase();
    const op = host.querySelector('#f-op').value;
    const st = host.querySelector('#f-st').value;
    const list = props.filter((p) => (!op || p.operation === op) && (!st || p.status === st) &&
      (!q || `${p.title_es} ${p.zone ?? ''}`.toLowerCase().includes(q)));
    host.querySelector('#rows').innerHTML = list.map((p) => {
      const img = p.cover_url || p.images?.[0];
      return `
      <tr class="hover:bg-eucalipto/30">
        <td class="td w-20">${img ? `<img src="${esc(img)}" alt="" class="h-12 w-16 rounded object-cover">` : '<div class="ph-photo h-12 w-16 rounded"></div>'}</td>
        <td class="td"><a href="#propiedad/${p.id}" class="font-medium text-brand hover:underline">${esc(p.title_es)}</a>
          <br><span class="text-xs text-muted">${esc(PROPERTY_TYPES[p.property_type] || p.property_type)} · ${esc(p.zone || '')}${p.bedrooms ? ` · ${p.bedrooms} rec.` : ''}${p.construction_m2 ? ` · ${num(p.construction_m2)} m²` : ''}</span></td>
        <td class="td capitalize">${esc(p.operation)}</td>
        <td class="td whitespace-nowrap">${esc(money(p.price, p.currency))}</td>
        <td class="td">${badge(PROPERTY_STATUS[p.status])}</td>
        <td class="td">${p.published ? `<a class="badge badge-ok" href="/propiedad.html?p=${encodeURIComponent(p.slug)}" target="_blank">Publicada ↗</a>` : '<span class="badge badge-neutral">Oculta</span>'}${p.featured ? ' <span class="badge badge-warn">Destacada</span>' : ''}</td>
      </tr>`;
    }).join('') || '<tr><td class="td text-muted" colspan="6">Sin propiedades.</td></tr>';
  };
  host.querySelectorAll('#q, #f-op, #f-st').forEach((el) => el.addEventListener('input', draw));
  draw();
}

// =====================================================================
// Alta / edición
// =====================================================================
export async function renderEdit(host, id, { profile }) {
  const isNew = !id || id === 'nueva';
  const p = isNew
    ? { operation: 'venta', property_type: 'casa', status: 'borrador', currency: 'MXN', city: 'Querétaro', images: [], amenities: [] }
    : check(await supabase.from('properties').select('*').eq('id', id).single());
  const owners = await listProfiles(['vendedor', 'arrendador']);

  const input = (name, label, type = 'text', extra = '') =>
    `<div><label class="label" for="f-${name}">${label}</label><input id="f-${name}" name="${name}" type="${type}" class="input" value="${esc(p[name] ?? '')}" ${extra}></div>`;

  host.innerHTML = `
    <a href="#propiedades" class="text-sm text-laton hover:underline">← Propiedades</a>
    <h1 class="mt-3 text-4xl">${isNew ? 'Nueva propiedad' : esc(p.title_es)}</h1>
    <form id="prop-form" class="mt-6 grid gap-6 xl:grid-cols-[1.4fr_1fr]">
      <div class="space-y-6">
        <section class="card grid gap-4 p-6 md:grid-cols-2">
          <h2 class="text-xl md:col-span-2">Datos generales</h2>
          <div><label class="label">Operación</label><select name="operation" class="input">${options({ venta: 'Venta', renta: 'Renta' }, p.operation)}</select></div>
          <div><label class="label">Tipo</label><select name="property_type" class="input">${options(PROPERTY_TYPES, p.property_type)}</select></div>
          ${input('price', 'Precio', 'number', 'min="0" step="1000"')}
          <div><label class="label">Moneda</label><select name="currency" class="input">${['MXN', 'USD', 'EUR'].map((c) => `<option ${c === p.currency ? 'selected' : ''}>${c}</option>`).join('')}</select></div>
          ${input('zone', 'Zona / colonia')}
          ${input('city', 'Ciudad')}
          <div class="md:col-span-2">${input('address', 'Dirección (interna, no se publica)')}</div>
          ${input('bedrooms', 'Recámaras', 'number', 'min="0"')}
          ${input('bathrooms', 'Baños', 'number', 'min="0" step="0.5"')}
          ${input('parking', 'Estacionamientos', 'number', 'min="0"')}
          ${input('construction_m2', 'm² de construcción', 'number', 'min="0" step="0.01"')}
          ${input('land_m2', 'm² de terreno', 'number', 'min="0" step="0.01"')}
          <div><label class="label">Amenidades (separadas por coma)</label><input name="amenities" class="input" value="${esc((p.amenities || []).join(', '))}"></div>
        </section>

        <section class="card grid gap-4 p-6">
          <h2 class="text-xl">Textos por idioma</h2>
          ${['es', 'en', 'de'].map((l) => `
            <fieldset class="grid gap-3 border-t border-line pt-4 first-of-type:border-0 first-of-type:pt-0">
              <legend class="eyebrow">${{ es: 'Español', en: 'English', de: 'Deutsch' }[l]}</legend>
              <input name="title_${l}" class="input" placeholder="Título" value="${esc(p[`title_${l}`] || '')}" ${l === 'es' ? 'required' : ''}>
              <textarea name="description_${l}" rows="4" class="input" placeholder="Descripción">${esc(p[`description_${l}`] || '')}</textarea>
            </fieldset>`).join('')}
        </section>
      </div>

      <div class="space-y-6">
        <section class="card grid gap-4 p-6">
          <h2 class="text-xl">Publicación</h2>
          <div><label class="label">Estado</label><select name="status" class="input">${options(PROPERTY_STATUS, p.status)}</select></div>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="published" class="h-4 w-4 accent-brand" ${p.published ? 'checked' : ''}> Publicada en la web</label>
          <label class="flex items-center gap-2 text-sm"><input type="checkbox" name="featured" class="h-4 w-4 accent-brand" ${p.featured ? 'checked' : ''}> Destacada (aparece primero)</label>
          <div><label class="label">Slug (URL)</label><input name="slug" class="input" value="${esc(p.slug || '')}" placeholder="se genera del título"></div>
          <div><label class="label">Propietario (cliente)</label><select name="owner_id" class="input"><option value="">—</option>${owners.map((o) => `<option value="${o.id}" ${o.id === p.owner_id ? 'selected' : ''}>${esc(personLabel(o))}</option>`).join('')}</select></div>
        </section>

        <section class="card p-6">
          <h2 class="text-xl">Fotografías</h2>
          ${isNew ? '<p class="mt-2 text-sm text-muted">Guarda la propiedad para poder subir fotos.</p>' : `
          <p class="mt-1 text-xs text-muted">La foto marcada como portada se usa en el inventario. JPG o WebP, idealmente horizontal de 1600 px.</p>
          <div id="gallery" class="mt-4 grid grid-cols-3 gap-2">
            ${(p.images || []).map((src) => `
              <div class="group relative aspect-[4/3] overflow-hidden rounded ${src === p.cover_url ? 'ring-2 ring-laton' : ''}">
                <img src="${esc(src)}" alt="" class="h-full w-full object-cover">
                <div class="absolute inset-x-0 bottom-0 hidden justify-between bg-ink/70 p-1 text-[10px] text-marfil group-hover:flex">
                  <button type="button" class="cursor-pointer" data-cover="${esc(src)}">Portada</button>
                  <button type="button" class="cursor-pointer" data-rm="${esc(src)}">Quitar</button>
                </div>
              </div>`).join('')}
          </div>
          <label class="btn btn-ghost mt-4 w-full">Subir fotos<input id="photos" type="file" class="hidden" accept="image/*" multiple></label>`}
        </section>

        <div class="flex items-center justify-between">
          ${isNew ? '<span></span>' : '<button type="button" id="del" class="btn btn-danger btn-sm">Eliminar</button>'}
          <button type="submit" class="btn btn-primary px-6">Guardar propiedad</button>
        </div>
      </div>
    </form>`;

  const form = host.querySelector('#prop-form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    if (!form.reportValidity()) return;
    const d = formData(form);
    d.published = form.published.checked;
    d.featured = form.featured.checked;
    d.amenities = (d.amenities || '').split(',').map((a) => a.trim()).filter(Boolean);
    d.slug = slugify(d.slug || d.title_es);
    let res;
    if (isNew) {
      d.created_by = profile.id;
      res = await supabase.from('properties').insert(d).select('id').single();
    } else {
      res = await supabase.from('properties').update(d).eq('id', p.id).select('id').single();
    }
    if (res.error) {
      const msg = res.error.code === '23505' ? 'Ese slug ya existe; cámbialo.' : res.error.message;
      return toast(msg, 'error');
    }
    toast('Propiedad guardada', 'ok');
    if (isNew) location.hash = `propiedad/${res.data.id}`;
  });

  if (isNew) return;

  const saveImages = async (images, cover_url = p.cover_url) => {
    const { error } = await supabase.from('properties').update({ images, cover_url }).eq('id', p.id);
    if (error) return toast(error.message, 'error');
    renderEdit(host, p.id, { profile });
  };

  host.querySelector('#photos').addEventListener('change', async (e) => {
    const files = [...e.target.files];
    if (!files.length) return;
    toast(`Subiendo ${files.length} foto(s)…`);
    const urls = [];
    for (const file of files) {
      const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
      const path = `${p.id}/${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
      const { error } = await supabase.storage.from('propiedades').upload(path, file, { cacheControl: '31536000' });
      if (error) { toast(error.message, 'error'); continue; }
      urls.push(supabase.storage.from('propiedades').getPublicUrl(path).data.publicUrl);
    }
    const images = [...(p.images || []), ...urls];
    saveImages(images, p.cover_url || images[0] || null);
  });

  host.querySelectorAll('[data-cover]').forEach((b) => b.addEventListener('click', () => saveImages(p.images, b.dataset.cover)));
  host.querySelectorAll('[data-rm]').forEach((b) => b.addEventListener('click', () => {
    const images = p.images.filter((src) => src !== b.dataset.rm);
    saveImages(images, p.cover_url === b.dataset.rm ? images[0] || null : p.cover_url);
  }));

  host.querySelector('#del').addEventListener('click', async () => {
    if (!confirm('¿Eliminar esta propiedad? Se quitará también de las oportunidades donde esté vinculada.')) return;
    const { error } = await supabase.from('properties').delete().eq('id', p.id);
    if (error) return toast(error.message, 'error');
    toast('Propiedad eliminada', 'ok');
    location.hash = 'propiedades';
  });
}
