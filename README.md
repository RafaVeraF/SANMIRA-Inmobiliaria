# SANMIRA · Real Estate Querétaro

Sitio web y CRM de SANMIRA:

- **Landing trilingüe (ES / EN / DE)** con inventario filtrable, detalle de propiedad y formulario de contacto (los mensajes llegan como *leads*).
- **Acceso de clientes** (compradores, arrendatarios, vendedores y arrendadores): ven los pasos que les faltan para cerrar, su checklist de documentos (y los suben) y las propiedades que su asesor les seleccionó.
- **CRM para el equipo** (admin / asesor): pipeline por etapas, oportunidades con perfilamiento, propiedades vinculadas, revisión de documentos, pasos del cierre, inventario con fotos, opiniones de valor por comparables (imprimibles en PDF), leads y usuarios.

**Stack:** Vite · HTML · Tailwind CSS v4 · JavaScript (sin framework) · Supabase (Auth, Postgres con RLS, Storage) · GitHub · Render.

---

## 1. Correr en tu computadora

Requisitos: [Node.js 20+](https://nodejs.org) y Git.

```bash
cd C:\dev\SANMIRA
npm install
copy .env.example .env      # en Mac/Linux: cp .env.example .env
npm run dev
```

Abre http://localhost:5173. Sin Supabase configurado, la landing muestra **propiedades de ejemplo** para que veas el diseño; el login y el CRM necesitan Supabase.

## 2. Configurar Supabase

1. Crea un proyecto en [supabase.com](https://supabase.com) (región sugerida: `us-east` o la más cercana a México).
2. En **SQL Editor**, ejecuta en este orden:
   1. `supabase/migrations/0001_schema.sql`: tablas, roles, triggers, seguridad RLS y buckets de Storage.
   2. `supabase/seed.sql`: checklist de documentos por tipo de operación y 3 propiedades de ejemplo.
   3. `supabase/migrations/0002_expediente.sql`: expediente del inmueble (módulos del Excel del asesor) y checklist oficial de documentos para vendedor / arrendador.
3. En **Project Settings → API** copia la *Project URL* y la *anon public key* a tu `.env`:
   ```
   VITE_SUPABASE_URL=https://xxxx.supabase.co
   VITE_SUPABASE_ANON_KEY=eyJ...
   ```
4. En **Authentication → URL Configuration** agrega como *Site URL* y *Redirect URLs*:
   `http://localhost:5173/login.html` y, cuando lo publiques, `https://TU-SITIO.onrender.com/login.html`.
5. **Crea tu usuario administrador:** regístrate en `/login.html` → *Crear cuenta*, confirma el correo y luego, en el SQL Editor:
   ```sql
   update public.profiles set role = 'admin' where email = 'tu-correo@ejemplo.com';
   ```
   Desde el CRM → **Usuarios** podrás dar rol de **asesor** a Santiago y Miguel cuando se registren.

### Roles

| Rol | Entra a | Puede |
| --- | --- | --- |
| `admin` | CRM | Todo, incluido cambiar roles |
| `asesor` | CRM | Oportunidades, propiedades, documentos, valuaciones, leads |
| `comprador`, `arrendatario` | Portal | Ver su proceso, subir documentos, ver propiedades seleccionadas |
| `vendedor`, `arrendador` | Portal | Ver el checklist de documentos de su propiedad y subirlos |

La seguridad está en la base de datos (Row Level Security): un cliente **solo** puede leer sus propias oportunidades y documentos, no puede aprobar documentos ni cambiar su rol, y los archivos se guardan en un bucket privado con URLs firmadas temporales.

### Expediente del inmueble (captaciones)

Las oportunidades de **venta** y **renta (propietario)** tienen la pestaña **Expediente**, con los módulos del formato de SANMIRA. Los campos que en el Excel estaban en rojo los llena el asesor; los demás se calculan:

| Módulo | Qué hace |
| --- | --- |
| Hoja de captura | Datos del propietario, del inmueble, acabados e infraestructura. Alimenta a todos los demás. |
| Perfilamiento | CFDI (escritura ≥ 2014), condominio, ISR exento/paga, cancelación de hipoteca. |
| Documentos | Checklist por secciones; marca "No aplica" según estado civil, régimen y condominio. Es el mismo checklist que el propietario ve y llena en su portal. |
| Carta de derechos | Texto NOM-247-SE-2021, fecha de entrega y acuse (actualiza el checklist). |
| Levantamiento | Se genera solo con la Hoja de captura. |
| Opinión de valor | Comparables de terreno y construcción, coeficientes, capitalización de rentas, conclusión con importe en letra, croquis y fotos. Se guarda en el historial de *Opiniones de valor*. |
| Ficha técnica | Descripción para publicidad y botón **Crear propiedad en inventario** (borrador). |

Cada módulo se imprime o se guarda en PDF con el formato SANMIRA (encabezado, firmas, aviso de privacidad), uno por uno o el expediente completo.

✏️ Edita el domicilio, teléfono y correo de la empresa en `src/crm/expediente/config.js` (`EMPRESA`); aparecen en el aviso de privacidad y en el pie de cada formato. El teléfono del asesor se toma de su perfil.

### Flujo típico

1. Llega un lead desde la web → **Leads → Crear oportunidad**.
2. El cliente crea su cuenta en `/login.html` → en la oportunidad, **Resumen → Cliente**, lo asignas.
3. Al crear la oportunidad se generan automáticamente su **checklist de documentos** y sus **pasos** según el tipo (compra, venta, renta inquilino, renta propietario). Puedes editar las plantillas en la tabla `document_templates`.
4. El cliente sube documentos desde su portal → tú los apruebas o rechazas (con nota) en **Documentos**.
5. Marcas los pasos completados; el cliente ve su avance en su idioma.

## 3. Subir a GitHub

```bash
git init
git add .
git commit -m "SANMIRA: landing, portal de clientes y CRM"
git branch -M main
git remote add origin https://github.com/TU-USUARIO/sanmira.git
git push -u origin main
```

El archivo `.env` está en `.gitignore`: tus llaves no se suben.

## 4. Publicar en Render

1. En [render.com](https://render.com) → **New → Blueprint** → conecta el repositorio. Render lee `render.yaml` y crea un *Static Site*.
2. Captura las variables `VITE_SUPABASE_URL`, `VITE_SUPABASE_ANON_KEY` y `VITE_WHATSAPP` cuando te las pida.
3. Cada `git push` a `main` vuelve a publicar el sitio. Los Pull Requests generan una vista previa.
4. Agrega la URL de Render en Supabase → Authentication → URL Configuration (paso 2.4).

Dominio propio (ej. `sanmira.mx`): Render → Settings → Custom Domains.

## Estructura

```
index.html          Landing (inventario, servicios, nosotros, proceso, contacto)
propiedad.html      Detalle de propiedad  (?p=slug)
login.html          Iniciar sesión / crear cuenta / recuperar contraseña
portal.html         Portal de clientes
crm.html            CRM del equipo (rutas con #hash)
public/brand/       Logotipos SVG
src/styles/main.css Tokens de marca para Tailwind v4 (@theme) y componentes
src/lib/            Supabase, auth, i18n (ES/EN/DE), utilidades, layout público
src/pages/          Lógica de cada página
src/crm/            Vistas del CRM: tablero, oportunidades, propiedades, valuaciones, leads, usuarios
src/crm/expediente/ Módulos del Excel del asesor: captura, perfilamiento, documentos, derechos, levantamiento, opinión de valor, ficha técnica, impresión
supabase/           Esquema SQL con RLS y datos iniciales
render.yaml         Despliegue en Render
```

## Siguientes pasos sugeridos

- Fotografías reales del equipo y de las propiedades (los placeholders en arco ya tienen su lugar).
- Avisos por correo cuando un cliente sube un documento (Supabase Edge Function + Resend).
- Mapa de ubicación aproximada en el detalle de propiedad.
- Aviso de privacidad (LFPDPPP) y términos, enlazados desde el pie de página.
