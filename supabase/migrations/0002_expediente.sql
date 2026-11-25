-- =====================================================================
-- SANMIRA · Expediente del inmueble (módulos del Excel del asesor)
-- Ejecutar DESPUÉS de 0001_schema.sql y seed.sql.
-- =====================================================================

-- Nuevo estado para documentos que no aplican (p. ej. acta de matrimonio de una persona soltera)
alter type public.doc_status add value if not exists 'no_aplica';

-- Sección y condición de cada plantilla de documento
alter table public.document_templates
  add column if not exists section text not null default 'general',
  add column if not exists condition text;   -- casado | sociedad_conyugal | condominio | null (siempre)

-- ---------- Expediente: un registro por oportunidad ----------
create table if not exists public.expedientes (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null unique references public.opportunities (id) on delete cascade,
  property_id     uuid references public.properties (id) on delete set null,
  -- { captura:{}, perfilamiento:{}, documentos:{}, derechos:{}, opinion:{}, ficha:{} }
  data            jsonb not null default '{}'::jsonb,
  updated_by      uuid references public.profiles (id) on delete set null,
  created_at      timestamptz not null default now(),
  updated_at      timestamptz not null default now()
);

create trigger expedientes_touch before update on public.expedientes
  for each row execute function public.touch_updated_at();

alter table public.expedientes enable row level security;
create policy "expedientes staff" on public.expedientes
  for all using (public.is_staff()) with check (public.is_staff());

-- Una opinión de valor por expediente (se actualiza al guardar el módulo)
alter table public.valuations
  add column if not exists rent_suggested numeric(14, 2),
  add column if not exists cap_rate_monthly numeric(8, 6);
create unique index if not exists valuations_opportunity_uidx
  on public.valuations (opportunity_id) where opportunity_id is not null;

-- ---------- Checklist del Excel para vendedor / arrendador ----------
-- (las oportunidades ya creadas conservan su checklist actual)
delete from public.document_templates where applies_to in ('venta', 'renta_propietario');

insert into public.document_templates
  (applies_to, section, condition, sort_order, name_es, name_en, name_de)
select t.applies_to::public.opportunity_type, d.section, d.condition, d.ord, d.es, d.en, d.de
from (values ('venta'), ('renta_propietario')) as t(applies_to)
cross join (values
  -- 1. Prospecto vendedor / arrendador
  ('vendedor', null, 1, 'Identificación oficial vigente', 'Valid official ID', 'Gültiger amtlicher Ausweis'),
  ('vendedor', null, 2, 'Acta de nacimiento', 'Birth certificate', 'Geburtsurkunde'),
  ('vendedor', null, 3, 'Constancia de situación fiscal vigente', 'Current tax status certificate (CSF)', 'Aktuelle Steuerbescheinigung (CSF)'),
  ('vendedor', null, 4, 'CURP vigente', 'CURP (population registry key)', 'CURP (Bevölkerungsregisternummer)'),
  ('vendedor', null, 5, 'Comprobante de domicilio', 'Proof of address', 'Adressnachweis'),
  ('vendedor', null, 6, 'Estado de cuenta bancario vigente', 'Current bank statement', 'Aktueller Kontoauszug'),
  ('vendedor', 'casado', 7, 'Acta de matrimonio', 'Marriage certificate', 'Heiratsurkunde'),
  -- Cónyuge (sociedad conyugal o copropiedad)
  ('conyuge', 'sociedad_conyugal', 10, 'Acta de nacimiento del cónyuge', 'Spouse''s birth certificate', 'Geburtsurkunde des Ehepartners'),
  ('conyuge', 'sociedad_conyugal', 11, 'Identificación oficial del cónyuge', 'Spouse''s official ID', 'Amtlicher Ausweis des Ehepartners'),
  ('conyuge', 'sociedad_conyugal', 12, 'Cédula de identificación fiscal del cónyuge', 'Spouse''s tax ID certificate', 'Steuerausweis des Ehepartners'),
  ('conyuge', 'sociedad_conyugal', 13, 'CURP del cónyuge', 'Spouse''s CURP', 'CURP des Ehepartners'),
  -- 2. Inmueble
  ('inmueble', null, 20, 'Escritura o título de propiedad inscrito en el Registro Público de la Propiedad', 'Title deed registered with the Public Property Registry', 'Im Grundbuch eingetragene Eigentumsurkunde'),
  ('inmueble', null, 21, 'Comprobante del pago del impuesto predial', 'Property tax payment receipt', 'Nachweis der Grundsteuerzahlung'),
  ('inmueble', null, 22, 'Comprobante del pago de servicio de agua', 'Water service payment receipt', 'Nachweis der Wasserrechnung'),
  ('inmueble', null, 23, 'Comprobantes del pago de luz (6 meses)', 'Electricity bills (6 months)', 'Stromrechnungen (6 Monate)'),
  ('inmueble', null, 24, 'Comprobantes del pago de telefonía fija (6 meses)', 'Landline phone bills (6 months)', 'Festnetzrechnungen (6 Monate)'),
  ('inmueble', 'condominio', 25, 'Últimos pagos de cuotas de mantenimiento', 'Latest HOA/maintenance fee receipts', 'Letzte Hausgeldzahlungen')
) as d(section, condition, ord, es, en, de);

-- 3. Derechos del consumidor NOM-247-SE-2021 (solo compraventa)
insert into public.document_templates (applies_to, section, condition, sort_order, name_es, name_en, name_de) values
  ('venta', 'nom247', null, 30, 'Carta de derechos del consumidor (NOM-247-SE-2021)', 'Consumer rights letter (NOM-247-SE-2021)', 'Verbraucherrechtsschreiben (NOM-247-SE-2021)'),
  ('venta', 'nom247', null, 31, 'Acuse de la carta de derechos del consumidor', 'Signed acknowledgment of the consumer rights letter', 'Unterschriebene Empfangsbestätigung des Verbraucherrechtsschreibens');

-- Secciones de las plantillas de comprador / inquilino ya existentes
update public.document_templates set section = 'comprador' where applies_to in ('compra', 'renta_inquilino') and section = 'general';
