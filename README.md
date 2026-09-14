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
│   │   ├── survey-phases.ts      los 4 bloques y su avance por tramo
│   │   ├── fields/               los 4 tipos de campo + option-groups.ts
│   │   ├── PhaseProgress · PhaseBanner · PhaseRoadmap · PhaseIcon · AreaProgress
│   │   └── ComponentStep · ReviewStep · WelcomeStep · StepShell
│   └── charts/             piezas del panel:
│                           Readout · HeroFigure · IndicatorMeter · PriorityList
│                           StatStrip · DivergingBars · OpposedBars · OrdinalBars
│                           IndicesHeatTable · RelationshipMatrixView
│                           ScoreHeatmapGrid · BarRanking · NpsGauge · RadarIndices
│                           KpiCard · BandChip · InsufficientData · AdminNav
└── lib/
    ├── api.ts              cliente HTTP; credentials: 'include', cache: 'no-store'
    ├── survey-client.ts    endpoints de la encuesta
    ├── admin-client.ts     endpoints del panel
    ├── insights.ts         **el motor de lecturas**: convierte cada payload en una conclusión
    ├── use-area-names.ts   códigos de área → nombre, desde el catálogo público
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

## El panel: seis vistas y una conclusión en cada bloque

### Qué hay en cada una

| Ruta | Nav | Para qué se abre |
|---|---|---|
| `/admin` | Dashboard | El diagnóstico entero en una lectura de arriba abajo. Es la portada |
| `/admin/indices` | Índices | De dónde sale cada cifra: pesos del compuesto, NPS por área |
| `/admin/componentes` | Componentes | Cada componente por separado y cómo cambia según quién responde |
| `/admin/mapa` | Mapa de relacionamiento | Cómo se evalúan las áreas entre sí |
| `/admin/cualitativo` | Cualitativo | Lo que la gente señala, con sus palabras |
| `/admin/respuestas` | Respuestas | Cómo va la recolección y el listado en bruto |

El antiguo `/admin` se llamaba «Resumen» y mostraba KPIs, radar y NPS. Ese papel lo absorbe
el dashboard, que además concluye; lo que tenía de propio —cómo se construyen los
índices— se movió a `/admin/indices`. Ninguna capacidad se perdió.

### La lectura, que es lo que cambia todo

Cada bloque abre con su **conclusión escrita** (`Readout`) y pone el gráfico debajo como
respaldo. El orden inverso —gráfico primero, conclusión si acaso— es lo que hace que un
panel se mire y no se use.

Las conclusiones viven en [`lib/insights.ts`](src/lib/insights.ts), no en las pantallas.
Tres reglas que ese archivo respeta:

1. **Nunca se afirma más de lo que el dato sostiene.** Si los cinco aspectos caben en
   cuatro puntos, la lectura dice «van parejos» en vez de coronar un «más flojo» que no
   existe. Si el mejor índice sigue en riesgo, el titular deja de ser «Lo que sostiene» y
   pasa a ser «Lo mejor que hay hoy».
2. **El tono sale de la banda, no de un umbral escrito en el front.** Los umbrales viven en
   `indicator_thresholds` y un admin los mueve sin desplegar.
3. **Se nombra el caso concreto.** «Contratación pública es la más exigente» sirve; «hay
   oportunidades de mejora» no.

### El dashboard

Está escrito para alguien que tiene cinco minutos y tiene que decidir algo, así que cuenta
una historia en orden en vez de ofrecer una rejilla para explorar: cuánto vale la
colaboración y si el dato se puede tomar en serio → dónde está fuerte y dónde rota, con
nombre propio → qué se siente al trabajar con otra área → qué señala la gente como el
problema → qué haría falta hacer. Tiene hoja de estilo de impresión: «Imprimir o guardar en
PDF» produce un documento, no una captura de una aplicación.

### Las formas, y por qué cada una

| Dato | Forma | Por qué |
|---|---|---|
| Un índice 0-100 | **Medidor** con la pista completa y los cortes de banda marcados | Se lee cuánto falta, no solo quién va delante. Un 62 y un 58 se ven casi iguales, y son bandas distintas |
| La brecha de percepción | **Barras divergentes** sobre un cero | Es polaridad: ningún extremo es «bueno». Una tabla de números con signo obliga a leer fila por fila para hallar los extremos |
| Motivos del NPS | **Barras enfrentadas** | Un motivo que pesa en los dos lados es la señal más útil del instrumento, y en dos listas separadas hay que ir y venir para verla |
| Tramos de tiempo de respuesta | **Rampa ordinal**, un tono en pasos de luminancia | Las categorías tienen orden natural; cinco colores distintos dirían que son cosas independientes |
| Matrices de áreas | **Velo** del color de banda, no el color a plena carga | 24 × 24 bloques saturados se leen como ruido y aplastan el número, que es el dato |
| La cifra de portada | **Hero** sin `tabular-nums` | A ese tamaño los dígitos de ancho fijo dejan huecos |

### Color: lo que está verificado

Las paletas no se eligieron a ojo. Lo medible se midió:

- **Rampa ordinal** (tiempos de respuesta): luminancia monótona, saltos ΔL ≥ 0,06 y el
  extremo más cercano a la superficie por encima de 2:1, con juegos propios para claro y
  oscuro. El anclaje se invierte en oscuro porque el extremo que debe despegarse del fondo
  es el contrario.
- **Par divergente** (brecha, motivos): frío contra cálido, ΔE 25,9 con protanopia y 27,9
  con visión normal. Dos fríos no se leerían como opuestos.
- **Velo de las matrices**: en claro la luminancia baja de forma monótona con la severidad
  y el texto rinde ≥ 5,1:1; en oscuro ≥ 7,8:1.

**Las cuatro bandas del semáforo NO se distinguen entre sí por color a secas.** Medido:
«En riesgo» contra «Aceptable» dan ΔE 5,5 con deuteranopia, y «Crítico» contra «En riesgo»
ΔE 10,0 incluso con visión normal, por debajo del piso de 15. Los colores llegan de la base
de datos y son del cliente, así que no se cambian — lo que se hace es no depender de ellos:
la banda va siempre con su etiqueta escrita, cada celda de matriz lleva su número, y los
dos lados de un gráfico enfrentado se distinguen por el lado y por la palabra del
encabezado, nunca por verde contra rojo (ese par colapsa a ΔE 4,5).

---

## Los cuatro bloques de color

Los diez componentes del instrumento se recorren en cuatro bloques, y cada uno tiene su
color. El corte está donde cambia el tipo de esfuerzo que se le pide al encuestado, que es
donde conviene que cambie el tono:

| Bloque | Componentes | Color | Qué se pide |
|---|---|---|---|
| 1 · Relacionamiento | 1-2 | azul `#0061c2` | calificar áreas concretas, una por una |
| 2 · Cómo funciona la empresa | 3-6 | teal `#0d6d5f` | calificar la operación: comunicación, servicio, tiempos, roles |
| 3 · Cultura | 7-8 | verde `#12690a` | cómo nos tratamos, aprendemos e innovamos |
| 4 · Qué debemos cambiar | 9-10 | ámbar `#8a5300` | qué recomendaría y qué hay que arreglar |

**El orden del instrumento no se toca**: los bloques agrupan, no reordenan. Cada uno es
contiguo a propósito — un bloque partido haría que el color fuera y volviera, que es la
señal contraria a la que sirve.

El color no vive solo en la barra de progreso. Tiñe el título del componente, la cinta de
fase, el botón de continuar y la casilla marcada de la escala 0-10, así que al cambiar de
bloque cambia el tono de toda la pantalla.

### Cómo está cableado

`SurveyWizard` pone un solo atributo, `data-phase`, en el contenedor del paso. De él
cuelgan los tokens `--phase-*` de `globals.css`, y las utilidades `text-phase`, `bg-phase`,
`border-phase-border`, `bg-phase-subtle` y `text-phase-on` los leen. Ningún componente
recibe el color por props: `ScaleField` no sabe en qué bloque está.

Fuera de un `[data-phase]` los tokens valen lo mismo que la marca, que es lo que necesitan
la bienvenida y la revisión.

`--phase-on` es la tinta que va encima de un plano de fase relleno. En claro es blanco; en
oscuro los cuatro tonos son brillantes y el blanco encima daría 1,5:1 sobre el ámbar, así
que ahí la tinta es el carbón del fondo. Los cuatro tonos claros dan entre 6,0:1 y 6,9:1
sobre blanco, y los cuatro oscuros entre 5,1:1 y 9,8:1 sobre la superficie oscura.

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
