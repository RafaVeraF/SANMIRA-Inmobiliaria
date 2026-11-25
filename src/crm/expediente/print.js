// Versiones imprimibles (y "Guardar como PDF") de los módulos, con el formato del Excel y la marca SANMIRA.
import { esc, money, num, date } from '../../lib/util.js';
import { EMPRESA, ESPACIOS_ACABADOS, DERECHOS, DERECHOS_INTRO, SECCIONES_DOCS, NOTA_OPINION, avisoPrivacidad, datosContacto } from './config.js';
import { perfilamientoDerivado, calcularOpinion, importeConLetra } from './calc.js';
import { opinionDefaults } from './modules.js';

const v = (x) => esc(x == null || x === '' ? '—' : x);
const fdate = (d) => (d ? date(d) : '—');

const CSS = `
  @page { size: letter; margin: 14mm 14mm 16mm; }
  * { box-sizing: border-box; -webkit-print-color-adjust: exact; print-color-adjust: exact; }
  body { font-family: 'DM Sans', system-ui, sans-serif; color: #13241C; font-size: 9pt; line-height: 1.3; margin: 0; background: #fff; }
  h1, h2, h3, .serif { font-family: Cardo, Georgia, serif; font-weight: 400; }
  .page { page-break-after: always; }
  .page:last-child { page-break-after: auto; }
  .head { display: flex; justify-content: space-between; align-items: center; border-bottom: 1.5px solid #1E3B2F; padding-bottom: 8px; }
  .head svg, .head img { height: 38px; width: auto; }
  .head table td { padding: 0 6px; font-size: 8pt; } .head table td:first-child { color: #4D5E55; text-align: right; }
  .title { text-align: center; font-family: Cardo, serif; font-size: 14pt; letter-spacing: .04em; margin: 8px 0 4px; }
  .sec { background: #1E3B2F; color: #F6F2EA; padding: 3px 8px; font-size: 8pt; font-weight: 600; letter-spacing: .06em; text-transform: uppercase; margin: 8px 0 3px; break-after: avoid; }
  .grid { display: grid; grid-template-columns: repeat(4, 1fr); gap: 1px 10px; }
  .f { border-bottom: 1px solid #D9D3C6; padding: 2px 0; } .f b { display: block; font-size: 6.5pt; color: #4D5E55; font-weight: 600; text-transform: uppercase; letter-spacing: .06em; }
  .s2 { grid-column: span 2; } .s3 { grid-column: span 3; } .s4 { grid-column: span 4; }
  table.t { width: 100%; border-collapse: collapse; font-size: 8.5pt; margin-top: 2px; }
  table.t th { background: #DCE5DA; text-align: left; padding: 2px 6px; font-size: 7pt; text-transform: uppercase; letter-spacing: .05em; }
  table.t td { border-bottom: 1px solid #D9D3C6; padding: 2px 6px; vertical-align: top; }
  .num { text-align: right; white-space: nowrap; }
  .sign { display: grid; grid-template-columns: 1fr 1fr; gap: 50px; margin-top: 30px; text-align: center; font-size: 8.5pt; break-inside: avoid; }
  .sign div { border-top: 1px solid #13241C; padding-top: 4px; }
  .sign small { display: block; color: #4D5E55; }
  .legal { margin-top: 10px; font-size: 6.5pt; color: #4D5E55; text-align: justify; line-height: 1.45; }
  .legal strong { color: #13241C; }
  .foot { margin-top: 6px; padding-top: 4px; border-top: 1px solid #D9D3C6; font-size: 7pt; color: #4D5E55; text-align: center; }
  .big { font-family: Cardo, serif; font-size: 22pt; color: #1E3B2F; }
  .box { border: 1px solid #1E3B2F; padding: 10px 12px; margin-top: 8px; }
  .photos { display: grid; grid-template-columns: 1fr 1fr; gap: 8px; margin-top: 4px; } .photos img { width: 100%; aspect-ratio: 16/10; object-fit: cover; border: 1px solid #D9D3C6; }
  .muted { color: #4D5E55; } ol li { margin-bottom: 4px; text-align: justify; font-size: 9pt; }
  .bar { position: fixed; top: 10px; right: 10px; } .bar button { background: #1E3B2F; color: #F6F2EA; border: 0; padding: 9px 16px; border-radius: 4px; cursor: pointer; font: inherit; }
  @media print { .bar { display: none; } }
`;

function header(ctx, titulo, fecha, extra = '') {
  return `
  <div class="head">
    ${LOGO_SVG}
    <table>
      <tr><td>Empresa inmobiliaria:</td><td><b>${esc(EMPRESA.nombre)}</b></td></tr>
      <tr><td>Asesor inmobiliario:</td><td>${v(ctx.opp.advisor?.full_name)}</td></tr>
      <tr><td>Teléfono:</td><td>${v(ctx.opp.advisor?.phone)}</td></tr>
      <tr><td>Fecha de elaboración:</td><td>${fdate(fecha)}${extra ? ` · ${esc(extra)}` : ''}</td></tr>
    </table>
  </div>
  <h1 class="title">${esc(titulo)}</h1>`;
}

const field = (label, value, cls = '') => `<div class="f ${cls}"><b>${esc(label)}</b>${v(value)}</div>`;

const signatures = (ctx, left = 'Elaboró', right = 'Recibió') => `
  <div class="sign">
    <div>${esc(left)}<br><br><strong>EL ASESOR INMOBILIARIO</strong><small>${v(ctx.opp.advisor?.full_name)}</small></div>
    <div>${esc(right)}<br><br><strong>EL PROPIETARIO</strong><small>${v(ctx.data.captura?.p_nombre)}</small></div>
  </div>`;

const legal = (withAviso = true) => `
  ${withAviso ? `<p class="legal"><strong>AVISO DE PRIVACIDAD.</strong> ${esc(avisoPrivacidad())}</p>` : ''}
  <p class="foot">${esc(datosContacto())}</p>`;

const acabadosTable = (c) => `
  <table class="t"><thead><tr><th>Espacio</th><th>Pisos</th><th>Muros</th><th>Plafones</th></tr></thead><tbody>
  ${ESPACIOS_ACABADOS.map(([k, l]) => `<tr><td><b>${esc(l)}</b></td>${['pisos', 'muros', 'plafones'].map((col) => `<td>${v(c[`ac_${k}_${col}`])}</td>`).join('')}</tr>`).join('')}
  </tbody></table>`;

const zonaGrid = (c) => `
  <div class="grid">
    ${field('Clasificación de la zona', c.z_clasificacion)}${field('Construcciones predominantes', c.z_construcciones, 's2')}${field('Vigilancia', c.z_vigilancia)}
    ${field('Electrificación', c.z_electrificacion)}${field('Agua potable', c.z_agua)}${field('Drenaje', c.z_drenaje)}${field('Transporte', c.z_transporte)}
  </div>`;

const inmuebleGrid = (c) => `
  <div class="grid">
    ${field('Dirección del inmueble', c.i_direccion, 's4')}
    ${field('Tipo de inmueble', c.i_tipo)}${field('Régimen de propiedad', c.i_regimen)}${field('Clave catastral', c.i_clave_catastral)}${field('Tipo de operación', c.i_tipo_operacion)}
    ${field('Antigüedad', c.i_antiguedad && `${c.i_antiguedad} años`)}${field('Estado de conservación', c.i_estado_conservacion)}${field('Niveles', c.i_niveles)}${field('Estacionamientos', c.i_estacionamientos)}
    ${field('M² de terreno', c.i_m2_terreno)}${field('M² de construcción', c.i_m2_construccion)}${field('Recámaras', c.i_recamaras)}${field('Baños completos / medios', [c.i_banos, c.i_medios_banos].filter((x) => x !== undefined && x !== '').join(' / '))}
    ${field('Uso de suelo', c.i_uso_suelo)}${field('Forma de adquisición', c.i_forma_adquisicion)}${field('Gravámenes', c.i_gravamenes)}${field('Otras áreas', c.i_otras_areas)}
    ${field('Distribución', c.i_distribucion, 's4')}
    ${field('Equipamiento en general', c.i_equipamiento, 's2')}${field('Instalaciones especiales', c.i_instalaciones, 's2')}
    ${field('Materiales de construcción', c.i_materiales, 's4')}
  </div>`;

// ---------------------------------------------------------------------
const PAGES = {
  captura(ctx) {
    const c = ctx.data.captura || {};
    return `${header(ctx, 'HOJA DE CAPTURA', c.fecha)}
      <div class="sec">Datos generales del propietario</div>
      <div class="grid">
        ${field('Nombre del propietario', c.p_nombre, 's2')}${field('Fecha de nacimiento', fdate(c.p_fecha_nacimiento))}${field('Nacionalidad', c.p_nacionalidad)}
        ${field('Tipo de identificación', c.p_tipo_identificacion)}${field('Número de identificación', c.p_numero_identificacion)}${field('RFC', c.p_rfc)}${field('CURP', c.p_curp)}
        ${field('Estado civil', c.p_estado_civil)}${field('Régimen del matrimonio', c.p_regimen_matrimonio)}${field('Teléfono celular', c.p_telefono)}${field('Correo electrónico', c.p_correo)}
        ${field('Dirección del propietario', c.p_direccion, 's4')}
      </div>
      <div class="sec">Datos del inmueble a comercializar</div>${inmuebleGrid(c)}
      <div class="sec">Acabados</div>${acabadosTable(c)}
      <div class="sec">Infraestructura y urbanización</div>${zonaGrid(c)}
      ${legal()}`;
  },

  perfilamiento(ctx) {
    const c = ctx.data.captura || {};
    const p = ctx.data.perfilamiento || {};
    const d = perfilamientoDerivado(c, p);
    const m = (x) => (x ? money(x, 'MXN') : '—');
    return `${header(ctx, 'PERFILAMIENTO DEL PROSPECTO VENDEDOR Y DEL INMUEBLE', c.fecha)}
      <div class="sec">1. Datos generales del prospecto vendedor</div>
      <div class="grid">
        ${field('Nombre del propietario', c.p_nombre, 's2')}${field('Fecha de nacimiento', fdate(c.p_fecha_nacimiento))}${field('CURP', c.p_curp)}
        ${field('RFC', c.p_rfc)}${field('Identificación', [c.p_tipo_identificacion, c.p_numero_identificacion].filter(Boolean).join(' · '))}${field('Estado civil', c.p_estado_civil)}${field('Régimen de matrimonio', c.p_regimen_matrimonio)}
        ${field('Estado civil al comprar el inmueble', p.estado_civil_compra, 's2')}${field('Teléfono', c.p_telefono)}${field('Correo electrónico', c.p_correo)}
        ${field('Domicilio', c.p_direccion, 's4')}
      </div>
      <div class="sec">2. Datos generales del inmueble</div>
      <div class="grid">
        ${field('Forma de adquisición', c.i_forma_adquisicion, 's2')}${field('Tipo de inmueble', c.i_tipo, 's2')}
        ${field('Ubicación', c.i_direccion, 's4')}${field('Características', c.i_distribucion, 's4')}
        ${field('M² de terreno', c.i_m2_terreno)}${field('M² de construcción', c.i_m2_construccion)}${field('Régimen de propiedad', c.i_regimen)}${field('Uso de suelo', c.i_uso_suelo)}
        ${field('Antigüedad', c.i_antiguedad && `${c.i_antiguedad} años`)}${field('Gravámenes de la propiedad', c.i_gravamenes, 's3')}
      </div>
      <div class="sec">3. Aspectos fiscales y pago de cuotas del inmueble</div>
      <div class="grid">
        ${field('Año de la escritura de compraventa', p.anio_escritura)}${field('¿Presenta CFDI o complemento CFDI?', d.cfdi)}
        ${field('¿Ha exentado ISR en venta de inmueble en los últimos 3 años?', p.exento_isr, 's2')}
        ${field('¿Régimen de condominio?', d.condominio)}${field('Cuota mensual de mantenimiento', m(p.cuota_mtto))}
      </div>
      <div class="sec">4. Obligaciones legales y fiscales a cargo del propietario</div>
      <table class="t"><thead><tr><th>Concepto</th><th>Situación</th><th class="num">Monto aproximado</th></tr></thead><tbody>
        <tr><td>Pago de Impuesto Sobre la Renta por enajenación</td><td>${v(d.isr)}</td><td class="num">${m(p.monto_isr)}</td></tr>
        <tr><td>Pago de cancelación de hipoteca</td><td>${v(d.hipoteca)}</td><td class="num">${m(p.monto_hipoteca)}</td></tr>
      </tbody></table>
      <p class="muted" style="font-size:9pt;margin-top:6px">Además deberá estar al corriente del pago de impuesto predial y cuotas de mantenimiento en su caso.</p>
      ${signatures(ctx)}${legal()}`;
  },

  documentos(ctx) {
    const c = ctx.data.captura || {};
    const dd = ctx.data.documentos || {};
    const groups = {};
    for (const d of ctx.docs || []) (groups[d.section] ||= []).push(d);
    const ent = (s) => ({ aprobado: 'SI', no_aplica: 'NO APLICA' }[s] || 'NO');
    return `${header(ctx, 'LISTA DE DOCUMENTOS SOLICITADOS DEL PROSPECTO VENDEDOR Y DEL INMUEBLE', c.fecha)}
      <div class="grid">${field('Fecha de solicitud', fdate(dd.fecha_solicitud), 's2')}${field('Fecha de cumplimiento', fdate(dd.fecha_cumplimiento), 's2')}</div>
      <div class="sec">Datos generales del prospecto vendedor / arrendador y del inmueble</div>
      <div class="grid">
        ${field('Nombre', c.p_nombre, 's2')}${field('Estado civil', c.p_estado_civil)}${field('Régimen', c.p_regimen_matrimonio)}
        ${field('Teléfono fijo', c.p_telefono_fijo)}${field('Teléfono celular', c.p_telefono)}${field('Correo electrónico', c.p_correo, 's2')}
        ${field('Dirección del inmueble a comercializar', c.i_direccion, 's4')}
        ${field('Tipo de inmueble', c.i_tipo)}${field('Tipo de operación', c.i_tipo_operacion)}${field('Régimen de propiedad', c.i_regimen, 's2')}
      </div>
      ${['vendedor', 'conyuge', 'inmueble', 'nom247', 'comprador', 'general'].filter((s) => groups[s]).map((s) => `
        <div class="sec">${esc(SECCIONES_DOCS[s])}</div>
        <table class="t"><thead><tr><th>Documento solicitado</th><th style="width:110px">Entregado</th></tr></thead><tbody>
          ${groups[s].map((d) => `<tr><td>${esc(d.name.toUpperCase())}</td><td>${ent(d.status)}</td></tr>`).join('')}
        </tbody></table>`).join('')}
      ${signatures(ctx, 'Recibe', 'Entrega')}${legal()}`;
  },

  derechos(ctx) {
    const c = ctx.data.captura || {};
    const dv = ctx.data.derechos || {};
    return `${header(ctx, 'CARTA DE DERECHOS DEL VENDEDOR HACIA EL CONSUMIDOR', dv.fecha_entrega || c.fecha)}
      <p style="text-align:justify">${esc(DERECHOS_INTRO)}</p>
      <ol>${DERECHOS.map((d) => `<li>${esc(d)}</li>`).join('')}</ol>
      <div class="sign">
        <div>Entrega<br><br><strong>EL ASESOR INMOBILIARIO</strong><small>${v(ctx.opp.advisor?.full_name)}</small></div>
        <div>Recibe<br><br><strong>EL CONSUMIDOR</strong><small>${v(dv.consumidor || c.p_nombre)}</small></div>
      </div>
      ${legal(false)}`;
  },

  levantamiento(ctx) {
    const c = ctx.data.captura || {};
    return `${header(ctx, 'LEVANTAMIENTO DE INFORMACIÓN DEL BIEN INMUEBLE', c.fecha)}
      <div class="grid">${field('Nombre del propietario', c.p_nombre, 's4')}</div>
      <div class="sec">Datos del inmueble</div>${inmuebleGrid(c)}
      <div class="sec">Infraestructura y urbanización</div>${zonaGrid(c)}
      <div class="sec">Acabados</div>${acabadosTable(c)}
      ${signatures(ctx, 'Elaboró', 'Autorizó')}${legal(false)}`;
  },

  async opinion(ctx) {
    const c = ctx.data.captura || {};
    const o = opinionDefaults(ctx.data);
    const r = calcularOpinion(c, o);
    const m = (x) => (x ? money(x, o.moneda) : '—');
    const urls = async (p) => (p ? await ctx.signedUrl(p) : null);
    const croquis = await urls(o.fotos.croquis);
    const fachada = await urls(o.fotos.fachada);
    const interiores = (await Promise.all((o.fotos.interiores || []).slice(0, 6).map(urls))).filter(Boolean);

    const hoja1 = `${header(ctx, 'ESTIMACIÓN DEL VALOR COMERCIAL DEL BIEN INMUEBLE', o.fecha, 'Hoja 1 de 2')}
      <div class="sec">1. Antecedentes</div>
      <div class="grid">
        ${field('Fecha de la opinión de valor', fdate(o.fecha))}${field('Propietario / representante legal', c.p_nombre, 's3')}
        ${field('Tipo de inmueble', c.i_tipo)}${field('Régimen de propiedad', c.i_regimen)}${field('Clave catastral', c.i_clave_catastral, 's2')}
        ${field('Dirección del bien inmueble', c.i_direccion, 's4')}${field('Calles transversales', o.calles_transversales, 's4')}
      </div>
      <div class="sec">2. Características de la zona</div>
      <div class="grid">
        ${field('Clasificación de la zona', o.clasificacion_zona)}${field('Construcciones predominantes', c.z_construcciones, 's2')}${field('Uso de suelo', c.i_uso_suelo)}
        ${field('Vías de acceso', o.vias_acceso, 's4')}${field('Servicios municipales', o.servicios, 's4')}
      </div>
      <div class="sec">3. Condiciones físicas y características del inmueble</div>
      <table class="t"><tbody>
        <tr><td>Metros cuadrados de terreno</td><td class="num">${num(r.m2Terreno, 'es', 2)}</td><td>Niveles construidos</td><td class="num">${v(c.i_niveles)}</td></tr>
        <tr><td>Construcción habitacional</td><td class="num">${num(r.m2Hab, 'es', 2)}</td><td>Antigüedad</td><td class="num">${v(c.i_antiguedad && `${c.i_antiguedad} años`)}</td></tr>
        <tr><td>Construcción comercial</td><td class="num">${num(r.m2Com, 'es', 2)}</td><td>Estado de conservación</td><td class="num">${v(c.i_estado_conservacion)}</td></tr>
        <tr><td>Volados y pasillos</td><td class="num">${num(r.m2Vol, 'es', 2)}</td><td></td><td></td></tr>
        <tr><td>Cobertizos con lámina o teja</td><td class="num">${num(r.m2Cob, 'es', 2)}</td><td></td><td></td></tr>
        <tr><td><b>Total m² de construcción</b></td><td class="num"><b>${num(r.m2ConstTotal, 'es', 2)}</b></td><td></td><td></td></tr>
      </tbody></table>
      <div class="sec">4. Análisis comparativo de mercado del terreno</div>
      <table class="t"><thead><tr><th>Teléfono</th><th>Colonia</th><th class="num">Superficie m²</th><th class="num">Precio total</th><th class="num">Precio por m²</th></tr></thead><tbody>
        ${r.terreno.filter((x) => x.precio || x.superficie).map((x) => `<tr><td>${v(x.tel)}</td><td>${v(x.colonia)}</td><td class="num">${num(x.superficie, 'es', 2)}</td><td class="num">${m(x.precio)}</td><td class="num">${m(x.ppm2)}</td></tr>`).join('')}
        <tr><td colspan="4"><b>Valor promedio del m² de terreno</b></td><td class="num"><b>${m(r.vTerreno)}</b></td></tr>
      </tbody></table>
      <div class="sec">5. Análisis comparativo de mercado de la construcción</div>
      <table class="t"><thead><tr><th>Teléfono</th><th class="num">Precio total</th><th class="num">M² terreno</th><th class="num">M² construcción</th><th class="num">Precio por m²</th></tr></thead><tbody>
        ${r.construccion.filter((x) => x.precio || x.m2c).map((x) => `<tr><td>${v(x.tel)}</td><td class="num">${m(x.precio)}</td><td class="num">${num(x.m2t, 'es', 2)}</td><td class="num">${num(x.m2c, 'es', 2)}</td><td class="num">${m(x.ppm2)}</td></tr>`).join('')}
        <tr><td colspan="4"><b>Valor promedio del m² de construcción</b></td><td class="num"><b>${m(r.vConst)}</b></td></tr>
      </tbody></table>
      ${legal(false)}`;

    const hoja2 = `${header(ctx, 'ESTIMACIÓN DEL VALOR COMERCIAL DEL BIEN INMUEBLE', o.fecha, 'Hoja 2 de 2')}
      <div class="sec">6. Análisis comparativo de mercado del inmueble</div>
      <table class="t"><thead><tr><th>Tipo</th><th class="num">M²</th><th class="num">Valor unitario</th><th class="num">Coeficiente</th><th class="num">V. unitario resultante</th><th class="num">Valor parcial</th></tr></thead><tbody>
        ${r.partidas.map((p) => `<tr><td>${esc(p.tipo)}</td><td class="num">${num(p.m2, 'es', 2)}</td><td class="num">${m(p.vu)}</td><td class="num">${num(p.coef, 'es', 2)}</td><td class="num">${m(p.vr)}</td><td class="num">${m(p.parcial)}</td></tr>`).join('')}
        <tr><td colspan="5"><b>Valor comparativo de mercado</b></td><td class="num"><b>${m(r.valorMercado)}</b></td></tr>
      </tbody></table>
      <div class="sec">7. Análisis por capitalización de rentas del inmueble (mensual)</div>
      <table class="t"><thead><tr><th>Colonia</th><th class="num">M² terr.</th><th class="num">M² const.</th><th class="num">Valor total</th><th class="num">Precio renta</th><th class="num">% capitalización</th><th>Teléfono</th></tr></thead><tbody>
        ${r.rentas.filter((x) => x.renta).map((x) => `<tr><td>${v(x.colonia)}</td><td class="num">${num(x.m2t, 'es', 2)}</td><td class="num">${num(x.m2c, 'es', 2)}</td><td class="num">${m(x.valorTotal)}</td><td class="num">${m(x.renta)}</td><td class="num">${x.cap != null ? `${(x.cap * 100).toFixed(3)} %` : '—'}</td><td>${v(x.tel)}</td></tr>`).join('')}
        <tr><td colspan="5"><b>Promedio capitalización de rentas mensual</b></td><td class="num"><b>${r.capMensual ? `${(r.capMensual * 100).toFixed(3)} %` : '—'}</b></td><td></td></tr>
      </tbody></table>
      <div class="sec">8. Conclusión</div>
      <div class="box">
        <table style="width:100%"><tr>
          <td>Opinión sobre el posible valor del bien inmueble<br><span class="big">${m(r.valorRedondeado)}</span></td>
          <td class="num">Renta mensual: <b>${m(r.rentaRedondeada)}</b><br>Capitalización de rentas anual: <b>${r.capAnual ? `${(r.capAnual * 100).toFixed(2)} %` : '—'}</b></td>
        </tr></table>
        <p style="text-align:justify;margin:8px 0 0">En nuestra opinión y de acuerdo al estudio realizado, estimamos que el valor comercial del inmueble es el valor de mercado, que en números redondos es de <b>${m(r.valorRedondeado)} (${esc(importeConLetra(r.valorRedondeado, o.moneda))})</b>.${r.rentaRedondeada ? ` Se concluye de acuerdo a lo anterior, que el inmueble se puede rentar mensualmente en <b>${m(r.rentaRedondeada)} (${esc(importeConLetra(r.rentaRedondeada, o.moneda))})</b>.` : ''}</p>
      </div>
      <div class="photos">
        <div><div class="sec">9. Croquis de ubicación</div>${croquis ? `<img src="${esc(croquis)}" alt="">` : '<p class="muted">Sin croquis</p>'}</div>
        <div><div class="sec">10. Fotografía de fachada</div>${fachada ? `<img src="${esc(fachada)}" alt="">` : '<p class="muted">Sin fotografía</p>'}</div>
      </div>
      ${interiores.length ? `<div class="sec">11. Fotografías de interiores</div><div class="photos" style="grid-template-columns:repeat(3,1fr)">${interiores.map((u) => `<img src="${esc(u)}" alt="">`).join('')}</div>` : ''}
      <p class="legal"><strong>${esc(NOTA_OPINION)}</strong></p>
      ${signatures(ctx, 'Elaboró', 'Autorizó')}${legal(false)}`;
    return `${hoja1}</section><section class="page">${hoja2}`;
  },

  ficha(ctx) {
    const c = ctx.data.captura || {};
    const f = ctx.data.ficha || {};
    const r = calcularOpinion(c, opinionDefaults(ctx.data));
    const valor = f.valor_oferta || r.valorRedondeado;
    return `${header(ctx, 'F I C H A   T É C N I C A', c.fecha)}
      ${f.descripcion ? `<p class="serif" style="font-size:12.5pt;line-height:1.5;text-align:justify">${esc(f.descripcion)}</p>` : ''}
      <div class="sec">Características</div>
      <div class="grid">
        ${field('Tipo de inmueble', c.i_tipo)}${field('Régimen de propiedad', c.i_regimen)}${field('Antigüedad', c.i_antiguedad && `${c.i_antiguedad} años`)}${field('Estado de conservación', c.i_estado_conservacion)}
        ${field('M² de terreno', c.i_m2_terreno && `${c.i_m2_terreno} m²`)}${field('M² de construcción', c.i_m2_construccion && `${c.i_m2_construccion} m²`)}${field('Espacios para autos', c.i_estacionamientos)}${field('Recámaras', c.i_recamaras)}
        ${field('Baños', c.i_banos)}${field('Medios baños', c.i_medios_banos)}${field('Clósets', f.closets)}${field('Cocina integral', f.cocina_integral)}
        ${field('Cisterna', f.cisterna)}${field('Ubicación', c.i_direccion, 's3')}
        ${field('Distribución', c.i_distribucion, 's4')}${field('Instalaciones especiales', c.i_instalaciones, 's4')}${field('Materiales de construcción', c.i_materiales, 's4')}
      </div>
      <div class="sec">Infraestructura de la zona y urbanización</div>${zonaGrid(c)}
      <div class="box" style="display:flex;justify-content:space-between;align-items:end">
        <div>Valor de la oferta<br><span class="big">${valor ? money(valor, f.moneda || 'MXN') : '—'}</span></div>
        <div class="num">Situación legal<br><b>${v(c.i_gravamenes)}</b></div>
      </div>
      ${legal(false)}`;
  },
};

export const PRINT_ORDER = ['captura', 'perfilamiento', 'documentos', 'derechos', 'levantamiento', 'opinion', 'ficha'];

/** Abre una ventana imprimible con uno o varios módulos. */
let LOGO_SVG = '<strong class="serif" style="font-size:20pt;letter-spacing:.16em;color:#1E3B2F">SANMIRA</strong>';

export async function printModules(ctx, modules) {
  const w = window.open('', '_blank');
  if (!w) {
    alert('Permite ventanas emergentes para imprimir.');
    return;
  }
  w.document.write('<p style="font-family:sans-serif;padding:20px">Preparando documento…</p>');
  if (modules.includes('documentos')) ctx.docs = await ctx.loadDocs();
  try {
    // Incrusta el logo para que siempre aparezca en el PDF
    const svg = await (await fetch('/brand/sanmira-logo-horizontal.svg')).text();
    if (svg.trim().startsWith('<svg')) LOGO_SVG = svg;
  } catch { /* usa el texto de respaldo */ }
  const pages = [];
  for (const m of modules) pages.push(`<section class="page">${await PAGES[m](ctx)}</section>`);
  w.document.open();
  w.document.write(`<!doctype html><html lang="es"><head><meta charset="utf-8">
    <title>${esc(ctx.data.captura?.p_nombre || ctx.opp.title)} · Expediente SANMIRA</title>
    <link href="https://fonts.googleapis.com/css2?family=Cardo&family=DM+Sans:wght@400;600&display=swap" rel="stylesheet">
    <style>${CSS}</style></head><body>
    <div class="bar"><button onclick="print()">Imprimir / Guardar PDF</button></div>
    ${pages.join('')}
    </body></html>`);
  w.document.close();
}
