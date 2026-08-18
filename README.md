# Frontend — Diagnóstico Organizacional LinkTIC

Aplicación de Next.js con las dos superficies del sistema: la **encuesta pública y anónima**
en el home, y el **panel de administración** protegido por sesión.

- **Local:** `http://localhost:3000`
- **API:** habla solo con NestJS, vía el rewrite de `next.config.ts` (`API_ORIGIN`). Nunca con Supabase directamente.
- **Especificación funcional:** [`../Contexto.md`](../Contexto.md)
- **Variables de entorno:** [`../docs/VARIABLES-DE-ENTORNO.md`](../docs/VARIABLES-DE-ENTORNO.md)

---

## Arranque

Requiere Node 20.19+ y el backend corriendo en `http://localhost:3001`.

```bash
npm install
cp .env.local.example .env.local    # sirve tal cual, sin editar
npm run dev                         # http://localhost:3000
```

Para entrar al panel: `http://localhost:3000/login`, con el valor de `ADMIN_ACCESS_TOKEN`
del backend (inicialmente `Admin123!@`).

---

## Scripts

| Script | Qué hace |
|---|---|
| `npm run dev` | Servidor de desarrollo |
| `npm run build` | Build de producción |
| `npm start` | Sirve el build |
| `npm run typecheck` | `tsc --noEmit` |
| `npm run lint` | ESLint (`eslint-config-next`) |

Si `tsc` se queja de `PageProps` o `LayoutProps` tras añadir una ruta, `npx next typegen`
regenera los tipos de ruta. Este proyecto usa esos tipos generados: vea
`LayoutProps<'/'>` en [layout.tsx:16](src/app/layout.tsx#L16).

---

## Rutas

9 rutas más el proxy, confirmadas por `next build`:

| Ruta | Render | Qué es |
|---|---|---|
| `/` | Estático | La encuesta (wizard de 10 componentes) |
| `/gracias` | Estático | Confirmación de envío |
| `/login` | Estático | Canje del token por la cookie de sesión |
| `/admin` | Estático | Titulares: IMC, participación, indicadores |
| `/admin/componentes` | Estático | Detalle por componente |
| `/admin/mapa` | Estático | Matriz de relacionamiento entre áreas |
| `/admin/cualitativo` | Estático | Respuestas abiertas, agrupables por tema |
| `/admin/respuestas` | Estático | Listado paginado de respuestas |
| `/admin/areas/[area]` | Dinámico | Detalle de un área |
| `/_not-found` | Estático | 404 |

Las rutas de `/admin` se prerenderizan como cascarón estático y traen sus datos en cliente
con React Query: los datos del panel nunca se cachean (`cache: 'no-store'`), y prerenderizar
el cascarón evita mandar HTML vacío mientras llega el primer fetch.

`metadata.robots` está en `{ index: false, follow: false }`
([layout.tsx:13](src/app/layout.tsx#L13)): es un instrumento interno, no debe indexarse.

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx          html lang="es-CO", Montserrat corporativa, robots noindex
│   ├── providers.tsx       React Query
│   ├── page.tsx            la encuesta
│   ├── login/ gracias/
│   └── admin/              layout con nav + las 5 vistas del panel
├── components/
│   ├── brand/Logo.tsx      logotipo e isotipo, con su versión para fondo oscuro
│   ├── survey/
│   │   ├── SurveyWizard.tsx      orquestador
│   │   ├── useSurveyWizard.ts    estado, autoguardado, navegación
│   │   ├── wizard-steps.ts       construcción de la secuencia de pasos
│   │   ├── QuestionRenderer.tsx  despacha al campo según el tipo
│   │   ├── fields/               los 4 tipos de campo
│   │   └── ComponentStep · ReviewStep · WelcomeStep · ProgressBar · StepShell
│   └── charts/             KpiCard, BandChip, RadarIndices, NpsGauge,
│                           RelationshipMatrixView, ScoreHeatmapGrid,
│                           BarRanking, StackedBars, InsufficientData, AdminNav
└── lib/
    ├── api.ts              cliente HTTP; credentials: 'include', cache: 'no-store'
    ├── survey-client.ts    endpoints de la encuesta
    ├── admin-client.ts     endpoints del panel
    ├── zod-schema-builder.ts  validación generada desde el catálogo
    ├── draft-storage.ts    puntero del borrador en localStorage
    ├── score-scale.ts      bandas de color y contraste de tinta
    ├── use-thresholds.ts   umbrales, leídos de la API
    └── proxy.ts            (en src/) chequeo optimista de sesión sobre /admin/*
```

---

## Cinco decisiones que explican el código

**El wizard lo dirige el catálogo, no el código.** Un renderizador genérico
([QuestionRenderer.tsx](src/components/survey/QuestionRenderer.tsx)) pinta los tipos de
pregunta a partir de `GET /survey/schema`. **Añadir una pregunta al instrumento no requiere
tocar React.** Incluso el layout de cada componente se deduce de las preguntas y no de una
lista fija de ids ([`layoutOf`](src/components/survey/wizard-steps.ts)): si LinkTIC añade otro
componente evaluado por área, el wizard lo acomoda solo.

El componente 2 se pagina **por área evaluada** — 5 aspectos × 5 áreas son 25 valores, que no
caben en una pantalla — y el 9 se muestra como lista compacta por área. Eso hace que el número
total de pasos dependa de cuántas áreas eligió el encuestado en la pregunta 1.2.

**La validación del cliente se genera desde el schema del servidor.**
[`zod-schema-builder.ts`](src/lib/zod-schema-builder.ts) construye las reglas desde el
catálogo en vez de repetirlas a mano. Escritas a mano se desincronizarían del backend en
cuanto cambiara el instrumento, y el usuario vería un 422 del servidor sobre un formulario que
el cliente dio por válido. Es un **espejo deliberado** del motor de reglas del backend, no un
reemplazo: el servidor revalida siempre.

**El borrador que se guarda en el navegador es un puntero, no una copia.**
[`draft-storage.ts`](src/lib/draft-storage.ts) guarda solo el `draftToken`; la fuente de
verdad es el servidor. Si el usuario cambia de dispositivo pierde el puntero, no la encuesta.
Todo el acceso va en `try/catch` porque en modo privado de Safari `localStorage` lanza al
escribir, y perder el autoguardado local no debe tumbar la encuesta.

**El proxy no es autorización.** [`proxy.ts`](src/proxy.ts) solo comprueba que la cookie
**exista**, y no valida la firma del JWT a propósito: hacerlo obligaría a compartir
`JWT_SECRET` con el frontend, y los secretos viven solo en el backend. La autoridad real es el
`AdminGuard` de la API, que valida el token en cada llamada; el proxy solo evita que el
usuario vea un panel vacío antes del primer 401. En Next 16 el archivo se llama `proxy.ts`
(antes `middleware.ts`) y exporta `proxy()`.

**El color nunca lleva el significado solo.** Los umbrales y sus colores vienen de la base de
datos vía API ([use-thresholds.ts](src/lib/use-thresholds.ts)), y cada tarjeta y celda muestra
también **la etiqueta textual** del nivel. Las cuatro bandas están deliberadamente cerca en el
espacio de color — ámbar y naranja se separan ΔE 13.6 incluso con visión normal — así que la
etiqueta es lo que las hace legibles con daltonismo o impresas en gris.
[`inkOn`](src/lib/score-scale.ts) calcula la tinta por luminancia relativa: con un color fijo,
el ámbar de "Aceptable" o el rojo de "Crítico" quedaría ilegible dentro de su propia celda.

**El mapa de relacionamiento es una matriz, no un grafo.** Con siete áreas un grafo dirigido
se vuelve una maraña de aristas; la matriz permite leer una fila ("cómo evalúa PMO a las
demás") o una columna ("cómo evalúan a PMO"). Y siendo una tabla real, la recorre un lector de
pantalla.

---

## Manejo de errores y anonimato

[`ApiError`](src/lib/api.ts) expone dos casos que la interfaz trata distinto:

- **`isUnauthorized`** (401) — la sesión expiró o nunca existió: el llamador manda a `/login`.
- **`isValidationError`** (422) — violaciones de las reglas del instrumento, con detalle por
  pregunta para pintarlo junto al campo.

Cuando un corte no alcanza `MIN_COHORT_SIZE`, la API devuelve `data: null` con
`meta.insufficient: true` y el panel pinta
[`InsufficientData`](src/components/charts/InsufficientData.tsx) — "datos insuficientes para
mostrar sin comprometer el anonimato" — en vez del dato. La regla se aplica en el servidor; el
front solo la representa.

---

## Este no es el Next.js de siempre

Next 16 trae cambios de ruptura respecto a versiones anteriores. Antes de escribir código,
consulte la guía correspondiente en `node_modules/next/dist/docs/` — lo indica
[`AGENTS.md`](AGENTS.md), que `next dev` regenera automáticamente. Lo más visible aquí:

- `middleware.ts` → **`proxy.ts`**, exportando `proxy()` en vez de `middleware()`
- Tipos de ruta generados: `LayoutProps<'/'>`, `PageProps<…>` vía `next typegen`
- Tailwind CSS 4 con **configuración CSS-first**: no hay `tailwind.config.js`, los tokens
  viven en [`globals.css`](src/app/globals.css) — y salen del Manual de Marca, según
  [`../docs/MARCA.md`](../docs/MARCA.md)

---

## Despliegue en Vercel

| Ajuste | Valor |
|---|---|
| Root Directory | `dev-front` |
| Framework Preset | Next.js (se detecta solo) |

La única variable que cambia respecto a local es `API_ORIGIN`, que debe apuntar al host del
backend **sin `/api/v1`**: el prefijo lo agrega el rewrite.

**El front y el back no necesitan compartir dominio.** El navegador solo habla con el
dominio del front, y Next reenvía `/api/v1/*` al backend, así que la cookie de sesión queda
first-party y `SameSite=Lax` basta aunque los dos proyectos vivan en dominios `*.vercel.app`
distintos. Para que funcione, `COOKIE_DOMAIN` en el backend debe quedar **vacía**: fijarla al
dominio del back haría que el navegador rechace la cookie. El detalle está en
[`../docs/VARIABLES-DE-ENTORNO.md`](../docs/VARIABLES-DE-ENTORNO.md#cookies-entre-dominios).

---

## Verificación

```bash
npm run typecheck && npm run lint && npm run build
```

Estado al 14-ago-2026: los tres pasan — 9 rutas más el proxy.

Este proyecto **no tiene tests automatizados**; la batería de 145 tests vive en `dev-back`,
donde están las fórmulas y las reglas del instrumento.
