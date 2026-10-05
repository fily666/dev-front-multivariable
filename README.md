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

13 rutas más el proxy, confirmadas por `next build`:

| Ruta | Render | Qué es |
|---|---|---|
| `/` | Estático | La encuesta (wizard de 10 componentes) |
| `/gracias` | Estático | Confirmación de envío |
| `/login` | Estático | Canje del token por la cookie de sesión |
| `/admin` | Estático | Resumen ejecutivo: el diagnóstico en una lectura |
| `/admin/indices` | Estático | Los ocho índices, sus pesos y el NPS por área |
| `/admin/componentes` | Estático | Detalle por componente, por área de origen y por nivel de cargo |
| `/admin/preguntas` | Estático | Las 33 afirmaciones 0-10, una por una: distribución, neto y consenso |
| `/admin/mapa` | Estático | Mapa de relacionamiento: plano, brecha, aspectos, influencias y matriz |
| `/admin/interaccion` | Estático | Red de interacción: demanda, áreas críticas, frecuencia, valor contra fortalecer |
| `/admin/cualitativo` | Estático | Nube de ideas, obstáculos y motivos |
| `/admin/areas` | Estático | Todas las áreas, por gestión |
| `/admin/areas/[area]` | Dinámico | Ficha de un área |
| `/admin/metodologia` | Estático | Fuentes, fórmulas, pesos, semáforo y anonimato |
| `/admin/respuestas` | Estático | **Monitoreo en vivo** de la recolección y el listado |
| `/_not-found` | Estático | 404 |

Las rutas de `/admin` se prerenderizan como cascarón estático y traen sus datos en cliente
con React Query: los datos del panel nunca se cachean (`cache: 'no-store'`), y prerenderizar
el cascarón evita mandar HTML vacío mientras llega el primer fetch.

`metadata.robots` está en `{ index: false, follow: false }`
([layout.tsx](src/app/layout.tsx)): es un instrumento interno, no debe indexarse.

---

## Estructura

```
src/
├── app/
│   ├── layout.tsx          html lang="es-CO", Geist + Geist Mono, robots noindex
│   ├── globals.css         tokens de la línea gráfica, paleta de datos, piezas .lk-*
│   ├── providers.tsx       React Query
│   ├── page.tsx            la encuesta
│   ├── login/ gracias/
│   └── admin/              layout con AdminShell + las 11 vistas del panel
├── components/
│   ├── brand/Logo.tsx      logotipo e isotipo; versión según el fondo
│   ├── ui/icons.tsx        iconos de trazo (24 × 24, trazo 1,8)
│   ├── shell/              AdminShell · SidebarNav · CommandPalette · nav-config
│   ├── page/               PageHeader (portada o plana, migas, cifras, acciones, secciones)
│   │                       FilterBar (la fila de filtros globales)
│   ├── survey/             el wizard (ver «Los cuatro bloques de color»)
│   └── charts/             piezas del panel:
│                           ChartCard · DataTable · EnvelopeGate · SidePanel
│                           PackedBubbles + pack.ts · QuadrantScatter · TimelineChart
│                           LikertBars · ItemHistogram
│                           MonitoringCharts (embudo, histograma, calendario)
│                           IndicatorMeter · BarRanking · DivergingBars · OpposedBars
│                           OrdinalBars · NpsGauge · RadarIndices · PriorityList
│                           IndicesHeatTable · RelationshipMatrixView · ScoreHeatmapGrid
└── lib/
    ├── api.ts              cliente HTTP; credentials: 'include', cache: 'no-store'
    ├── survey-client.ts    endpoints de la encuesta
    ├── admin-client.ts     endpoints del panel
    ├── insights.ts         **el motor de lecturas**: convierte cada payload en una conclusión
    ├── use-catalog.ts      el organigrama (gestiones y subprocesos) desde el catálogo público
    ├── filters-store.ts    los filtros globales del análisis, en la sesión del navegador
    ├── use-area-names.ts   códigos de área → nombre
    ├── zod-schema-builder.ts  validación generada desde el catálogo
    ├── draft-storage.ts    puntero del borrador en localStorage
    ├── score-scale.ts      formato es-CO de cifras y fechas, bandas y velo de matrices
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
total de pasos dependa de cuántas áreas eligió el encuestado en la pregunta 1.1.

**Las opciones de área se agrupan solas por gestión.** El backend manda cada opción con su
grupo (`option.group`), así que `MultiChoiceField` y `SingleChoiceField` pintan los
encabezados sin saber nada del organigrama
([option-groups.ts](src/components/survey/fields/option-groups.ts)). Con 24 subprocesos una
lista plana obliga a leerla entera; la gestión es la pista con la que cada persona se ubica.

**Dos excepciones al wizard genérico, ambas del componente 1.** La identificación (área y
cargo) vive en el paso de bienvenida y no en el catálogo de preguntas, porque condiciona todo
lo que sigue. Y `c1_area_principal` —la relación principal— no se pinta como bloque propio:
es una estrella sobre las áreas que se acaban de marcar en 1.1
([ComponentStep.tsx](src/components/survey/ComponentStep.tsx)). Preguntarla aparte obligaría
a releer 24 subprocesos para repetir una de las cinco ya elegidas.

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

**El mapa de relacionamiento es una matriz, no un grafo.** Ya con siete áreas un grafo dirigido
se vuelve una maraña de aristas; la matriz permite leer una fila ("cómo evalúa PMO a las
demás") o una columna ("cómo evalúan a PMO"). Y siendo una tabla real, la recorre un lector de
pantalla.

---

## El panel: la línea gráfica de las herramientas de análisis

Desde el 5-oct-2026 el panel sigue la línea gráfica aprobada por la organización (la de
*Prospectiva LinkTIC*): menú lateral navy colapsable, buscador ⌘K, portadas navy con retícula,
tarjetas blancas y Geist. El detalle de tokens, gama y tipografía —y en qué se aparta del
Manual de Marca— está en [`../docs/MARCA.md`](../docs/MARCA.md).

### Qué hay en cada vista

| Ruta | Menú | Para qué se abre |
|---|---|---|
| `/admin` | Resumen ejecutivo | El diagnóstico entero en una lectura de arriba abajo. Es la portada |
| `/admin/indices` | Índices | De dónde sale cada cifra: pesos, cuánto le resta cada índice al IMC, NPS por área |
| `/admin/componentes` | Componentes | Cada componente por separado y cómo cambia según el área y el nivel de quien responde |
| `/admin/preguntas` | Preguntas | Lo que los promedios esconden: cada afirmación con su reparto de notas |
| `/admin/mapa` | Mapa de relacionamiento | Plano «da/recibe», ranking, aspectos, **influencias** (red, matriz y plano de motricidad y dependencia, por área o gestión) y la matriz en bruto |
| `/admin/interaccion` | Red de interacción | Qué áreas sostienen el trabajo de las demás y cuáles son críticas |
| `/admin/cualitativo` | Cualitativo | La nube de ideas de «qué cambiaría» y lo que marcaron |
| `/admin/areas` | Todas las áreas | La puerta a cada ficha, por gestión |
| `/admin/areas/[area]` | (cada subproceso) | Cómo la evalúan, contra el promedio de la empresa |
| `/admin/metodologia` | Metodología y datos | Fuentes, fórmulas, pesos, semáforo y anonimato |
| `/admin/respuestas` | Monitoreo en vivo | La recolección mientras está en campo, y el listado |

### La lectura es el título

Cada tarjeta abre con su **conclusión como título**, y el gráfico va debajo como respaldo;
debajo del título, una línea dice qué se está mirando, y al pie, plegado, «¿Cómo leer?» con
el método. Las cabeceras de vista hacen lo mismo: el titular de la portada es la conclusión
(«La colaboración entre áreas está *en riesgo*: 57,6 sobre 100»), no el nombre de la vista.
El fragmento destacado con el degradado lo decide el motor de lecturas (`Insight.emphasis`),
no la pantalla.

Las conclusiones viven en [`lib/insights.ts`](src/lib/insights.ts). Tres reglas que ese
archivo respeta:

1. **Nunca se afirma más de lo que el dato sostiene.** Si los cinco aspectos caben en cuatro
   puntos, la lectura dice «van parejos». Si tres cargos empatan arriba, no se corona a uno.
2. **El tono sale de la banda, no de un umbral escrito en el front.**
3. **Se nombra el caso concreto.** «Contratación pública es la más exigente» sirve; «hay
   oportunidades de mejora» no.

Cada gráfico con más de una lectura posible tiene su **vista de tabla** en el conmutador: es
el gemelo accesible del gráfico y el lugar del número exacto sin depender del cursor.

### El monitoreo en vivo

[`/admin/respuestas`](src/app/admin/respuestas/page.tsx) se refresca sola cada 15 s
(`refetchInterval`), conserva lo pintado mientras llega el corte nuevo y dice cuándo se
actualizó. Lee `GET /admin/monitoring`, que **no pasa por la cohorte mínima**: mide
participación, no opinión. Contesta, en orden:

| Pregunta | Forma |
|---|---|
| ¿Llega gente? | Curva acumulada de iniciadas y completas (o columnas por día); la distancia entre curvas es el abandono |
| ¿Hasta dónde llega? | Embudo por componente, agrupado por bloque, con la caída más grande destacada |
| ¿Cuánto tarda? | Histograma de duración con la marca de los 15 minutos prometidos |
| ¿Qué áreas faltan? | **Burbujas empaquetadas** por área (tamaño = completas; color = si alcanza la cohorte), con panel de detalle |
| ¿Qué niveles faltan? | Barras por cargo |
| ¿Cuándo responde la gente? | Calendario día × hora (hora de Bogotá) |

Las burbujas son la forma de la línea gráfica de referencia para respuestas en vivo. El
empaquetado es el algoritmo de cadena frontal de d3 (`packSiblings`), reescrito en
[`pack.ts`](src/components/charts/pack.ts) para no sumar una dependencia; el área —no el
radio— es proporcional al valor. La misma pieza arma la **nube de ideas** de Cualitativo,
donde las respuestas abiertas se juntan por tema (o por texto idéntico) y se clasifican en
bloque desde el panel de detalle.

### Los KPIs 21–32 y los filtros globales

Desde el 5-oct-2026 el panel explota datos que antes solo entraban promediados o no se usaban
(el detalle está en `Contexto.md` §4.5):

| KPI | Dónde | Forma |
|---|---|---|
| 21 · Distribución de cada afirmación por banda | Preguntas | **Barras Likert divergentes**: bandas bajas a la izquierda del cero |
| 22 · Neto por afirmación, 10 peores y 10 mejores | Preguntas, Resumen | Ranking |
| 23 · Consenso contra nivel | Preguntas | **Plano** con cuadrantes «problema de sistema / localizado» |
| 24 · Índices por cargo y por grupo de cargo | Componentes | Matriz de calor |
| 25 · Brecha jerárquica (dirección − equipos) | Componentes, Resumen | Barras divergentes |
| 26 · Demanda por área | Red de interacción | **Burbujas** |
| 27 · Importancia × desempeño | Red de interacción, Resumen | **Plano** con el cuadrante «crítica» |
| 28 · Frecuencia y tipo de interacción | Red de interacción | Rampa ordinal y barras |
| 29 · Valor × fortalecer | Red de interacción | Barras enfrentadas |
| 30 · Aislamiento en innovación | Red de interacción | Cifras y lista |
| 31 · Calidad del corte | Metodología | Tarjetas y barras |
| 32 · Influencias: quién mueve a quién | Mapa de relacionamiento | **Red de tres capas**, matriz de influencias y plano de motricidad y dependencia; lista compacta en el teléfono |

Cada afirmación abre un panel con su **histograma 0-10** pintado por banda y su promedio
marcado: es la vista que distingue «todos dan 6» de «unos dan 2 y otros 10».

**Filtros globales.** Las vistas de análisis abren con una fila de filtros —área de quien
responde, cargo, frecuencia y tipo de interacción, rango de fechas— que acota todo lo que hay
debajo. Viven en `sessionStorage` ([`filters-store.ts`](src/lib/filters-store.ts)) y no en la
URL a propósito: tienen que acompañar al analista cuando cambia de vista. Cada corte filtrado
pasa por la cohorte mínima en el servidor, así que filtrar demasiado fino muestra el aviso de
anonimato, nunca el dato. El monitoreo y Metodología no se filtran: describen la recolección
entera.

### Las formas, y por qué cada una

| Dato | Forma | Por qué |
|---|---|---|
| Un índice 0-100 | **Medidor** con los tramos del semáforo pintados en la pista | Se lee cuánto falta, no solo quién va delante |
| Áreas por lo que dan y reciben | **Plano** cortado por medianas, con la diagonal «da lo mismo que recibe» | Dos medidas a la vez; los cuadrantes nombran el perfil |
| La brecha, el NPS por área | **Barras divergentes** sobre un cero | Es polaridad: ningún extremo es «bueno» |
| Motivos del NPS | **Barras enfrentadas** | Un motivo que pesa en los dos lados es la señal más útil |
| Aspectos de un área | **Medidor con marca de referencia** (promedio de la empresa) | Se ve de inmediato dónde queda por debajo de lo típico |
| Lo que resta cada índice al IMC | **Barras** de peso × (100 − valor) | El que más resta no siempre es el más bajo |
| Cumplimiento del ANS | **Rampa ordinal** | Las categorías tienen orden natural |
| Matrices de áreas | **Velo** del color de banda | 24 × 24 bloques saturados aplastan el número |

### Color: lo que está verificado

La paleta de datos es la de la referencia y se validó con el procedimiento de seis controles
(banda de luminancia, croma, separación con protanopia y deuteranopia, separación con visión
normal, contraste). La rampa ordinal pasa los controles ordinales (luminancia monótona,
ΔL ≥ 0,06, extremo claro 2,1:1); el par divergente azul/rojo da ΔE 21,6 con protanopia.

**Las cuatro bandas del semáforo siguen sin distinguirse entre sí por color a secas.** Los
colores llegan de la base de datos y son del cliente, así que no se cambian — lo que se hace
es no depender de ellos: la banda va siempre con su etiqueta escrita.

---

## Los cuatro bloques de color

Los diez componentes del instrumento se recorren en cuatro bloques, y cada uno tiene su
color. El corte está donde cambia el tipo de esfuerzo que se le pide al encuestado, que es
donde conviene que cambie el tono:

| Bloque | Componentes | Color | Qué se pide |
|---|---|---|---|
| 1 · Relacionamiento | 1-2 | azul `#0a6cb1` | calificar áreas concretas, una por una |
| 2 · Cómo funciona la empresa | 3-6 | teal `#0d6d5f` | calificar la operación: comunicación, servicio, tiempos, roles |
| 3 · Cultura | 7-8 | verde `#12690a` | cómo nos tratamos, aprendemos e innovamos |
| 4 · Qué debemos cambiar | 9-10 | ámbar `#8a5300` | qué recomendaría y qué hay que arreglar |

**El orden del instrumento no se toca**: los bloques agrupan, no reordenan. Cada uno es
contiguo a propósito — un bloque partido haría que el color fuera y volviera, que es la
señal contraria a la que sirve.

El color no vive solo en la barra de progreso. Tiñe el título del componente, la cinta de
fase, el botón de continuar, la casilla marcada de la escala 0-10 y el filete superior de la
tarjeta, así que al cambiar de bloque cambia el tono de toda la pantalla.

### Cómo está cableado

`SurveyWizard` pone un solo atributo, `data-phase`, en el contenedor del paso. De él
cuelgan los tokens `--phase-*` de `globals.css`, y las utilidades `text-phase`, `bg-phase`,
`border-phase-border`, `bg-phase-subtle` y `text-phase-on` los leen. Ningún componente
recibe el color por props: `ScaleField` no sabe en qué bloque está.

Fuera de un `[data-phase]` los tokens valen lo mismo que la marca, que es lo que necesitan
la bienvenida y la revisión.

`--phase-on` es la tinta que va encima de un plano de fase relleno: blanco. Las cuatro
tintas dan entre 5,5:1 y 6,9:1 sobre blanco.

### Qué sostiene el recorrido

Lo que evita que la encuesta se abandone a la mitad, en orden de peso:

1. **El mapa de ruta en la bienvenida** (`PhaseRoadmap`). Los cuatro bloques con su color,
   su promesa y su duración, antes de empezar. El abandono suele ser la sospecha de que el
   formulario no se acaba nunca.
2. **La barra partida en cuatro** (`PhaseProgress`). Cada tramo pesa lo que pesan sus
   pasos, no un cuarto: el primer bloque son seis pantallas de dieciséis y fingir lo
   contrario estanca el avance justo ahí. Es además la leyenda del código de color.
3. **El hito al entrar a un bloque** (`PhaseMilestone`). Cierra lo anterior con un visto y
   abre lo siguiente diciendo cuánto dura. El cambio de tema es el momento de más riesgo.
4. **El sub-avance por área** (`AreaProgress`). El componente 2 son cinco pantallas casi
   idénticas; los puntos dicen cuántas faltan sin obligar a leer.
5. **El pie pegado abajo** con el contador de respondidas y el aviso de que ya quedó
   guardado. Con cinco escalas de 0 a 10 el botón de continuar cae fuera de pantalla.
6. **El aviso al cerrar la pestaña**, solo cuando hay algo sin guardar. Uno que salte
   siempre se aprende a ignorar.

### Pendiente: el componente 10 es la pantalla más larga

Tal como está, el componente 10 monta en una sola pantalla tres preguntas de selección
única sobre el catálogo completo de 24 subprocesos. Medida en el recorrido real: **unos
5.600 px de alto**, contra los ~1.400 de una pantalla de escalas. Es justo la última, donde
menos conviene. Dos salidas, ninguna aplicada todavía porque cambian el instrumento o la
secuencia de pasos:

- Partir el componente 10 en dos pasos. Toca la semántica de `lastStep`, que hoy es el id
  del componente.
- Rendir las preguntas de selección única con muchas opciones como `<select>` agrupado por
  gestión, en vez de 24 botones. Pierde objetivo táctil, gana pantalla.

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
  viven en [`globals.css`](src/app/globals.css) — y salen de la línea gráfica aprobada,
  según [`../docs/MARCA.md`](../docs/MARCA.md)
- En Tailwind 4 los utilitarios viven en una capa, y **una regla sin capa les gana
  siempre**. La base del sistema va en `@layer base` y las piezas `.lk-*` en
  `@layer components`; una regla global nueva fuera de capa anularía los utilitarios

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

Estado al 5-oct-2026: los tres pasan — 13 rutas más el proxy.

Este proyecto **no tiene tests automatizados**; la batería de 182 tests vive en `dev-back`,
donde están las fórmulas y las reglas del instrumento.
