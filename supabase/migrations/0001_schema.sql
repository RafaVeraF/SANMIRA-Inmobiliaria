-- =====================================================================
-- SANMIRA · Esquema inicial
-- Ejecutar en Supabase → SQL Editor (o con `supabase db push`).
-- =====================================================================

-- ---------- Tipos ----------
create type public.user_role as enum
  ('admin', 'asesor', 'comprador', 'arrendatario', 'vendedor', 'arrendador');

create type public.operation_type as enum ('venta', 'renta');

create type public.property_status as enum
  ('borrador', 'disponible', 'apartada', 'vendida', 'rentada');

create type public.opportunity_type as enum
  ('compra', 'venta', 'renta_inquilino', 'renta_propietario');

create type public.opportunity_stage as enum
  ('prospecto', 'perfilamiento', 'visitas', 'oferta', 'documentacion', 'cierre', 'ganada', 'perdida');

create type public.link_status as enum
  ('propuesta', 'visitada', 'favorita', 'descartada', 'ofertada');

create type public.doc_status as enum
  ('pendiente', 'enviado', 'en_revision', 'aprobado', 'rechazado');

-- ---------- Perfiles ----------
create table public.profiles (
  id          uuid primary key references auth.users (id) on delete cascade,
  full_name   text,
  email       text,
  phone       text,
  role        public.user_role not null default 'comprador',
  language    text not null default 'es' check (language in ('es', 'en', 'de')),
  country     text,
  created_at  timestamptz not null default now()
);

-- ¿El usuario actual es parte del equipo (admin/asesor)?
create or replace function public.is_staff()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (
    select 1 from public.profiles
    where id = auth.uid() and role in ('admin', 'asesor')
  );
$$;

create or replace function public.is_admin()
returns boolean
language sql stable security definer set search_path = public
as $$
  select exists (select 1 from public.profiles where id = auth.uid() and role = 'admin');
$$;

-- Crea el perfil al registrarse. Solo se permiten roles de cliente desde el registro;
-- los roles admin/asesor se asignan después desde el CRM (o SQL).
create or replace function public.handle_new_user()
returns trigger
language plpgsql security definer set search_path = public
as $$
declare
  requested text := coalesce(new.raw_user_meta_data ->> 'role', 'comprador');
begin
  if requested not in ('comprador', 'arrendatario', 'vendedor', 'arrendador') then
    requested := 'comprador';
  end if;
  insert into public.profiles (id, full_name, email, phone, role, language)
  values (
    new.id,
    new.raw_user_meta_data ->> 'full_name',
    new.email,
    new.raw_user_meta_data ->> 'phone',
    requested::public.user_role,
    coalesce(nullif(new.raw_user_meta_data ->> 'language', ''), 'es')
  );
  return new;
end;
$$;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- Un usuario no puede cambiar su propio rol; solo un admin.
create or replace function public.protect_role()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  -- auth.uid() es null en el SQL Editor (permite crear el primer admin)
  if new.role is distinct from old.role and auth.uid() is not null and not public.is_admin() then
    raise exception 'Solo un administrador puede cambiar roles';
  end if;
  return new;
end;
$$;

create trigger profiles_protect_role
  before update on public.profiles
  for each row execute function public.protect_role();

-- ---------- Propiedades ----------
create table public.properties (
  id               uuid primary key default gen_random_uuid(),
  slug             text unique not null,
  title_es         text not null,
  title_en         text,
  title_de         text,
  description_es   text,
  description_en   text,
  description_de   text,
  operation        public.operation_type not null default 'venta',
  property_type    text not null default 'casa',   -- casa, departamento, terreno, local, oficina
  status           public.property_status not null default 'borrador',
  price            numeric(14, 2),
  currency         text not null default 'MXN' check (currency in ('MXN', 'USD', 'EUR')),
  city             text not null default 'Querétaro',
  zone             text,
  address          text,
  bedrooms         int,
  bathrooms        numeric(3, 1),
  parking          int,
  construction_m2  numeric(10, 2),
  land_m2          numeric(10, 2),
  amenities        text[] not null default '{}',
  cover_url        text,
  images           text[] not null default '{}',
  featured         boolean not null default false,
  published        boolean not null default false,
  owner_id         uuid references public.profiles (id) on delete set null,  -- vendedor/arrendador
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now(),
  updated_at       timestamptz not null default now()
);
create index properties_public_idx on public.properties (published, status, operation);

-- ---------- Oportunidades ----------
create table public.opportunities (
  id          uuid primary key default gen_random_uuid(),
  title       text not null,
  type        public.opportunity_type not null,
  stage       public.opportunity_stage not null default 'prospecto',
  client_id   uuid references public.profiles (id) on delete set null,
  advisor_id  uuid references public.profiles (id) on delete set null,
  budget_min  numeric(14, 2),
  budget_max  numeric(14, 2),
  currency    text not null default 'MXN',
  source      text,          -- web, referido, redes, etc.
  notes       text,
  profiling   jsonb not null default '{}'::jsonb,   -- perfilamiento del cliente
  expected_close date,
  created_at  timestamptz not null default now(),
  updated_at  timestamptz not null default now()
);
create index opportunities_client_idx on public.opportunities (client_id);
create index opportunities_stage_idx on public.opportunities (stage);

create table public.opportunity_properties (
  opportunity_id uuid not null references public.opportunities (id) on delete cascade,
  property_id    uuid not null references public.properties (id) on delete cascade,
  status         public.link_status not null default 'propuesta',
  notes          text,
  created_at     timestamptz not null default now(),
  primary key (opportunity_id, property_id)
);

-- ---------- Opiniones de valor ----------
create table public.valuations (
  id               uuid primary key default gen_random_uuid(),
  property_id      uuid references public.properties (id) on delete set null,
  opportunity_id   uuid references public.opportunities (id) on delete set null,
  address          text not null,
  property_type    text,
  construction_m2  numeric(10, 2),
  land_m2          numeric(10, 2),
  comparables      jsonb not null default '[]'::jsonb,  -- [{ref, price, m2}]
  adjustment_pct   numeric(5, 2) not null default 0,
  value_min        numeric(14, 2),
  value_suggested  numeric(14, 2),
  value_max        numeric(14, 2),
  currency         text not null default 'MXN',
  notes            text,
  created_by       uuid references public.profiles (id) on delete set null,
  created_at       timestamptz not null default now()
);

-- ---------- Documentos ----------
create table public.document_templates (
  id          uuid primary key default gen_random_uuid(),
  applies_to  public.opportunity_type not null,
  name_es     text not null,
  name_en     text,
  name_de     text,
  help_es     text,
  help_en     text,
  help_de     text,
  required    boolean not null default true,
  sort_order  int not null default 0
);

create table public.opportunity_documents (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  template_id     uuid references public.document_templates (id) on delete set null,
  name            text not null,
  status          public.doc_status not null default 'pendiente',
  file_path       text,
  reviewer_note   text,
  uploaded_at     timestamptz,
  reviewed_at     timestamptz,
  created_at      timestamptz not null default now()
);
create index opportunity_documents_opp_idx on public.opportunity_documents (opportunity_id);

-- ---------- Pasos del cierre ----------
create table public.opportunity_steps (
  id              uuid primary key default gen_random_uuid(),
  opportunity_id  uuid not null references public.opportunities (id) on delete cascade,
  title_es        text not null,
  title_en        text,
  title_de        text,
  sort_order      int not null default 0,
  done            boolean not null default false,
  done_at         timestamptz,
  due_date        date
);
create index opportunity_steps_opp_idx on public.opportunity_steps (opportunity_id);

-- ---------- Leads de la landing ----------
create table public.leads (
  id           uuid primary key default gen_random_uuid(),
  name         text not null check (char_length(name) between 2 and 120),
  email        text not null check (char_length(email) <= 200),
  phone        text check (char_length(phone) <= 40),
  language     text default 'es',
  interest     text,         -- comprar, vender, rentar, poner en renta
  message      text check (char_length(message) <= 3000),
  property_id  uuid references public.properties (id) on delete set null,
  handled      boolean not null default false,
  created_at   timestamptz not null default now()
);

-- ---------- updated_at ----------
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at := now(); return new; end; $$;

create trigger properties_touch before update on public.properties
  for each row execute function public.touch_updated_at();
create trigger opportunities_touch before update on public.opportunities
  for each row execute function public.touch_updated_at();

-- ---------- Al crear una oportunidad: checklist + pasos ----------
create or replace function public.seed_opportunity()
returns trigger
language plpgsql security definer set search_path = public
as $$
begin
  insert into public.opportunity_documents (opportunity_id, template_id, name)
  select new.id, t.id, t.name_es
  from public.document_templates t
  where t.applies_to = new.type
  order by t.sort_order;

  insert into public.opportunity_steps (opportunity_id, title_es, title_en, title_de, sort_order)
  select new.id, s.es, s.en, s.de, s.ord
  from (values
    ('compra', 1, 'Perfil e intereses', 'Profile & goals', 'Profil & Ziele'),
    ('compra', 2, 'Visitas a propiedades', 'Property viewings', 'Besichtigungen'),
    ('compra', 3, 'Oferta y negociación', 'Offer & negotiation', 'Angebot & Verhandlung'),
    ('compra', 4, 'Entrega de documentos', 'Document submission', 'Unterlagen einreichen'),
    ('compra', 5, 'Contrato de promesa / apartado', 'Purchase promise agreement', 'Kaufvorvertrag'),
    ('compra', 6, 'Firma ante notario', 'Signing before the notary', 'Notartermin'),
    ('compra', 7, 'Entrega de la propiedad', 'Property handover', 'Übergabe der Immobilie'),
    ('venta', 1, 'Opinión de valor', 'Valuation', 'Wertgutachten'),
    ('venta', 2, 'Documentación de la propiedad', 'Property documents', 'Objektunterlagen'),
    ('venta', 3, 'Fotografía y publicación', 'Photos & listing', 'Fotos & Inserat'),
    ('venta', 4, 'Visitas y ofertas', 'Viewings & offers', 'Besichtigungen & Angebote'),
    ('venta', 5, 'Contrato de promesa', 'Purchase promise agreement', 'Kaufvorvertrag'),
    ('venta', 6, 'Firma ante notario', 'Signing before the notary', 'Notartermin'),
    ('renta_inquilino', 1, 'Perfil e intereses', 'Profile & goals', 'Profil & Ziele'),
    ('renta_inquilino', 2, 'Visitas', 'Viewings', 'Besichtigungen'),
    ('renta_inquilino', 3, 'Entrega de documentos', 'Document submission', 'Unterlagen einreichen'),
    ('renta_inquilino', 4, 'Investigación y póliza jurídica', 'Screening & legal policy', 'Prüfung & Mietrechtsschutz'),
    ('renta_inquilino', 5, 'Firma de contrato', 'Lease signing', 'Mietvertrag unterschreiben'),
    ('renta_inquilino', 6, 'Entrega de llaves', 'Key handover', 'Schlüsselübergabe'),
    ('renta_propietario', 1, 'Opinión de renta', 'Rental valuation', 'Mietpreiseinschätzung'),
    ('renta_propietario', 2, 'Documentación de la propiedad', 'Property documents', 'Objektunterlagen'),
    ('renta_propietario', 3, 'Publicación', 'Listing', 'Inserat'),
    ('renta_propietario', 4, 'Selección de inquilino', 'Tenant selection', 'Mieterauswahl'),
    ('renta_propietario', 5, 'Firma de contrato', 'Lease signing', 'Mietvertrag unterschreiben')
  ) as s(kind, ord, es, en, de)
  where s.kind = new.type::text;

  return new;
end;
$$;

create trigger opportunities_seed
  after insert on public.opportunities
  for each row execute function public.seed_opportunity();

-- =====================================================================
-- Row Level Security
-- =====================================================================
alter table public.profiles               enable row level security;
alter table public.properties             enable row level security;
alter table public.opportunities          enable row level security;
alter table public.opportunity_properties enable row level security;
alter table public.valuations             enable row level security;
alter table public.document_templates     enable row level security;
alter table public.opportunity_documents  enable row level security;
alter table public.opportunity_steps      enable row level security;
alter table public.leads                  enable row level security;

-- Perfiles
create policy "perfil propio: leer" on public.profiles
  for select using (
    id = auth.uid() or public.is_staff()
    -- el cliente puede ver el nombre y contacto de su asesor
    or exists (select 1 from public.opportunities o
               where o.client_id = auth.uid() and o.advisor_id = profiles.id)
  );
create policy "perfil propio: editar" on public.profiles
  for update using (id = auth.uid() or public.is_staff())
  with check (id = auth.uid() or public.is_staff());

-- Propiedades: el público ve las publicadas; el dueño ve las suyas; staff todo.
create policy "propiedades publicadas" on public.properties
  for select using (published or owner_id = auth.uid() or public.is_staff());
create policy "propiedades staff" on public.properties
  for all using (public.is_staff()) with check (public.is_staff());

-- Oportunidades: el cliente ve las suyas; staff todo.
create policy "oportunidades cliente" on public.opportunities
  for select using (client_id = auth.uid() or public.is_staff());
create policy "oportunidades staff" on public.opportunities
  for all using (public.is_staff()) with check (public.is_staff());

create policy "vinculos cliente" on public.opportunity_properties
  for select using (
    public.is_staff() or exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.client_id = auth.uid()
    )
  );
create policy "vinculos staff" on public.opportunity_properties
  for all using (public.is_staff()) with check (public.is_staff());

-- Opiniones de valor: solo staff.
create policy "valuaciones staff" on public.valuations
  for all using (public.is_staff()) with check (public.is_staff());

-- Plantillas: cualquier usuario autenticado las lee; staff las administra.
create policy "plantillas leer" on public.document_templates
  for select using (auth.role() = 'authenticated');
create policy "plantillas staff" on public.document_templates
  for all using (public.is_staff()) with check (public.is_staff());

-- Documentos: el cliente ve los suyos y puede subir (pendiente/rechazado → enviado).
create policy "documentos leer" on public.opportunity_documents
  for select using (
    public.is_staff() or exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.client_id = auth.uid()
    )
  );
create policy "documentos cliente sube" on public.opportunity_documents
  for update using (
    status in ('pendiente', 'rechazado', 'enviado') and exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.client_id = auth.uid()
    )
  )
  with check (status = 'enviado');
create policy "documentos staff" on public.opportunity_documents
  for all using (public.is_staff()) with check (public.is_staff());

-- El cliente solo puede tocar file_path, status y uploaded_at de sus documentos.
create or replace function public.guard_client_document_update()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  if not public.is_staff() then
    if new.name is distinct from old.name
       or new.opportunity_id is distinct from old.opportunity_id
       or new.template_id is distinct from old.template_id
       or new.reviewer_note is distinct from old.reviewer_note
       or new.reviewed_at is distinct from old.reviewed_at then
      raise exception 'No autorizado';
    end if;
  end if;
  return new;
end; $$;
create trigger opportunity_documents_guard before update on public.opportunity_documents
  for each row execute function public.guard_client_document_update();

-- Pasos
create policy "pasos leer" on public.opportunity_steps
  for select using (
    public.is_staff() or exists (
      select 1 from public.opportunities o
      where o.id = opportunity_id and o.client_id = auth.uid()
    )
  );
create policy "pasos staff" on public.opportunity_steps
  for all using (public.is_staff()) with check (public.is_staff());

-- Leads: cualquiera (incluso anónimo) puede enviar el formulario; solo staff los lee.
create policy "leads insertar" on public.leads
  for insert to anon, authenticated with check (handled = false);
create policy "leads staff" on public.leads
  for all using (public.is_staff()) with check (public.is_staff());

-- =====================================================================
-- Storage
-- =====================================================================
insert into storage.buckets (id, name, public)
values ('propiedades', 'propiedades', true),
       ('documentos', 'documentos', false)
on conflict (id) do nothing;

-- Fotos de propiedades: lectura pública, escritura staff.
create policy "fotos leer" on storage.objects
  for select using (bucket_id = 'propiedades');
create policy "fotos staff escribe" on storage.objects
  for insert with check (bucket_id = 'propiedades' and public.is_staff());
create policy "fotos staff edita" on storage.objects
  for update using (bucket_id = 'propiedades' and public.is_staff());
create policy "fotos staff borra" on storage.objects
  for delete using (bucket_id = 'propiedades' and public.is_staff());

-- Documentos privados. Ruta: {opportunity_id}/{document_id}/{archivo}
create policy "docs staff" on storage.objects
  for all using (bucket_id = 'documentos' and public.is_staff())
  with check (bucket_id = 'documentos' and public.is_staff());
create policy "docs cliente lee" on storage.objects
  for select using (
    bucket_id = 'documentos' and exists (
      select 1 from public.opportunities o
      where o.id::text = (storage.foldername(name))[1] and o.client_id = auth.uid()
    )
  );
create policy "docs cliente sube" on storage.objects
  for insert with check (
    bucket_id = 'documentos' and exists (
      select 1 from public.opportunities o
      where o.id::text = (storage.foldername(name))[1] and o.client_id = auth.uid()
    )
  );
