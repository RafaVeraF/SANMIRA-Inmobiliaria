-- =====================================================================
-- SANMIRA · Datos iniciales
-- 1) Checklist de documentos por tipo de operación (ajústalo con tu notario).
-- 2) Tres propiedades de ejemplo para ver la landing funcionando (bórralas después).
-- =====================================================================

insert into public.document_templates (applies_to, sort_order, name_es, name_en, name_de, help_es, help_en, help_de) values
-- Comprador
('compra', 1, 'Identificación oficial (pasaporte)', 'Official ID (passport)', 'Amtlicher Ausweis (Reisepass)', 'Pasaporte vigente, ambas páginas de datos.', 'Valid passport, data pages.', 'Gültiger Reisepass, Datenseiten.'),
('compra', 2, 'Forma migratoria (FMM, residente temporal o permanente)', 'Immigration document (FMM, temporary or permanent resident)', 'Einwanderungsdokument (FMM, befristete oder unbefristete Aufenthaltserlaubnis)', null, null, null),
('compra', 3, 'RFC o número de identificación fiscal de tu país', 'Mexican RFC or your country''s tax ID', 'Mexikanische RFC oder Steuer-ID Ihres Landes', null, null, null),
('compra', 4, 'Comprobante de domicilio (no mayor a 3 meses)', 'Proof of address (less than 3 months old)', 'Adressnachweis (nicht älter als 3 Monate)', null, null, null),
('compra', 5, 'Acta de matrimonio (si aplica)', 'Marriage certificate (if applicable)', 'Heiratsurkunde (falls zutreffend)', null, null, null),
('compra', 6, 'Comprobante de origen de los recursos', 'Proof of source of funds', 'Nachweis der Mittelherkunft', 'Requerido por la ley antilavado (LFPIORPI).', 'Required by Mexican anti-money-laundering law.', 'Vorgeschrieben durch das mexikanische Geldwäschegesetz.'),
('compra', 7, 'Permiso o convenio para extranjeros / fideicomiso (si aplica)', 'Foreign buyer permit / bank trust (fideicomiso), if applicable', 'Genehmigung für Ausländer / Bankentreuhand (Fideicomiso), falls zutreffend', null, null, null),
-- Vendedor
('venta', 1, 'Escritura de la propiedad', 'Property deed', 'Eigentumsurkunde', null, null, null),
('venta', 2, 'Identificación oficial del propietario', 'Owner''s official ID', 'Amtlicher Ausweis des Eigentümers', null, null, null),
('venta', 3, 'Predial al corriente', 'Property tax receipt (paid up)', 'Grundsteuerquittung (bezahlt)', null, null, null),
('venta', 4, 'Recibo de agua al corriente', 'Water bill (paid up)', 'Wasserrechnung (bezahlt)', null, null, null),
('venta', 5, 'Certificado de libertad de gravamen', 'Certificate of no liens', 'Lastenfreiheitsbescheinigung', null, null, null),
('venta', 6, 'Constancia de no adeudo de mantenimiento (si es condominio)', 'HOA no-debt letter (if condominium)', 'Bestätigung keine Hausgeldschulden (bei Eigentumswohnung)', null, null, null),
('venta', 7, 'Acta de matrimonio y régimen (si aplica)', 'Marriage certificate and property regime (if applicable)', 'Heiratsurkunde und Güterstand (falls zutreffend)', null, null, null),
('venta', 8, 'RFC y CURP', 'RFC and CURP', 'RFC und CURP', null, null, null),
-- Inquilino
('renta_inquilino', 1, 'Identificación oficial (pasaporte)', 'Official ID (passport)', 'Amtlicher Ausweis (Reisepass)', null, null, null),
('renta_inquilino', 2, 'Forma migratoria', 'Immigration document', 'Einwanderungsdokument', null, null, null),
('renta_inquilino', 3, 'Comprobantes de ingresos (3 meses)', 'Proof of income (3 months)', 'Einkommensnachweise (3 Monate)', null, null, null),
('renta_inquilino', 4, 'Carta laboral o referencias', 'Employment letter or references', 'Arbeitgeberbescheinigung oder Referenzen', null, null, null),
('renta_inquilino', 5, 'Datos del aval u obligado solidario (si aplica)', 'Guarantor details (if applicable)', 'Angaben zum Bürgen (falls zutreffend)', null, null, null),
-- Arrendador
('renta_propietario', 1, 'Escritura de la propiedad', 'Property deed', 'Eigentumsurkunde', null, null, null),
('renta_propietario', 2, 'Identificación oficial del propietario', 'Owner''s official ID', 'Amtlicher Ausweis des Eigentümers', null, null, null),
('renta_propietario', 3, 'Predial al corriente', 'Property tax receipt (paid up)', 'Grundsteuerquittung (bezahlt)', null, null, null),
('renta_propietario', 4, 'Estado de cuenta para depósitos', 'Bank statement for rent deposits', 'Kontoauszug für Mieteinzahlungen', null, null, null),
('renta_propietario', 5, 'Inventario de la propiedad', 'Property inventory', 'Inventarliste', null, null, null);

-- Propiedades de ejemplo (datos ficticios)
insert into public.properties
  (slug, title_es, title_en, title_de, description_es, description_en, description_de, operation, property_type, status, price, currency, zone, bedrooms, bathrooms, parking, construction_m2, land_m2, amenities, featured, published)
values
('casa-jardin-juriquilla', 'Casa con jardín en Juriquilla', 'House with garden in Juriquilla', 'Haus mit Garten in Juriquilla',
 'Casa de dos niveles con doble altura, jardín privado y vista a la presa. A 15 minutos de la zona industrial y de las mejores escuelas bilingües.',
 'Two-storey house with double-height living room, private garden and lake views. 15 minutes from the industrial parks and top bilingual schools.',
 'Zweistöckiges Haus mit doppelter Raumhöhe, Privatgarten und Seeblick. 15 Minuten von den Industrieparks und den besten bilingualen Schulen.',
 'venta', 'casa', 'disponible', 8450000, 'MXN', 'Juriquilla', 4, 3.5, 2, 320, 280, '{jardín,seguridad 24/7,casa club,roof garden}', true, true),
('depto-centro-historico', 'Departamento en el Centro Histórico', 'Apartment in the Historic Center', 'Wohnung in der Altstadt',
 'Departamento restaurado en casona del siglo XVIII, a dos calles del Jardín Zenea. Ideal para renta vacacional.',
 'Restored apartment in an 18th-century mansion, two blocks from Jardín Zenea. Ideal for short-term rental.',
 'Restaurierte Wohnung in einem Herrenhaus aus dem 18. Jahrhundert, zwei Straßen vom Jardín Zenea. Ideal für Ferienvermietung.',
 'venta', 'departamento', 'disponible', 4200000, 'MXN', 'Centro Histórico', 2, 2, 1, 110, null, '{patio central,terraza,amueblado}', true, true),
('casa-renta-el-refugio', 'Casa en renta en El Refugio', 'House for rent in El Refugio', 'Haus zur Miete in El Refugio',
 'Casa nueva en fraccionamiento con amenidades, cerca de colegios alemanes y americanos.',
 'Brand-new house in a gated community with amenities, close to German and American schools.',
 'Neues Haus in bewachter Wohnanlage mit Annehmlichkeiten, nahe deutscher und amerikanischer Schulen.',
 'renta', 'casa', 'disponible', 32000, 'MXN', 'El Refugio', 3, 2.5, 2, 210, 160, '{alberca,gimnasio,seguridad 24/7}', true, true);
