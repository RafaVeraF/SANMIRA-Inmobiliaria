// Datos fijos de la empresa, catálogos (Hoja2 del Excel) y textos legales.
// ✏️ Edita EMPRESA con el domicilio y teléfono reales de SANMIRA.

export const EMPRESA = {
  nombre: 'SANMIRA Inmobiliaria',
  domicilio: 'Centro Comercial EL PINAR, Ciruelos 137, Jurica Pinar, 76100 Santiago de Querétaro, Qro.',
  telefono: '442 344 4424',
  correo: 'rvera@sanmira.mx',
  web: 'www.sanmira.mx',
};

export const datosContacto = () =>
  `${EMPRESA.domicilio}. Tel. ${EMPRESA.telefono} · ${EMPRESA.correo} · ${EMPRESA.web}`;

// ---------- Catálogos (Hoja2) ----------
export const CAT = {
  regimenPropiedad: ['Fraccionamiento', 'Condominio', 'Conjunto habitacional', 'Conjunto comercial'],
  usoSuelo: ['Habitacional', 'Comercial', 'Industrial', 'Mixto'],
  formaAdquisicion: ['Compraventa de contado', 'Compraventa crédito hipotecario', 'Herencia', 'Donación', 'Permuta', 'Prescripción'],
  regimenMatrimonio: ['No aplica', 'Separación de bienes', 'Sociedad conyugal'],
  estadoCivil: ['Soltero', 'Soltera', 'Casado', 'Casada'],
  tipoInmueble: ['Casa habitación', 'Departamento', 'Lote de terreno', 'Local comercial', 'Bodega', 'Edificio', 'Industrial', 'Otro'],
  estadoConservacion: ['Nuevo', 'Bueno', 'Medio', 'Malo'],
  gravamenes: ['Libre de gravamen', 'Garantía hipotecaria', 'Pensión alimenticia', 'Embargo'],
  tipoOperacion: ['Venta', 'Renta'],
  identificacion: ['INE', 'IFE', 'Pasaporte', 'Tarjeta de residente'],
  siNo: ['SI', 'NO'],
  clasificacionZona: ['Habitacional', 'Comercial', 'Industrial', 'Mixta', 'Urbana', 'Suburbana'],
  servicio: ['Existente', 'Inexistente', 'Parcial'],
  numeros: ['0', '1', '2', '3', '4', '5'],
};

// Espacios de la tabla de acabados (Hoja de captura, renglones 43–51)
export const ESPACIOS_ACABADOS = [
  ['recamaras', 'Recámaras'],
  ['estancia', 'Estancia - Sala'],
  ['banos', 'Baños'],
  ['escalera', 'Escalera'],
  ['cocina', 'Cocina'],
  ['comedor', 'Comedor'],
  ['patio', 'Patio de servicio'],
  ['estacionamiento', 'Estacionamiento'],
  ['fachada', 'Fachada'],
];

// Tipo de inmueble del expediente → tipo en el inventario web
export const TIPO_A_INVENTARIO = {
  'Casa habitación': 'casa',
  Departamento: 'departamento',
  'Lote de terreno': 'terreno',
  'Local comercial': 'local',
  Bodega: 'local',
  Edificio: 'oficina',
  Industrial: 'local',
  Otro: 'casa',
};

export const avisoPrivacidad = () =>
  `Con fundamento en los artículos 15 y 16 de la Ley Federal de Protección de Datos Personales en Posesión de los Particulares, hacemos de su conocimiento que ${EMPRESA.nombre}, con domicilio en ${EMPRESA.domicilio}, es responsable de recabar sus datos personales, del uso que se les dé a los mismos y de su protección. Su información personal será utilizada para las siguientes finalidades: proveer los servicios y productos que ha solicitado; notificarle sobre nuevos servicios o productos que tengan relación con los ya contratados o adquiridos; comunicarle sobre cambios en los mismos; elaborar estudios y programas que son necesarios para determinar hábitos generales de consumo; realizar evaluaciones periódicas de nuestros productos y servicios a efecto de mejorar la calidad de los mismos; evaluar la calidad del servicio que brindamos y, en general, para dar cumplimiento a las obligaciones que hemos contraído con usted. Consulte el aviso completo en: ${EMPRESA.web}`;

// ---------- Carta de derechos (NOM-247-SE-2021) ----------
export const DERECHOS_INTRO =
  'Todas las transacciones comerciales de compraventa de inmuebles destinados a casa habitación en las que intervenga “EL ASESOR INMOBILIARIO” se llevarán a cabo conforme a lo dispuesto en la Ley Federal de Protección al Consumidor, su Reglamento y la NOM-247-SE-2021, por lo cual reconoce que “EL CONSUMIDOR” cuenta con los siguientes derechos:';

export const DERECHOS = [
  'Recibir, respecto de los bienes inmuebles ofertados, información y publicidad veraz, clara y actualizada, sin importar el medio por el que se comunique, incluyendo los medios digitales, de forma tal que le permita al consumidor tomar la mejor decisión de compra conociendo de manera veraz las características del inmueble que está adquiriendo, conforme a lo dispuesto por la Ley.',
  'Conocer la información sobre las características del inmueble, entre éstas: la extensión del terreno, superficie construida, tipo de estructura, instalaciones, acabados, accesorios, lugar de estacionamiento, áreas de uso común, servicios con que cuenta y estado general físico del inmueble.',
  'Elegir libremente el inmueble que mejor satisfaga sus necesidades y se ajuste a su capacidad de compra.',
  'No realizar pago alguno hasta que conste por escrito la relación contractual, exceptuando los referentes a anticipos y gastos operativos, en los términos previstos por la LFPC.',
  'Firmar un contrato de adhesión bajo el modelo inscrito en la Procuraduría Federal del Consumidor, en el que consten los términos y condiciones de la compraventa del bien inmueble. Posterior a su firma, el proveedor tiene la obligación de entregar una copia del contrato firmado al consumidor.',
  'Adquirir un inmueble que cuente con las características de seguridad y calidad que estén contenidas en la normatividad aplicable y plasmadas en la información y publicidad que haya recibido.',
  'Recibir el bien inmueble en el plazo y condiciones acordados con el proveedor en el contrato de adhesión respectivo.',
  'En su caso, ejercer las garantías sobre bienes inmuebles previstas en la LFPC, considerando las especificaciones previstas en el contrato de adhesión respectivo.',
  'Recibir la bonificación o compensación correspondiente en términos de la LFPC, en caso de que una vez ejercida la garantía, persistan defectos o fallas en el inmueble. Asimismo, a que se realicen las reparaciones necesarias en caso de defectos o fallas imputables al proveedor, u optar por la substitución del inmueble o rescisión del contrato cuando proceda.',
  'Contar con canales y mecanismos de atención gratuitos y accesibles para consultas, solicitudes, reclamaciones y sugerencias al proveedor, y conocer el domicilio señalado por el proveedor para oír y recibir notificaciones.',
  'Derecho a la protección por parte de las autoridades competentes y conforme a las leyes aplicables, incluyendo el derecho a presentar denuncias y reclamaciones ante las mismas.',
  'Tener a su disposición un Aviso de Privacidad para conocer el tratamiento que se dará a los datos personales que proporcione y consentirlo, en su caso; que sus datos personales sean tratados conforme a la normatividad aplicable y, conocer los mecanismos disponibles para realizar el ejercicio de sus Derechos de Acceso, Rectificación, Cancelación y Oposición.',
  'Recibir un trato libre de discriminación, sin que se le pueda negar o condicionar la atención o venta de una vivienda por razones de género, nacionalidad, étnicas, preferencia sexual, religiosas o cualquiera otra particularidad en los términos de la legislación aplicable.',
  'Elegir libremente al notario público para realizar el trámite de escrituración.',
];

export const NOTA_OPINION =
  'NOTA: LA PRESENTE OPINIÓN DE VALOR TIENE COMO PROPÓSITO EXCLUSIVAMENTE EL DE DETERMINAR EL POSIBLE VALOR DEL BIEN INMUEBLE, POR LO CUAL NO TENDRÁ VALIDEZ PARA FINES DISTINTOS DE LO ESPECIFICADO EN EL PROPÓSITO.';

export const SECCIONES_DOCS = {
  vendedor: '1. Documentos del prospecto vendedor / arrendador',
  conyuge: 'En caso de sociedad conyugal o copropiedad',
  inmueble: '2. Documentos del inmueble',
  nom247: '3. Derechos del consumidor conforme a la NOM-247-SE-2021',
  comprador: 'Documentos del cliente',
  general: 'Otros documentos',
};
