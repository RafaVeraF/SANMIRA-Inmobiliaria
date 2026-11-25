// Fórmulas del Excel "SANMIRA_Inmobiliaria.xlsx", replicadas en JavaScript.

const n = (v) => {
  const x = Number(v);
  return Number.isFinite(x) ? x : 0;
};
const avg = (arr) => (arr.length ? arr.reduce((a, b) => a + b, 0) / arr.length : 0);

// ---------------------------------------------------------------------
// Perfilamiento (hoja "Perfilamiento")
// ---------------------------------------------------------------------
export function perfilamientoDerivado(captura = {}, perfil = {}) {
  const anio = n(perfil.anio_escritura);
  const exento = (perfil.exento_isr || '').toUpperCase();
  return {
    // J25 =IF(F25 >= 2014, "SI", "NO APLICA")
    cfdi: anio ? (anio >= 2014 ? 'SI' : 'NO APLICA') : '—',
    // G27 =IF(E21 = "Condominio", "SI", "NO")
    condominio: captura.i_regimen === 'Condominio' ? 'SI' : 'NO',
    // G30 =IF(I26 = "No", "Exenta", IF(I26 = "SI", "Paga", ""))
    isr: exento === 'NO' ? 'Exenta' : exento === 'SI' ? 'Paga' : '—',
    // G31 =IF(H22 = "Libre de gravamen", "No aplica", "Paga")
    hipoteca: !captura.i_gravamenes ? '—' : captura.i_gravamenes === 'Libre de gravamen' ? 'No aplica' : 'Paga',
  };
}

// ---------------------------------------------------------------------
// Documentos (hoja "Documentos"): ¿aplica este documento?
// ---------------------------------------------------------------------
export function documentoAplica(condition, captura = {}) {
  if (!condition) return true;
  const civil = (captura.p_estado_civil || '').toLowerCase();
  if (condition === 'casado') return civil.startsWith('casad');                       // G23
  if (condition === 'sociedad_conyugal') return captura.p_regimen_matrimonio === 'Sociedad conyugal'; // G25:G28
  if (condition === 'condominio') return captura.i_regimen === 'Condominio';           // G37
  return true;
}

// ---------------------------------------------------------------------
// Opinión de valor (hojas 1 y 2)
// ---------------------------------------------------------------------
export function calcularOpinion(captura = {}, op = {}) {
  // Hoja 1 · 4. Comparativo de terreno: precio / superficie
  const terreno = (op.terreno || []).map((r) => ({
    ...r,
    ppm2: n(r.superficie) > 0 && n(r.precio) > 0 ? n(r.precio) / n(r.superficie) : null,
  }));
  const vTerreno = avg(terreno.filter((r) => r.ppm2 != null).map((r) => r.ppm2)); // F38

  // Hoja 1 · 5. Comparativo de construcción: (precio − m² terreno × valor m² terreno) / m² construcción
  const construccion = (op.construccion || []).map((r) => ({
    ...r,
    ppm2: n(r.m2c) > 0 && n(r.precio) > 0 ? (n(r.precio) - n(r.m2t) * vTerreno) / n(r.m2c) : null,
  }));
  const vConst = avg(construccion.filter((r) => r.ppm2 != null).map((r) => r.ppm2)); // F45

  // Superficies (Hoja 1 · renglones 22–28)
  const m2Terreno = n(captura.i_m2_terreno);
  const m2Hab = n(captura.i_m2_construccion);
  const m2Com = n(op.m2_comercial);
  const m2Vol = n(op.m2_volados);
  const m2Cob = n(op.m2_cobertizos);
  const m2ConstTotal = m2Hab + m2Com + m2Vol + m2Cob; // F28

  // Hoja 2 · 6. Comparativo de mercado del inmueble
  const coef = (k) => (op[k] === '' || op[k] == null ? 1 : n(op[k]));
  const partida = (tipo, m2, vu, k) => {
    const c = coef(k);
    const vr = vu * c;
    return { tipo, m2, vu, coef: c, vr, parcial: m2 * vr };
  };
  const partidas = [
    partida('Terreno', m2Terreno, vTerreno, 'coef_terreno'),
    partida('Habitacional', m2Hab, vConst, 'coef_habitacional'),
    partida('Comercial', m2Com, vConst, 'coef_comercial'),
    partida('Volados y pasillos', m2Vol, vConst, 'coef_volados'),
    partida('Cobertizos con lámina', m2Cob, vConst, 'coef_cobertizos'),
  ];
  const valorMercado = partidas.reduce((a, p) => a + p.parcial, 0); // I15

  // Hoja 2 · 7. Capitalización de rentas (mensual)
  const rentas = (op.rentas || []).map((r) => {
    const valorTotal = vTerreno * n(r.m2t) + vConst * n(r.m2c); // E18
    return { ...r, valorTotal, cap: valorTotal > 0 && n(r.renta) > 0 ? n(r.renta) / valorTotal : null }; // H18
  });
  const capMensual = avg(rentas.filter((r) => r.cap != null).map((r) => r.cap)); // H21

  // 8. Conclusión
  const redondeo = n(op.redondeo) || 5000;
  const valorRedondeado = valorMercado > 0 ? Math.round(valorMercado / redondeo) * redondeo : 0; // H23 "en números redondos"
  const rentaMensual = valorRedondeado * capMensual; // H24
  const rentaRedondeada = rentaMensual > 0 ? Math.round(rentaMensual / 50) * 50 : 0;
  const capAnual = capMensual * 12; // H25

  return {
    terreno, construccion, vTerreno, vConst,
    m2Terreno, m2Hab, m2Com, m2Vol, m2Cob, m2ConstTotal,
    partidas, valorMercado, rentas, capMensual,
    valorRedondeado, rentaMensual, rentaRedondeada, capAnual,
  };
}

// ---------------------------------------------------------------------
// Número a letras (para la conclusión: "Dos Millones Ciento Noventa y Cinco Mil Pesos 00/100 M.N.")
// ---------------------------------------------------------------------
const UNIDADES = ['', 'uno', 'dos', 'tres', 'cuatro', 'cinco', 'seis', 'siete', 'ocho', 'nueve', 'diez',
  'once', 'doce', 'trece', 'catorce', 'quince', 'dieciséis', 'diecisiete', 'dieciocho', 'diecinueve', 'veinte',
  'veintiuno', 'veintidós', 'veintitrés', 'veinticuatro', 'veinticinco', 'veintiséis', 'veintisiete', 'veintiocho', 'veintinueve'];
const DECENAS = ['', '', '', 'treinta', 'cuarenta', 'cincuenta', 'sesenta', 'setenta', 'ochenta', 'noventa'];
const CENTENAS = ['', 'ciento', 'doscientos', 'trescientos', 'cuatrocientos', 'quinientos', 'seiscientos', 'setecientos', 'ochocientos', 'novecientos'];

function hasta999(x) {
  if (x === 0) return '';
  if (x === 100) return 'cien';
  const c = Math.floor(x / 100);
  const r = x % 100;
  let out = CENTENAS[c];
  if (r) {
    let dec;
    if (r < 30) dec = UNIDADES[r];
    else {
      const d = Math.floor(r / 10);
      const u = r % 10;
      dec = DECENAS[d] + (u ? ` y ${UNIDADES[u]}` : '');
    }
    out = out ? `${out} ${dec}` : dec;
  }
  return out;
}

/** Versión apocopada para antes de "mil"/"millones": "uno" → "un", "veintiuno" → "veintiún" */
const apocope = (s) => s.replace(/veintiuno$/, 'veintiún').replace(/uno$/, 'un');

export function numeroALetras(valor) {
  const entero = Math.floor(Math.abs(valor));
  if (entero === 0) return 'cero';
  const millones = Math.floor(entero / 1e6);
  const miles = Math.floor((entero % 1e6) / 1000);
  const resto = entero % 1000;
  const partes = [];
  if (millones) partes.push(millones === 1 ? 'un millón' : `${apocope(numeroALetras(millones))} millones`);
  if (miles) partes.push(miles === 1 ? 'mil' : `${apocope(hasta999(miles))} mil`);
  if (resto) partes.push(hasta999(resto));
  return partes.join(' ');
}

const capitalizar = (s) => s.split(' ').map((w) => (['y', 'de'].includes(w) ? w : w.charAt(0).toUpperCase() + w.slice(1))).join(' ');

const MONEDAS = {
  MXN: ['Pesos', 'M.N.'],
  USD: ['Dólares', 'USD'],
  EUR: ['Euros', 'EUR'],
};

/** 2195000 → "Dos Millones Ciento Noventa y Cinco Mil Pesos 00/100 M.N." */
export function importeConLetra(valor, moneda = 'MXN') {
  const [nombre, sufijo] = MONEDAS[moneda] || MONEDAS.MXN;
  const centavos = String(Math.round((Math.abs(valor) % 1) * 100)).padStart(2, '0');
  // "un millón pesos" → "un millón de pesos" cuando es múltiplo exacto de millón
  const letras = apocope(numeroALetras(valor)); // "mil un pesos", "veintiún pesos"
  const de = Math.floor(valor) % 1e6 === 0 && Math.floor(valor) >= 1e6 ? ' de' : '';
  return `${capitalizar(letras)}${de} ${nombre} ${centavos}/100 ${sufijo}`;
}
