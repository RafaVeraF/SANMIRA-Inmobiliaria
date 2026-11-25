// Los 7 módulos del expediente (hojas del Excel). Cada uno recibe (host, ctx).
// ctx = { opp, exp, data, profile, save(module, values, opts), saveData, reload, docs, signedUrl }
import { supabase } from '../../lib/supabase.js';
import { esc, money, num, toast, date } from '../../lib/util.js';
import { CAT, ESPACIOS_ACABADOS, DERECHOS, DERECHOS_INTRO, SECCIONES_DOCS, EMPRESA, TIPO_A_INVENTARIO, NOTA_OPINION } from './config.js';
import { perfilamientoDerivado, documentoAplica, calcularOpinion, importeConLetra } from './calc.js';
import { input, select, textarea, readonly, section, readForm } from './ui.js';

const today = () => new Date().toISOString().slice(0, 10);
const saveBar = (label = 'Guardar') => `
  <div class="sticky bottom-0 z-10 -mx-1 flex justify-end gap-2 border-t border-line bg-marfil/95 px-1 py-3 backdrop-blur">
    <button type="submit" class="btn btn-primary px-6">${esc(label)}</button>
  </div>`;

// =====================================================================
// 1. Hoja de captura
// =====================================================================
export function captura(host, ctx) {
  const { opp } = ctx;
  const c = { ...ctx.data.captura };
  // Valores iniciales tomados de la oportunidad
  c.fecha ??= today();
  c.p_nombre ??= opp.client?.full_name || '';
  c.p_telefono ??= opp.client?.phone || '';
  c.p_correo ??= opp.client?.email || '';
  c.i_tipo_operacion ??= opp.type === 'renta_propietario' ? 'Renta' : 'Venta';

  const acabados = ESPACIOS_ACABADOS.map(([k, label]) => `
    <tr>
      <td class="td font-medium">${esc(label)}</td>
      ${['pisos', 'muros', 'plafones'].map((col) => `<td class="td py-1"><input name="ac_${k}_${col}" class="input py-1" value="${esc(c[`ac_${k}_${col}`] ?? '')}"></td>`).join('')}
    </tr>`).join('');

  host.innerHTML = `
  <form class="space-y-5">
    ${section('Datos del asesor inmobiliario', `
      ${readonly('Empresa inmobiliaria', EMPRESA.nombre)}
      ${readonly('Agente inmobiliario', opp.advisor?.full_name, { hint: 'Se toma del asesor asignado a la oportunidad' })}
      ${readonly('Teléfono celular', opp.advisor?.phone || '—', { hint: 'Edítalo en el perfil del asesor (Usuarios)' })}
      ${input(c, 'fecha', 'Fecha de elaboración', { type: 'date' })}
    `)}

    ${section('Datos generales del propietario', `
      ${input(c, 'p_nombre', 'Nombre del propietario', { span: 2 })}
      ${input(c, 'p_fecha_nacimiento', 'Fecha de nacimiento', { type: 'date' })}
      ${input(c, 'p_nacionalidad', 'Nacionalidad')}
      ${select(c, 'p_tipo_identificacion', 'Tipo de identificación', CAT.identificacion)}
      ${input(c, 'p_numero_identificacion', 'Número de identificación')}
      ${input(c, 'p_rfc', 'RFC')}
      ${input(c, 'p_curp', 'CURP')}
      ${select(c, 'p_estado_civil', 'Estado civil', CAT.estadoCivil)}
      ${select(c, 'p_regimen_matrimonio', 'Régimen del matrimonio', CAT.regimenMatrimonio)}
      ${input(c, 'p_direccion', 'Dirección del propietario', { span: 2 })}
      ${input(c, 'p_telefono', 'Teléfono celular')}
      ${input(c, 'p_telefono_fijo', 'Teléfono fijo')}
      ${input(c, 'p_correo', 'Correo electrónico', { type: 'email', span: 2 })}
    `)}

    ${section('Datos del inmueble a comercializar', `
      ${input(c, 'i_direccion', 'Dirección del inmueble', { span: 2 })}
      ${input(c, 'i_colonia', 'Colonia / fraccionamiento')}
      ${input(c, 'i_municipio', 'Municipio', { placeholder: 'Querétaro' })}
      ${select(c, 'i_tipo', 'Tipo de inmueble', CAT.tipoInmueble)}
      ${select(c, 'i_regimen', 'Régimen de propiedad', CAT.regimenPropiedad)}
      ${input(c, 'i_clave_catastral', 'Clave catastral')}
      ${select(c, 'i_tipo_operacion', 'Tipo de operación', CAT.tipoOperacion)}
      ${input(c, 'i_antiguedad', 'Antigüedad (años)', { type: 'number', min: 0 })}
      ${select(c, 'i_estado_conservacion', 'Estado de conservación', CAT.estadoConservacion)}
      ${input(c, 'i_niveles', 'Niveles', { type: 'number', min: 0 })}
      ${input(c, 'i_estacionamientos', 'Estacionamientos', { type: 'number', min: 0 })}
      ${input(c, 'i_m2_terreno', 'M² de terreno', { type: 'number', min: 0, step: '0.01' })}
      ${input(c, 'i_m2_construccion', 'M² de construcción', { type: 'number', min: 0, step: '0.01' })}
      ${input(c, 'i_recamaras', 'Recámaras', { type: 'number', min: 0 })}
      ${input(c, 'i_banos', 'Baños completos', { type: 'number', min: 0 })}
      ${input(c, 'i_medios_banos', 'Medios baños', { type: 'number', min: 0 })}
      ${select(c, 'i_uso_suelo', 'Uso de suelo', CAT.usoSuelo)}
      ${select(c, 'i_forma_adquisicion', 'Forma de adquisición', CAT.formaAdquisicion)}
      ${select(c, 'i_gravamenes', 'Gravámenes de la propiedad', CAT.gravamenes)}
      ${input(c, 'i_otras_areas', 'Otras áreas', { span: 2, placeholder: 'Roof garden, cuarto de servicio, jardín… o "No aplica"' })}
      ${textarea(c, 'i_distribucion', 'Distribución', { span: 4, placeholder: 'Casa habitación de un nivel, que consta de: estacionamiento para dos autos, sala, comedor, cocina…' })}
      ${textarea(c, 'i_equipamiento', 'Equipamiento en general', { span: 4, rows: 2 })}
      ${textarea(c, 'i_instalaciones', 'Instalaciones especiales', { span: 4, rows: 2 })}
      ${textarea(c, 'i_materiales', 'Materiales de construcción', { span: 4 })}
    `)}

    <section class="card overflow-x-auto p-6">
      <h3 class="font-serif text-xl">Acabados</h3>
      <table class="mt-4 w-full min-w-[640px]">
        <thead><tr><th class="th">Espacio</th><th class="th">Pisos</th><th class="th">Muros</th><th class="th">Plafones</th></tr></thead>
        <tbody>${acabados}</tbody>
      </table>
    </section>

    ${section('Infraestructura y urbanización', `
      ${select(c, 'z_clasificacion', 'Clasificación de la zona', CAT.clasificacionZona)}
      ${input(c, 'z_construcciones', 'Construcciones predominantes', { span: 3, placeholder: 'Casas habitación de uno y dos niveles' })}
      ${select(c, 'z_electrificacion', 'Electrificación', CAT.servicio)}
      ${select(c, 'z_agua', 'Agua potable', CAT.servicio)}
      ${select(c, 'z_drenaje', 'Drenaje', CAT.servicio)}
      ${input(c, 'z_vigilancia', 'Vigilancia', { placeholder: 'Municipal y privada' })}
      ${input(c, 'z_transporte', 'Transporte', { span: 2, placeholder: 'Colectivo, taxis y camiones' })}
    `)}
    ${saveBar('Guardar hoja de captura')}
  </form>`;

  host.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    await ctx.save('captura', readForm(e.target), { message: 'Hoja de captura guardada' });
  });
}

// =====================================================================
// 2. Perfilamiento del prospecto vendedor
// =====================================================================
export function perfilamiento(host, ctx) {
  const c = ctx.data.captura || {};
  const p = { ...ctx.data.perfilamiento };
  const d = perfilamientoDerivado(c, p);

  host.innerHTML = `
  <form class="space-y-5">
    ${!c.p_nombre ? '<p class="rounded bg-laton/10 p-3 text-sm text-laton">Primero llena la Hoja de captura: este módulo toma de ahí los datos del propietario y del inmueble.</p>' : ''}
    ${section('1. Datos generales del prospecto vendedor', `
      ${readonly('Nombre del propietario', c.p_nombre, { span: 2 })}
      ${readonly('Fecha de nacimiento', c.p_fecha_nacimiento ? date(c.p_fecha_nacimiento) : '—')}
      ${readonly('RFC', c.p_rfc)}
      ${readonly('CURP', c.p_curp)}
      ${readonly('Identificación', [c.p_tipo_identificacion, c.p_numero_identificacion].filter(Boolean).join(' · '))}
      ${readonly('Estado civil', c.p_estado_civil)}
      ${readonly('Régimen de matrimonio', c.p_regimen_matrimonio)}
      ${select(p, 'estado_civil_compra', 'Estado civil al momento de comprar el inmueble', CAT.estadoCivil, { span: 2 })}
      ${readonly('Domicilio', c.p_direccion, { span: 2 })}
      ${readonly('Teléfono', c.p_telefono)}
      ${readonly('Correo electrónico', c.p_correo)}
    `)}
    ${section('2. Datos generales del inmueble', `
      ${readonly('Forma de adquisición', c.i_forma_adquisicion)}
      ${readonly('Tipo de inmueble', c.i_tipo)}
      ${readonly('Ubicación', c.i_direccion, { span: 2 })}
      ${readonly('Características', c.i_distribucion, { span: 4 })}
      ${readonly('M² de terreno', c.i_m2_terreno)}
      ${readonly('M² de construcción', c.i_m2_construccion)}
      ${readonly('Régimen de propiedad', c.i_regimen)}
      ${readonly('Uso de suelo', c.i_uso_suelo)}
      ${readonly('Antigüedad', c.i_antiguedad ? `${c.i_antiguedad} años` : '—')}
      ${readonly('Gravámenes', c.i_gravamenes)}
    `)}
    ${section('3. Aspectos fiscales y pago de cuotas', `
      ${input(p, 'anio_escritura', 'Año de la escritura de compraventa', { type: 'number', min: 1900 })}
      ${readonly('¿Presenta CFDI o complemento CFDI?', d.cfdi, { hint: 'SI cuando la escritura es de 2014 en adelante' })}
      ${select(p, 'exento_isr', '¿Ha exentado ISR por venta de inmueble en los últimos 3 años?', CAT.siNo, { span: 2 })}
      ${readonly('¿Régimen de condominio?', d.condominio)}
      ${input(p, 'cuota_mtto', 'Cuota mensual de mantenimiento', { type: 'number', min: 0 })}
    `)}
    ${section('4. Obligaciones legales y fiscales del propietario', `
      ${readonly('Pago de ISR por enajenación', d.isr)}
      ${input(p, 'monto_isr', 'Monto aproximado ISR', { type: 'number', min: 0 })}
      ${readonly('Pago de cancelación de hipoteca', d.hipoteca)}
      ${input(p, 'monto_hipoteca', 'Monto aproximado cancelación', { type: 'number', min: 0 })}
      <p class="text-sm text-muted md:col-span-2 xl:col-span-4">Además deberá estar al corriente del pago de impuesto predial y cuotas de mantenimiento en su caso.</p>
    `)}
    ${saveBar('Guardar perfilamiento')}
  </form>`;

  const form = host.querySelector('form');
  form.addEventListener('change', (e) => {
    // Recalcula los campos derivados (CFDI, ISR…) sin guardar todavía
    if (!['anio_escritura', 'exento_isr'].includes(e.target.name)) return;
    ctx.data.perfilamiento = readForm(form);
    perfilamiento(host, ctx);
    host.querySelector(`[name="${e.target.name}"]`)?.focus();
  });
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await ctx.save('perfilamiento', readForm(e.target), { message: 'Perfilamiento guardado', rerender: true });
  });
}

// =====================================================================
// 3. Documentos
// =====================================================================
const ENTREGADO = { aprobado: 'SI', pendiente: 'NO', enviado: 'NO', en_revision: 'NO', rechazado: 'NO', no_aplica: 'NO APLICA' };

export async function documentos(host, ctx) {
  const c = ctx.data.captura || {};
  const dd = { ...ctx.data.documentos };
  dd.fecha_solicitud ??= today();
  const docs = await ctx.loadDocs();

  const groups = {};
  for (const d of docs) (groups[d.section] ||= []).push(d);
  const order = ['vendedor', 'conyuge', 'inmueble', 'nom247', 'comprador', 'general'];

  host.innerHTML = `
  <div class="space-y-5">
    <form id="doc-dates" class="card grid gap-4 p-6 md:grid-cols-4">
      ${input(dd, 'fecha_solicitud', 'Fecha de solicitud', { type: 'date' })}
      ${input(dd, 'fecha_cumplimiento', 'Fecha de cumplimiento', { type: 'date' })}
      ${readonly('Estado civil / régimen', [c.p_estado_civil, c.p_regimen_matrimonio].filter(Boolean).join(' · '))}
      ${readonly('Régimen de propiedad', c.i_regimen)}
      <div class="flex flex-wrap items-center justify-between gap-3 md:col-span-4">
        <button type="button" id="apply-cond" class="btn btn-ghost btn-sm">Aplicar condiciones de la Hoja de captura</button>
        <button type="submit" class="btn btn-primary btn-sm">Guardar fechas</button>
      </div>
      <p class="text-xs text-muted md:col-span-4">Acta de matrimonio: solo si es casado(a). Documentos del cónyuge: solo con sociedad conyugal. Cuotas de mantenimiento: solo en condominio. El propietario ve este checklist en su portal y puede subir los archivos.</p>
    </form>

    ${order.filter((s) => groups[s]).map((s) => `
      <section class="card p-6">
        <h3 class="font-serif text-xl">${esc(SECCIONES_DOCS[s] || s)}</h3>
        <table class="mt-3 w-full">
          <thead><tr><th class="th">Documento solicitado</th><th class="th w-40">Entregado</th><th class="th w-56">Archivo</th></tr></thead>
          <tbody>
            ${groups[s].map((d) => `
              <tr data-doc="${d.id}" class="${d.status === 'no_aplica' ? 'text-muted' : ''}">
                <td class="td">${esc(d.name)}${d.condition && !documentoAplica(d.condition, c) && d.status !== 'no_aplica' ? ' <span class="badge badge-warn">no aplica según captura</span>' : ''}</td>
                <td class="td py-1">
                  <select class="input py-1" data-entregado>
                    ${['SI', 'NO', 'NO APLICA'].map((o) => `<option ${ENTREGADO[d.status] === o ? 'selected' : ''}>${o}</option>`).join('')}
                  </select>
                </td>
                <td class="td text-xs">
                  ${d.file_path ? `<button type="button" class="text-brand hover:underline" data-view="${esc(d.file_path)}">Ver archivo</button> · ` : ''}
                  <span class="text-muted">${esc({ enviado: 'Subido por el cliente', en_revision: 'En revisión', rechazado: 'Rechazado', aprobado: 'Recibido', pendiente: 'Pendiente', no_aplica: 'No aplica' }[d.status])}</span>
                </td>
              </tr>`).join('')}
          </tbody>
        </table>
      </section>`).join('')}
    <p class="text-xs text-muted">Para revisar archivos con nota de rechazo usa la pestaña <a class="text-brand underline" href="#oportunidad/${ctx.opp.id}/documentos">Documentos</a> de la oportunidad.</p>
  </div>`;

  host.querySelector('#doc-dates').addEventListener('submit', async (e) => {
    e.preventDefault();
    await ctx.save('documentos', readForm(e.target), { message: 'Fechas guardadas' });
  });

  host.querySelectorAll('[data-entregado]').forEach((sel) => sel.addEventListener('change', async () => {
    const id = sel.closest('tr').dataset.doc;
    const status = { SI: 'aprobado', NO: 'pendiente', 'NO APLICA': 'no_aplica' }[sel.value];
    const patch = { status, reviewed_at: status === 'aprobado' ? new Date().toISOString() : null };
    const { error } = await supabase.from('opportunity_documents').update(patch).eq('id', id);
    toast(error ? error.message : 'Documento actualizado', error ? 'error' : 'ok');
    if (!error) documentos(host, ctx);
  }));

  host.querySelectorAll('[data-view]').forEach((b) => b.addEventListener('click', async () => {
    const url = await ctx.signedUrl(b.dataset.view);
    if (url) window.open(url, '_blank', 'noopener');
  }));

  host.querySelector('#apply-cond').addEventListener('click', async () => {
    let changed = 0;
    for (const d of docs) {
      if (!d.condition) continue;
      const aplica = documentoAplica(d.condition, c);
      let status = null;
      if (!aplica && d.status !== 'no_aplica') status = 'no_aplica';
      if (aplica && d.status === 'no_aplica') status = 'pendiente';
      if (status) {
        const { error } = await supabase.from('opportunity_documents').update({ status }).eq('id', d.id);
        if (error) return toast(error.message, 'error');
        changed++;
      }
    }
    toast(changed ? `${changed} documento(s) actualizados` : 'El checklist ya coincide con la captura', 'ok');
    documentos(host, ctx);
  });
}

// =====================================================================
// 4. Carta de derechos (NOM-247-SE-2021)
// =====================================================================
export async function derechos(host, ctx) {
  const v = { ...ctx.data.derechos };
  const isVenta = ctx.opp.type === 'venta';
  host.innerHTML = `
  <form class="space-y-5">
    ${!isVenta ? '<p class="rounded bg-laton/10 p-3 text-sm text-laton">La NOM-247-SE-2021 aplica a compraventa de casa habitación. En renta puedes imprimirla como referencia.</p>' : ''}
    <section class="card p-6 md:p-8">
      <p class="eyebrow">NOM-247-SE-2021</p>
      <h3 class="mt-1 font-serif text-2xl">Carta de derechos del vendedor hacia el consumidor</h3>
      <p class="mt-4 text-sm leading-6">${esc(DERECHOS_INTRO)}</p>
      <ol class="mt-4 list-decimal space-y-2 pl-6 text-sm leading-6 text-ink/90">${DERECHOS.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
    </section>
    ${section('Entrega y acuse', `
      ${input(v, 'fecha_entrega', 'Fecha de entrega', { type: 'date' })}
      ${select(v, 'entregada', '¿Carta entregada?', CAT.siNo)}
      ${select(v, 'acuse', '¿Acuse firmado recibido?', CAT.siNo)}
      ${input(v, 'consumidor', 'Nombre de quien recibe', { placeholder: ctx.data.captura?.p_nombre || '' })}
    `)}
    ${saveBar('Guardar')}
  </form>`;

  host.querySelector('form').addEventListener('submit', async (e) => {
    e.preventDefault();
    const values = readForm(e.target);
    await ctx.save('derechos', values, { message: 'Guardado' });
    // Sincroniza el checklist NOM-247
    const docs = await ctx.loadDocs();
    const carta = docs.find((d) => d.section === 'nom247' && /^Carta/.test(d.name));
    const acuse = docs.find((d) => d.section === 'nom247' && /^Acuse/.test(d.name));
    if (carta && values.entregada === 'SI') await supabase.from('opportunity_documents').update({ status: 'aprobado' }).eq('id', carta.id);
    if (acuse && values.acuse === 'SI') await supabase.from('opportunity_documents').update({ status: 'aprobado' }).eq('id', acuse.id);
  });
}

// =====================================================================
// 5. Levantamiento (todo sale de la Hoja de captura)
// =====================================================================
export function levantamiento(host, ctx) {
  const c = ctx.data.captura || {};
  host.innerHTML = `
  <div class="space-y-5">
    <p class="rounded bg-eucalipto/60 p-3 text-sm">Este módulo se genera automáticamente con la Hoja de captura. Para corregir algo, edítalo allá.</p>
    ${section('Levantamiento de información del bien inmueble', `
      ${readonly('Propietario', c.p_nombre, { span: 2 })}
      ${readonly('Dirección del inmueble', c.i_direccion, { span: 2 })}
      ${readonly('Tipo de inmueble', c.i_tipo)}
      ${readonly('Régimen de propiedad', c.i_regimen)}
      ${readonly('Antigüedad', c.i_antiguedad ? `${c.i_antiguedad} años` : '—')}
      ${readonly('Estado de conservación', c.i_estado_conservacion)}
      ${readonly('Niveles', c.i_niveles)}
      ${readonly('M² terreno', c.i_m2_terreno)}
      ${readonly('M² construcción', c.i_m2_construccion)}
      ${readonly('Estacionamientos', c.i_estacionamientos)}
      ${readonly('Recámaras', c.i_recamaras)}
      ${readonly('Baños completos', c.i_banos)}
      ${readonly('Medios baños', c.i_medios_banos)}
      ${readonly('Tipo de operación', c.i_tipo_operacion)}
      ${readonly('Otras áreas', c.i_otras_areas, { span: 4 })}
      ${readonly('Distribución', c.i_distribucion, { span: 4 })}
      ${readonly('Equipamiento general', c.i_equipamiento, { span: 4 })}
      ${readonly('Instalaciones especiales', c.i_instalaciones, { span: 4 })}
      ${readonly('Materiales de construcción', c.i_materiales, { span: 4 })}
    `)}
    <section class="card overflow-x-auto p-6">
      <h3 class="font-serif text-xl">Acabados</h3>
      <table class="mt-3 w-full min-w-[560px] text-sm">
        <thead><tr><th class="th">Espacio</th><th class="th">Pisos</th><th class="th">Muros</th><th class="th">Plafones</th></tr></thead>
        <tbody>${ESPACIOS_ACABADOS.map(([k, l]) => `<tr><td class="td font-medium">${esc(l)}</td>${['pisos', 'muros', 'plafones'].map((col) => `<td class="td">${esc(c[`ac_${k}_${col}`] || '—')}</td>`).join('')}</tr>`).join('')}</tbody>
      </table>
    </section>
    ${section('Infraestructura y urbanización', `
      ${readonly('Clasificación de la zona', c.z_clasificacion)}
      ${readonly('Construcciones predominantes', c.z_construcciones, { span: 3 })}
      ${readonly('Electrificación', c.z_electrificacion)}
      ${readonly('Agua potable', c.z_agua)}
      ${readonly('Drenaje', c.z_drenaje)}
      ${readonly('Vigilancia', c.z_vigilancia)}
      ${readonly('Transporte', c.z_transporte, { span: 4 })}
    `)}
  </div>`;
}

// =====================================================================
// 6. Opinión de valor (hojas 1 y 2)
// =====================================================================
const blankRows = (count, keys) => Array.from({ length: count }, () => Object.fromEntries(keys.map((k) => [k, ''])));

export function opinionDefaults(data) {
  const o = { ...(data.opinion || {}) };
  o.fecha ??= data.captura?.fecha || today();
  o.clasificacion_zona ??= 'Urbana';
  o.moneda ??= 'MXN';
  o.redondeo ??= '5000';
  o.terreno = o.terreno?.length ? o.terreno : blankRows(4, ['tel', 'colonia', 'superficie', 'precio']);
  o.construccion = o.construccion?.length ? o.construccion : blankRows(4, ['tel', 'precio', 'm2t', 'm2c']);
  o.rentas = o.rentas?.length ? o.rentas : blankRows(3, ['colonia', 'm2t', 'm2c', 'renta', 'tel']);
  o.fotos ||= { croquis: null, fachada: null, interiores: [] };
  return o;
}

function readOpinion(form, base) {
  const raw = readForm(form);
  const o = { ...base, terreno: [], construccion: [], rentas: [] };
  for (const [k, v] of Object.entries(raw)) {
    const m = k.match(/^(terreno|construccion|rentas)_(\d+)_(\w+)$/);
    if (m) {
      const [, list, i, key] = m;
      (o[list][i] ||= {})[key] = v;
    } else o[k] = v;
  }
  return o;
}

function rowsTable(list, name, cols, extra) {
  return `
  <table class="mt-3 w-full min-w-[640px]">
    <thead><tr>${cols.map(([, l]) => `<th class="th">${esc(l)}</th>`).join('')}${extra ? `<th class="th">${esc(extra)}</th>` : ''}</tr></thead>
    <tbody>
      ${list.map((r, i) => `
        <tr>
          ${cols.map(([k, , type]) => `<td class="td py-1"><input name="${name}_${i}_${k}" ${type ? `type="${type}" min="0" step="any"` : ''} class="input py-1" value="${esc(r[k] ?? '')}"></td>`).join('')}
          ${extra ? `<td class="td text-sm text-muted" data-out="${name}_${i}">—</td>` : ''}
        </tr>`).join('')}
    </tbody>
  </table>`;
}

export function opinion(host, ctx) {
  const c = ctx.data.captura || {};
  const o = opinionDefaults(ctx.data);

  host.innerHTML = `
  <form class="space-y-5">
    ${!c.i_m2_terreno ? '<p class="rounded bg-laton/10 p-3 text-sm text-laton">Captura primero los m² de terreno y construcción en la Hoja de captura.</p>' : ''}
    <div class="grid gap-5 2xl:grid-cols-[1fr_380px]">
      <div class="space-y-5">
        ${section('1. Antecedentes', `
          ${input(o, 'fecha', 'Fecha de la opinión de valor', { type: 'date' })}
          ${readonly('Propietario / representante legal', c.p_nombre)}
          ${readonly('Tipo de inmueble', c.i_tipo)}
          ${readonly('Régimen de propiedad', c.i_regimen)}
          ${readonly('Clave catastral', c.i_clave_catastral)}
          ${readonly('Dirección del bien inmueble', c.i_direccion, { span: 2 })}
          ${select(o, 'moneda', 'Moneda', ['MXN', 'USD', 'EUR'], { empty: false })}
          ${input(o, 'calles_transversales', 'Calles transversales', { span: 4 })}
        `)}
        ${section('2. Características de la zona', `
          ${select(o, 'clasificacion_zona', 'Clasificación de la zona', CAT.clasificacionZona)}
          ${readonly('Construcciones predominantes', c.z_construcciones)}
          ${readonly('Uso de suelo', c.i_uso_suelo)}
          <div></div>
          ${textarea(o, 'vias_acceso', 'Vías de acceso', { span: 2, rows: 2 })}
          ${textarea(o, 'servicios', 'Servicios municipales', { span: 2, rows: 2 })}
        `)}
        ${section('3. Condiciones físicas del inmueble', `
          ${readonly('M² de terreno', c.i_m2_terreno)}
          ${readonly('M² construcción habitacional', c.i_m2_construccion)}
          ${input(o, 'm2_comercial', 'M² comercial', { type: 'number', min: 0, step: 'any' })}
          ${input(o, 'm2_volados', 'M² volados y pasillos', { type: 'number', min: 0, step: 'any' })}
          ${input(o, 'm2_cobertizos', 'M² cobertizos con lámina o teja', { type: 'number', min: 0, step: 'any' })}
          <div data-out="m2total"></div>
          ${readonly('Niveles construidos', c.i_niveles)}
          ${readonly('Antigüedad / conservación', [c.i_antiguedad && `${c.i_antiguedad} años`, c.i_estado_conservacion].filter(Boolean).join(' · '))}
        `)}
        <section class="card overflow-x-auto p-6">
          <h3 class="font-serif text-xl">4. Análisis comparativo de mercado del terreno</h3>
          ${rowsTable(o.terreno, 'terreno', [['tel', 'Teléfono'], ['colonia', 'Colonia'], ['superficie', 'Superficie m²', 'number'], ['precio', 'Precio total', 'number']], 'Precio por m²')}
          <p class="mt-3 text-right text-sm">Valor promedio del m² de terreno: <strong data-out="vTerreno">—</strong></p>
        </section>
        <section class="card overflow-x-auto p-6">
          <h3 class="font-serif text-xl">5. Análisis comparativo de mercado de la construcción</h3>
          ${rowsTable(o.construccion, 'construccion', [['tel', 'Teléfono'], ['precio', 'Precio total del inmueble', 'number'], ['m2t', 'M² de terreno', 'number'], ['m2c', 'M² de construcción', 'number']], 'Precio por m²')}
          <p class="mt-3 text-right text-sm">Valor promedio del m² de construcción: <strong data-out="vConst">—</strong></p>
          <p class="mt-1 text-xs text-muted">Precio por m² = (precio total − m² de terreno × valor promedio del m² de terreno) ÷ m² de construcción.</p>
        </section>
        <section class="card overflow-x-auto p-6">
          <h3 class="font-serif text-xl">6. Análisis comparativo de mercado del inmueble</h3>
          <table class="mt-3 w-full min-w-[640px] text-sm">
            <thead><tr><th class="th">Tipo</th><th class="th">M²</th><th class="th">Valor unitario</th><th class="th w-28">Coeficiente</th><th class="th">V. unitario resultante</th><th class="th">Valor parcial</th></tr></thead>
            <tbody>
              ${[['Terreno', 'coef_terreno'], ['Habitacional', 'coef_habitacional'], ['Comercial', 'coef_comercial'], ['Volados y pasillos', 'coef_volados'], ['Cobertizos con lámina', 'coef_cobertizos']].map(([l, k], i) => `
                <tr><td class="td">${l}</td><td class="td" data-out="p${i}_m2"></td><td class="td" data-out="p${i}_vu"></td>
                <td class="td py-1"><input name="${k}" type="number" step="0.01" min="0" class="input py-1" value="${esc(o[k] ?? '1')}"></td>
                <td class="td" data-out="p${i}_vr"></td><td class="td" data-out="p${i}_parcial"></td></tr>`).join('')}
              <tr><td class="td font-semibold" colspan="5">Valor comparativo de mercado</td><td class="td font-semibold" data-out="valorMercado"></td></tr>
            </tbody>
          </table>
        </section>
        <section class="card overflow-x-auto p-6">
          <h3 class="font-serif text-xl">7. Análisis por capitalización de rentas (mensual)</h3>
          ${rowsTable(o.rentas, 'rentas', [['colonia', 'Colonia'], ['m2t', 'M² terreno', 'number'], ['m2c', 'M² construcción', 'number'], ['renta', 'Precio de renta', 'number'], ['tel', 'Teléfono']], 'Valor total · % capitalización')}
          <p class="mt-3 text-right text-sm">Promedio de capitalización de rentas mensual: <strong data-out="capMensual">—</strong></p>
        </section>
        <section class="card p-6">
          <h3 class="font-serif text-xl">9–11. Croquis y fotografías</h3>
          <div class="mt-4 grid gap-4 md:grid-cols-3" id="fotos"></div>
        </section>
      </div>

      <aside class="card h-fit space-y-4 p-6 2xl:sticky 2xl:top-6">
        <p class="eyebrow">8. Conclusión</p>
        <div>
          <p class="text-xs text-muted">Opinión sobre el posible valor del bien inmueble</p>
          <p class="font-serif text-4xl text-brand" data-out="valorRedondeado">—</p>
        </div>
        <div class="grid grid-cols-2 gap-3 border-t border-line pt-3 text-sm">
          <div><p class="text-muted">Renta mensual</p><p class="font-serif text-xl" data-out="renta">—</p></div>
          <div><p class="text-muted">Capitalización anual</p><p class="font-serif text-xl" data-out="capAnual">—</p></div>
        </div>
        ${select(o, 'redondeo', 'Redondear valor a', ['1000', '5000', '10000', '50000'], { empty: false })}
        <p class="text-sm leading-6 text-ink/85" data-out="conclusion"></p>
        <button type="submit" class="btn btn-primary w-full">Guardar opinión de valor</button>
      </aside>
    </div>
  </form>`;

  const form = host.querySelector('form');
  const out = (k, v) => { const el = host.querySelector(`[data-out="${k}"]`); if (el) el.textContent = v; };

  const recalc = () => {
    const cur = readOpinion(form, o);
    const r = calcularOpinion(c, cur);
    const m = (v) => (v ? money(v, cur.moneda) : '—');
    r.terreno.forEach((row, i) => out(`terreno_${i}`, row.ppm2 != null ? m(row.ppm2) : '—'));
    r.construccion.forEach((row, i) => out(`construccion_${i}`, row.ppm2 != null ? m(row.ppm2) : '—'));
    r.rentas.forEach((row, i) => out(`rentas_${i}`, row.cap != null ? `${m(row.valorTotal)} · ${(row.cap * 100).toFixed(3)} %` : '—'));
    out('vTerreno', m(r.vTerreno));
    out('vConst', m(r.vConst));
    host.querySelector('[data-out="m2total"]').innerHTML = readonly('Total m² de construcción', num(r.m2ConstTotal, 'es', 2));
    r.partidas.forEach((p, i) => { out(`p${i}_m2`, num(p.m2, 'es', 2)); out(`p${i}_vu`, m(p.vu)); out(`p${i}_vr`, m(p.vr)); out(`p${i}_parcial`, m(p.parcial)); });
    out('valorMercado', m(r.valorMercado));
    out('capMensual', r.capMensual ? `${(r.capMensual * 100).toFixed(3)} %` : '—');
    out('valorRedondeado', m(r.valorRedondeado));
    out('renta', m(r.rentaRedondeada));
    out('capAnual', r.capAnual ? `${(r.capAnual * 100).toFixed(2)} %` : '—');
    out('conclusion', r.valorRedondeado
      ? `En nuestra opinión y de acuerdo al estudio realizado, estimamos que el valor comercial del inmueble, que en números redondos es de ${money(r.valorRedondeado, cur.moneda)} (${importeConLetra(r.valorRedondeado, cur.moneda)}).${r.rentaRedondeada ? ` Se concluye que el inmueble se puede rentar mensualmente en ${money(r.rentaRedondeada, cur.moneda)} (${importeConLetra(r.rentaRedondeada, cur.moneda)}).` : ''}`
      : 'Captura comparables para obtener la conclusión.');
    return { cur, r };
  };

  // ---------- Fotos (bucket privado "documentos") ----------
  const drawFotos = async () => {
    const f = o.fotos;
    const slot = async (key, label, path) => `
      <div>
        <p class="label">${esc(label)}</p>
        <div class="flex aspect-[4/3] items-center justify-center overflow-hidden rounded border border-dashed border-line bg-white">
          ${path ? `<img src="${esc(await ctx.signedUrl(path) || '')}" alt="" class="h-full w-full object-cover">` : '<span class="text-xs text-muted">Sin imagen</span>'}
        </div>
        <label class="btn btn-ghost btn-sm mt-2 w-full">Subir<input type="file" accept="image/*" class="hidden" data-foto="${key}"></label>
      </div>`;
    const interiores = await Promise.all((f.interiores || []).map(async (p, i) => `
      <div class="relative"><img src="${esc(await ctx.signedUrl(p) || '')}" alt="" class="aspect-[4/3] w-full rounded object-cover">
      <button type="button" class="absolute right-1 top-1 rounded bg-ink/70 px-1.5 text-xs text-marfil" data-rm-int="${i}">✕</button></div>`));
    host.querySelector('#fotos').innerHTML = `
      ${await slot('croquis', '9. Croquis de ubicación', f.croquis)}
      ${await slot('fachada', '10. Fotografía de fachada', f.fachada)}
      <div>
        <p class="label">11. Fotografías de interiores</p>
        <div class="grid grid-cols-2 gap-2">${interiores.join('')}</div>
        <label class="btn btn-ghost btn-sm mt-2 w-full">Agregar fotos<input type="file" accept="image/*" multiple class="hidden" data-foto="interiores"></label>
      </div>`;
    host.querySelectorAll('[data-foto]').forEach((inp) => inp.addEventListener('change', async () => {
      const files = [...inp.files];
      if (!files.length) return;
      const paths = [];
      for (const file of files) {
        const ext = (file.name.split('.').pop() || 'jpg').toLowerCase().replace(/[^a-z0-9]/g, '');
        const path = `${ctx.opp.id}/expediente/${inp.dataset.foto}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}.${ext}`;
        const { error } = await supabase.storage.from('documentos').upload(path, file);
        if (error) { toast(error.message, 'error'); continue; }
        paths.push(path);
      }
      if (inp.dataset.foto === 'interiores') o.fotos.interiores = [...(o.fotos.interiores || []), ...paths];
      else o.fotos[inp.dataset.foto] = paths[0] || o.fotos[inp.dataset.foto];
      await ctx.save('opinion', { ...readOpinion(form, o), fotos: o.fotos }, { message: 'Foto guardada' });
      drawFotos();
    }));
    host.querySelectorAll('[data-rm-int]').forEach((b) => b.addEventListener('click', async () => {
      o.fotos.interiores.splice(Number(b.dataset.rmInt), 1);
      await ctx.save('opinion', { ...readOpinion(form, o), fotos: o.fotos }, { message: 'Foto eliminada' });
      drawFotos();
    }));
  };

  form.addEventListener('input', recalc);
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    const { cur, r } = recalc();
    await ctx.save('opinion', { ...cur, fotos: o.fotos }, { message: 'Opinión de valor guardada' });
    // Historial en la tabla valuations (una por oportunidad)
    const row = {
      opportunity_id: ctx.opp.id,
      property_id: ctx.exp.property_id,
      address: c.i_direccion || ctx.opp.title,
      property_type: TIPO_A_INVENTARIO[c.i_tipo] || null,
      construction_m2: r.m2ConstTotal || null,
      land_m2: r.m2Terreno || null,
      comparables: { terreno: cur.terreno, construccion: cur.construccion, rentas: cur.rentas },
      value_min: r.valorMercado ? Math.round(r.valorMercado * 0.95) : null,
      value_suggested: r.valorRedondeado || null,
      value_max: r.valorMercado ? Math.round(r.valorMercado * 1.05) : null,
      rent_suggested: r.rentaRedondeada || null,
      cap_rate_monthly: r.capMensual || null,
      currency: cur.moneda,
      created_by: ctx.profile.id,
    };
    const { data: existing } = await supabase.from('valuations').select('id').eq('opportunity_id', ctx.opp.id).maybeSingle();
    const res = existing
      ? await supabase.from('valuations').update(row).eq('id', existing.id)
      : await supabase.from('valuations').insert(row);
    if (res.error) toast(res.error.message, 'error');
  });

  recalc();
  drawFotos();
}

// =====================================================================
// 7. Ficha técnica (+ crear propiedad en el inventario)
// =====================================================================
export function ficha(host, ctx) {
  const c = ctx.data.captura || {};
  const f = { ...ctx.data.ficha };
  const r = calcularOpinion(c, opinionDefaults(ctx.data));
  f.valor_oferta ??= r.valorRedondeado || '';
  f.moneda ??= ctx.data.opinion?.moneda || 'MXN';

  host.innerHTML = `
  <form class="space-y-5">
    ${section('Descripción para publicidad', `
      ${textarea(f, 'descripcion', 'Descripción', { span: 4, rows: 5, placeholder: 'Describe el inmueble para tu publicidad: servicios cercanos, opciones de pago aceptadas, asesoría sin costo, etc.' })}
    `)}
    ${section('Características', `
      ${readonly('Tipo de inmueble', c.i_tipo)}
      ${readonly('Régimen de propiedad', c.i_regimen)}
      ${readonly('Antigüedad', c.i_antiguedad ? `${c.i_antiguedad} años` : '—')}
      ${readonly('Estado de conservación', c.i_estado_conservacion)}
      ${readonly('M² de terreno', c.i_m2_terreno)}
      ${readonly('M² de construcción', c.i_m2_construccion)}
      ${readonly('Espacios para autos', c.i_estacionamientos)}
      ${readonly('Recámaras', c.i_recamaras)}
      ${readonly('Baños', c.i_banos)}
      ${readonly('Medios baños', c.i_medios_banos)}
      ${select(f, 'closets', 'Clósets', CAT.numeros)}
      ${select(f, 'cocina_integral', 'Cocina integral', CAT.siNo)}
      ${select(f, 'cisterna', 'Cisterna', CAT.siNo)}
      ${readonly('Ubicación', c.i_direccion, { span: 3 })}
      ${readonly('Distribución', c.i_distribucion, { span: 4 })}
      ${readonly('Instalaciones especiales', c.i_instalaciones, { span: 2 })}
      ${readonly('Materiales de construcción', c.i_materiales, { span: 2 })}
    `)}
    ${section('Infraestructura de la zona y urbanización', `
      ${readonly('Clasificación de la zona', c.z_clasificacion)}
      ${readonly('Construcciones predominantes', c.z_construcciones, { span: 3 })}
      ${readonly('Electrificación', c.z_electrificacion)}
      ${readonly('Agua potable', c.z_agua)}
      ${readonly('Vigilancia', c.z_vigilancia)}
      ${readonly('Transporte', c.z_transporte)}
    `)}
    ${section('Oferta', `
      ${input(f, 'valor_oferta', 'Valor de la oferta', { type: 'number', min: 0, step: '1000' })}
      ${select(f, 'moneda', 'Moneda', ['MXN', 'USD', 'EUR'], { empty: false })}
      ${readonly('Valor según opinión de valor', r.valorRedondeado ? money(r.valorRedondeado, f.moneda) : '—')}
      ${readonly('Situación legal', c.i_gravamenes)}
    `)}
    <div class="card flex flex-wrap items-center justify-between gap-4 p-6">
      <div class="text-sm">
        <p class="font-medium">Inventario web</p>
        <p class="text-muted">${ctx.exp.property_id ? 'Esta ficha ya está ligada a una propiedad del inventario.' : 'Crea la propiedad como borrador; después agrega fotos, textos en inglés y alemán, y publícala.'}</p>
      </div>
      <div class="flex gap-2">
        ${ctx.exp.property_id ? `<a href="#propiedad/${ctx.exp.property_id}" class="btn btn-ghost">Abrir propiedad</a>` : ''}
        <button type="button" id="to-inventory" class="btn btn-ghost">${ctx.exp.property_id ? 'Actualizar propiedad con la ficha' : 'Crear propiedad en inventario'}</button>
      </div>
    </div>
    ${saveBar('Guardar ficha técnica')}
  </form>`;

  const form = host.querySelector('form');
  form.addEventListener('submit', async (e) => {
    e.preventDefault();
    await ctx.save('ficha', readForm(form), { message: 'Ficha técnica guardada' });
  });

  host.querySelector('#to-inventory').addEventListener('click', async () => {
    const fv = readForm(form);
    await ctx.save('ficha', fv, { silent: true });
    const amenities = [
      fv.cocina_integral === 'SI' && 'cocina integral',
      fv.cisterna === 'SI' && 'cisterna',
      Number(fv.closets) > 0 && `${fv.closets} clósets`,
      c.i_otras_areas && !/no aplica/i.test(c.i_otras_areas) && c.i_otras_areas,
    ].filter(Boolean);
    const tipo = TIPO_A_INVENTARIO[c.i_tipo] || 'casa';
    const zona = c.i_colonia || '';
    const row = {
      title_es: `${c.i_tipo || 'Inmueble'}${zona ? ` en ${zona}` : ''}`,
      description_es: fv.descripcion || c.i_distribucion || null,
      operation: c.i_tipo_operacion === 'Renta' ? 'renta' : 'venta',
      property_type: tipo,
      price: fv.valor_oferta || null,
      currency: fv.moneda || 'MXN',
      zone: zona || null,
      city: c.i_municipio || 'Querétaro',
      address: c.i_direccion || null,
      bedrooms: c.i_recamaras || null,
      bathrooms: c.i_banos ? Number(c.i_banos) + (Number(c.i_medios_banos) || 0) * 0.5 : null,
      parking: c.i_estacionamientos || null,
      construction_m2: c.i_m2_construccion || null,
      land_m2: c.i_m2_terreno || null,
      amenities,
      owner_id: ctx.opp.client_id || null,
    };
    let propertyId = ctx.exp.property_id;
    if (propertyId) {
      const { error } = await supabase.from('properties').update(row).eq('id', propertyId);
      if (error) return toast(error.message, 'error');
      toast('Propiedad actualizada con la ficha técnica', 'ok');
    } else {
      const slugBase = `${tipo}-${zona || 'queretaro'}`.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[^a-z0-9]+/g, '-');
      const { data, error } = await supabase.from('properties')
        .insert({ ...row, slug: `${slugBase}-${Date.now().toString(36)}`, status: 'borrador', published: false, created_by: ctx.profile.id })
        .select('id').single();
      if (error) return toast(error.message, 'error');
      propertyId = data.id;
      await supabase.from('expedientes').update({ property_id: propertyId }).eq('id', ctx.exp.id);
      await supabase.from('opportunity_properties').insert({ opportunity_id: ctx.opp.id, property_id: propertyId, status: 'propuesta' });
      ctx.exp.property_id = propertyId;
      toast('Propiedad creada como borrador en el inventario', 'ok');
    }
    ficha(host, ctx);
  });
}
