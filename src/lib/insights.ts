import type {
  AspectMatrixRow,
  CountedOption,
  DistributionRow,
  IndicesByAreaPayload,
  NpsResult,
  OverviewPayload,
  PerceptionGapRow,
  RadarPoint,
  ThresholdBand,
} from './admin.types';
import { ASPECT_LABELS } from './admin.types';

/**
 * El motor de lecturas del panel.
 *
 * Un panel que solo pinta números obliga a cada lector a sacar su propia conclusión, y en
 * una presentación gerencial eso significa que cada quien saca una distinta. Aquí vive la
 * conclusión, escrita una sola vez y calculada desde el mismo dato que se pinta al lado.
 *
 * Tres reglas que se respetan en todo el archivo:
 *
 * 1. **Nunca se afirma más de lo que el dato sostiene.** Si falta el dato, la lectura lo
 *    dice; no se rellena con una frase optimista.
 * 2. **El tono sale de la banda, no de un umbral escrito aquí.** Los umbrales viven en
 *    `indicator_thresholds` y un admin puede moverlos sin desplegar; esto los lee.
 * 3. **Se nombra siempre el caso concreto.** «La comunicación está en riesgo» sirve;
 *    «hay oportunidades de mejora» no.
 */

export type Tone = 'good' | 'neutral' | 'warn' | 'bad';

export interface Insight {
  tone: Tone;
  /** La conclusión, en una frase. Es lo que se lee de un vistazo. */
  headline: string;
  /** El dato que la sostiene. Opcional: no toda lectura necesita nota al pie. */
  detail?: string;
}

/**
 * Tono de una banda por su posición en la lista, no por su etiqueta.
 *
 * Las bandas llegan ordenadas de mejor a peor (`sortOrder`) y sus nombres son editables:
 * leer la palabra «Crítico» sería atarse a un texto que el cliente puede cambiar.
 */
export function toneOfBand(band: ThresholdBand | null, bands: ThresholdBand[]): Tone {
  if (!band || bands.length === 0) return 'neutral';
  const index = bands.findIndex((entry) => entry.label === band.label);
  if (index < 0) return 'neutral';
  const tones: Tone[] = ['good', 'neutral', 'warn', 'bad'];
  return tones[Math.min(index, tones.length - 1)];
}

const nf = (value: number, decimals = 0) => value.toFixed(decimals);

/** Ordena puntos del radar de peor a mejor, descartando los que no tienen dato. */
function withValue(points: RadarPoint[]): (RadarPoint & { value: number })[] {
  return points.filter(
    (point): point is RadarPoint & { value: number } => point.value !== null,
  );
}

// ---------------------------------------------------------------- índice compuesto

export function imcInsight(
  imc: OverviewPayload['imc'],
  bands: ThresholdBand[],
): Insight {
  if (imc.value === null) {
    return {
      tone: 'neutral',
      headline: 'Todavía no hay suficientes respuestas para calcular el índice.',
    };
  }

  const tone = toneOfBand(imc.band, bands);
  const label = imc.band?.label ?? 'sin banda';
  const frases: Record<Tone, string> = {
    good: `La colaboración entre áreas es hoy una fortaleza de LinkTIC: ${nf(imc.value, 1)} sobre 100.`,
    neutral: `La colaboración entre áreas funciona, sin holgura: ${nf(imc.value, 1)} sobre 100.`,
    warn: `La colaboración entre áreas está en riesgo: ${nf(imc.value, 1)} sobre 100.`,
    bad: `La colaboración entre áreas es crítica: ${nf(imc.value, 1)} sobre 100.`,
  };

  return {
    tone,
    headline: frases[tone],
    detail: `Banda «${label}», calculada sobre ${imc.respondents} ${imc.respondents === 1 ? 'respuesta' : 'respuestas'}.`,
  };
}

// ---------------------------------------------------------------- perfil de índices

export function radarInsight(points: RadarPoint[], bands: ThresholdBand[]): Insight {
  const conDato = withValue(points);
  if (conDato.length < 2) {
    return { tone: 'neutral', headline: 'Faltan índices con dato para leer el perfil.' };
  }

  const ordenados = [...conDato].sort((a, b) => a.value - b.value);
  const peor = ordenados[0];
  const mejor = ordenados[ordenados.length - 1];
  const distancia = mejor.value - peor.value;

  const tone = toneOfBand(peor.band, bands);
  const parejo = distancia < 10;

  return {
    tone,
    headline: parejo
      ? `El perfil es parejo: los ocho índices caben en ${nf(distancia, 1)} puntos, así que no hay un frente único que atacar.`
      : `${peor.label} es el eslabón débil (${nf(peor.value, 1)}) y ${mejor.label} el más fuerte (${nf(mejor.value, 1)}).`,
    detail: parejo
      ? `Entre ${peor.label} (${nf(peor.value, 1)}) y ${mejor.label} (${nf(mejor.value, 1)}).`
      : `${nf(distancia, 1)} puntos separan el extremo débil del fuerte.`,
  };
}

/** Los índices que hay que atacar primero, de peor a mejor. */
export function priorities(
  points: RadarPoint[],
  bands: ThresholdBand[],
  limit = 3,
): { point: RadarPoint & { value: number }; tone: Tone; action: string }[] {
  const ACCIONES: Record<string, string> = {
    IREL: 'Revisar los pares de áreas peor calificados en el mapa de relacionamiento.',
    ICOM: 'Revisar canales y trazabilidad: qué información llega tarde y por dónde.',
    ISI: 'Revisar el circuito de solicitudes entre áreas y quién responde por él.',
    IAG: 'Fijar tiempos de respuesta comprometidos y medirlos.',
    IINT: 'Aclarar roles y responsabilidades en los procesos que cruzan áreas.',
    ICOL: 'Crear espacios de trabajo conjunto donde hoy solo hay traspaso de tareas.',
    IINN: 'Abrir iniciativas conjuntas con las áreas que hoy no colaboran con nadie.',
    NIO: 'Verificar si el bajo nivel de interacción es un problema o el diseño del proceso.',
  };

  return withValue(points)
    .sort((a, b) => a.value - b.value)
    .slice(0, limit)
    .map((point) => ({
      point,
      tone: toneOfBand(point.band, bands),
      action: ACCIONES[point.code] ?? 'Revisar el componente que alimenta este índice.',
    }));
}

/** Lo que sí está funcionando. Un panel que solo señala fallas no se usa dos veces. */
export function strengths(
  points: RadarPoint[],
  bands: ThresholdBand[],
  limit = 3,
): { point: RadarPoint & { value: number }; tone: Tone }[] {
  return withValue(points)
    .sort((a, b) => b.value - a.value)
    .slice(0, limit)
    .map((point) => ({ point, tone: toneOfBand(point.band, bands) }));
}

/**
 * Cómo titular la lista de arriba.
 *
 * «Lo que sostiene» es verdad solo si algo está realmente sólido. Cuando el mejor índice
 * también está en riesgo, ese título le dice a gerencia que hay una base que en realidad
 * no existe — y ese es justo el error que un panel no puede cometer.
 */
export function strengthsHeading(
  items: { tone: Tone }[],
): { title: string; note?: string } {
  if (items.length === 0) return { title: 'Lo que sostiene' };
  const mejor = items[0].tone;
  if (mejor === 'good') return { title: 'Lo que sostiene' };
  if (mejor === 'neutral') return { title: 'Lo mejor que hay hoy' };
  return {
    title: 'Lo menos malo',
    note: 'Ningún índice llega a un nivel aceptable: no hay una base sobre la cual apoyarse.',
  };
}

// ---------------------------------------------------------------- NPS

export function npsInsight(nps: NpsResult): Insight {
  if (nps.value === null || nps.total === 0) {
    return { tone: 'neutral', headline: 'Sin calificaciones de recomendación todavía.' };
  }

  const share = (count: number) => Math.round((count / nps.total) * 100);
  const promotores = share(nps.promoters);
  const detractores = share(nps.detractors);
  const pasivos = share(nps.passives);

  // Un NPS cercano a cero puede ser indiferencia o polarización, y son diagnósticos
  // opuestos. La lectura tiene que distinguirlos: es el punto de mostrar la composición.
  const polarizado = promotores >= 30 && detractores >= 30;
  const indiferente = pasivos >= 50;

  const tone: Tone =
    nps.value >= 30 ? 'good' : nps.value >= 0 ? 'neutral' : nps.value >= -20 ? 'warn' : 'bad';

  if (polarizado) {
    return {
      tone: 'warn',
      headline: `La experiencia está partida en dos: ${promotores}% recomienda trabajar con su área y ${detractores}% no lo haría.`,
      detail: `El NPS neto (${nps.value > 0 ? '+' : ''}${Math.round(nps.value)}) esconde esa división. Conviene leerlo por área antes que en global.`,
    };
  }

  if (indiferente) {
    return {
      tone: 'warn',
      headline: `Domina la indiferencia: ${pasivos}% son pasivos, ni recomiendan ni desaconsejan.`,
      detail: 'Es el perfil de una relación que funciona pero no genera adhesión.',
    };
  }

  const frases: Record<Tone, string> = {
    good: `Hay adhesión real: ${promotores}% recomendaría trabajar con su área, contra ${detractores}% que no.`,
    neutral: `La experiencia se sostiene apenas: ${promotores}% promotores contra ${detractores}% detractores.`,
    warn: `Pesan más los detractores: ${detractores}% no recomendaría trabajar con su área, contra ${promotores}% que sí.`,
    bad: `La experiencia de servicio interno está rota: ${detractores}% detractores contra ${promotores}% promotores.`,
  };

  return {
    tone,
    headline: frases[tone],
    detail: `${nps.total} ${nps.total === 1 ? 'calificación' : 'calificaciones'} de área.`,
  };
}

// ---------------------------------------------------------------- recolección

export function collectionInsight(
  participation: OverviewPayload['participation'],
  completion: OverviewPayload['completion'],
  n: number,
  minCohortSize: number,
): Insight {
  const abandono =
    completion.started > 0
      ? ((completion.started - completion.completed) / completion.started) * 100
      : null;

  if (participation.rate === null) {
    return {
      tone: 'neutral',
      headline: `${n} ${n === 1 ? 'respuesta completa' : 'respuestas completas'}. No se puede calcular la participación.`,
      detail:
        'Falta registrar cuántas personas tiene cada área; sin ese dato no se sabe qué porción de la empresa habló.',
    };
  }

  const tone: Tone =
    participation.rate >= 70
      ? 'good'
      : participation.rate >= 50
        ? 'neutral'
        : participation.rate >= 30
          ? 'warn'
          : 'bad';

  const frases: Record<Tone, string> = {
    good: `Habló ${nf(participation.rate, 1)}% de la empresa: el corte es representativo.`,
    neutral: `Habló ${nf(participation.rate, 1)}% de la empresa. Alcanza para leer tendencias, no para cerrar conclusiones por área.`,
    warn: `Solo habló ${nf(participation.rate, 1)}% de la empresa: las cifras orientan, no concluyen.`,
    bad: `Con ${nf(participation.rate, 1)}% de participación las cifras no son representativas todavía.`,
  };

  const detalle = [
    `${participation.completed} de ${participation.population} personas.`,
    abandono !== null && abandono >= 20
      ? `${nf(abandono, 0)}% de quienes la abrieron no la terminaron.`
      : null,
    `Los cortes con menos de ${minCohortSize} respuestas se ocultan para preservar el anonimato.`,
  ]
    .filter(Boolean)
    .join(' ');

  return { tone, headline: frases[tone], detail: detalle };
}

// ---------------------------------------------------------------- tiempos

export function responseTimeInsight(rows: DistributionRow[]): Insight {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) return { tone: 'neutral', headline: 'Sin datos de tiempo de respuesta.' };

  const RAPIDO = new Set(['MENOS_2H', 'MISMO_DIA']);
  const LENTO = new Set(['MAS_3_DIAS']);
  const rapido = rows.filter((row) => RAPIDO.has(row.value)).reduce((s, r) => s + r.share, 0);
  const lento = rows.filter((row) => LENTO.has(row.value)).reduce((s, r) => s + r.share, 0);

  const tone: Tone = lento >= 25 ? 'bad' : lento >= 15 ? 'warn' : rapido >= 60 ? 'good' : 'neutral';

  return {
    tone,
    headline:
      lento >= 15
        ? `A ${nf(lento, 0)}% le responden en más de tres días: ahí se pierde la agilidad.`
        : `${nf(rapido, 0)}% recibe respuesta el mismo día o antes.`,
    detail: `${nf(rapido, 0)}% el mismo día o antes · ${nf(lento, 0)}% más de tres días.`,
  };
}

// ---------------------------------------------------------------- mapa

export function gapInsight(rows: PerceptionGapRow[]): Insight {
  const conDato = rows.filter(
    (row): row is PerceptionGapRow & { gap: number } => row.gap !== null,
  );
  if (conDato.length === 0) {
    return { tone: 'neutral', headline: 'Ningún área tiene los dos lados de la brecha.' };
  }

  // La brecha es `recibido − otorgado`. Positiva significa que el área recibe mejores
  // notas de las que reparte —es la exigente—; negativa, que reparte mejores notas de las
  // que recibe. Es fácil leerlo al revés, y el signo cambia por completo la conclusión.
  const ordenadas = [...conDato].sort((a, b) => a.gap - b.gap);
  const generosa = ordenadas[0];
  const exigente = ordenadas[ordenadas.length - 1];

  const mayor = Math.abs(generosa.gap) > Math.abs(exigente.gap) ? generosa : exigente;
  const tone: Tone = Math.abs(mayor.gap) >= 15 ? 'warn' : 'neutral';

  return {
    tone,
    headline:
      mayor.gap > 0
        ? `${mayor.areaName} es la más exigente: califica ${nf(mayor.gap, 1)} puntos por debajo de la nota que ella misma recibe.`
        : `A ${mayor.areaName} la califican ${nf(Math.abs(mayor.gap), 1)} puntos por debajo de como ella califica a las demás.`,
    detail:
      'Una brecha grande no es buen ni mal desempeño: es una expectativa desalineada entre lo que un área cree dar y lo que las demás reciben.',
  };
}

export function aspectsInsight(rows: AspectMatrixRow[], bands: ThresholdBand[]): Insight {
  if (rows.length === 0) return { tone: 'neutral', headline: 'Sin evaluaciones por aspecto.' };

  const promedios = Object.keys(ASPECT_LABELS).map((code) => {
    const valores = rows
      .map((row) => row.aspects[code])
      .filter((value): value is number => typeof value === 'number');
    return {
      code,
      label: ASPECT_LABELS[code],
      value: valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null,
    };
  });

  const conDato = promedios.filter(
    (entry): entry is { code: string; label: string; value: number } => entry.value !== null,
  );
  if (conDato.length === 0) return { tone: 'neutral', headline: 'Sin evaluaciones por aspecto.' };

  const ordenados = [...conDato].sort((a, b) => a.value - b.value);
  const peor = ordenados[0];
  const mejor = ordenados[ordenados.length - 1];
  const distancia = mejor.value - peor.value;
  const banda = bands.find((b) => peor.value >= b.minValue && peor.value <= b.maxValue) ?? null;

  // Con los cinco aspectos casi empatados, nombrar «el más flojo» inventa una jerarquía
  // que el dato no sostiene: cuatro puntos de diferencia no señalan a nadie.
  if (distancia < 8) {
    return {
      tone: toneOfBand(banda, bands),
      headline: `Los cinco aspectos van parejos, entre ${nf(peor.value, 1)} y ${nf(mejor.value, 1)}: ningún aspecto concreto explica el resultado.`,
      detail:
        'Cuando no hay un aspecto que se despegue, la palanca no es una conversación con un área sino un cambio de proceso que los mueva a todos.',
    };
  }

  return {
    tone: toneOfBand(banda, bands),
    headline: `${peor.label} es el aspecto más flojo en toda la empresa (${nf(peor.value, 1)}), y ${mejor.label} el más sólido (${nf(mejor.value, 1)}).`,
    detail:
      'Un aspecto flojo en TODAS las áreas es un problema de sistema, no de un área concreta: la solución es un cambio de proceso, no una conversación.',
  };
}

export function rankingInsight(
  rows: { areaName: string; irel: number | null }[],
  suppressed: number,
): Insight {
  const conDato = rows.filter(
    (row): row is { areaName: string; irel: number } => row.irel !== null,
  );
  if (conDato.length === 0) {
    return {
      tone: 'neutral',
      headline: 'Ningún área alcanza todavía la cohorte mínima para publicarse.',
      detail: suppressed > 0 ? `${suppressed} ocultas por tener muy pocas respuestas.` : undefined,
    };
  }

  const ordenadas = [...conDato].sort((a, b) => b.irel - a.irel);
  const mejor = ordenadas[0];
  const peor = ordenadas[ordenadas.length - 1];
  const distancia = mejor.irel - peor.irel;

  return {
    tone: distancia >= 20 ? 'warn' : 'neutral',
    headline:
      distancia >= 20
        ? `La experiencia de trabajar con un área u otra es muy desigual: ${nf(distancia, 1)} puntos entre ${mejor.areaName} y ${peor.areaName}.`
        : `Las áreas se evalúan de forma pareja: ${nf(distancia, 1)} puntos entre la mejor y la peor.`,
    detail: `${mejor.areaName} ${nf(mejor.irel, 1)} · ${peor.areaName} ${nf(peor.irel, 1)}${suppressed > 0 ? ` · ${suppressed} ${suppressed === 1 ? 'área oculta' : 'áreas ocultas'} por cohorte insuficiente` : ''}.`,
  };
}

export function byAreaInsight(payload: IndicesByAreaPayload): Insight {
  if (payload.rows.length === 0) {
    return {
      tone: 'neutral',
      headline: 'Ningún área alcanza la cohorte mínima para desglosarse.',
      detail: 'Con más respuestas se podrá ver si la percepción crítica se concentra en un área.',
    };
  }

  const promedio = (indicators: Record<string, number | null>) => {
    const valores = Object.values(indicators).filter(
      (value): value is number => typeof value === 'number',
    );
    return valores.length ? valores.reduce((s, v) => s + v, 0) / valores.length : null;
  };

  const conMedia = payload.rows
    .map((row) => ({ ...row, media: promedio(row.indicators) }))
    .filter((row): row is typeof row & { media: number } => row.media !== null)
    .sort((a, b) => a.media - b.media);

  if (conMedia.length < 2) {
    return { tone: 'neutral', headline: 'Se necesitan al menos dos áreas con dato para comparar.' };
  }

  const critica = conMedia[0];
  const conforme = conMedia[conMedia.length - 1];
  const distancia = conforme.media - critica.media;

  return {
    tone: distancia >= 15 ? 'warn' : 'neutral',
    headline:
      distancia >= 15
        ? `La gente de ${critica.areaName} ve la organización mucho peor que la de ${conforme.areaName}: ${nf(distancia, 1)} puntos de diferencia.`
        : `Las áreas coinciden bastante en cómo ven la organización: ${nf(distancia, 1)} puntos entre la más crítica y la más conforme.`,
    detail:
      distancia >= 15
        ? 'Una diferencia así suele ser una experiencia de trabajo distinta, no una opinión distinta. Vale la pena escuchar a esa área aparte.'
        : undefined,
  };
}

// ---------------------------------------------------------------- cualitativo

export function barriersInsight(barriers: CountedOption[]): Insight {
  if (barriers.length === 0) return { tone: 'neutral', headline: 'Nadie ha señalado obstáculos.' };

  const ordenados = [...barriers].sort((a, b) => b.share - a.share);
  const top = ordenados[0];
  const segundo = ordenados[1];
  const dominante = segundo ? top.share - segundo.share >= 15 : true;

  return {
    tone: top.share >= 50 ? 'warn' : 'neutral',
    headline: dominante
      ? `El obstáculo dominante es ${top.label.toLowerCase()}: lo señala ${nf(top.share, 0)}% de los encuestados.`
      : `No hay un obstáculo único: ${top.label.toLowerCase()} (${nf(top.share, 0)}%) y ${segundo.label.toLowerCase()} (${nf(segundo.share, 0)}%) van casi empatados.`,
    detail: dominante
      ? 'Un obstáculo que se despega del resto es la palanca más barata: arreglarlo mueve todo lo demás.'
      : 'Sin un obstáculo dominante, atacar uno solo deja el problema en pie.',
  };
}

export function motivesInsight(motives: {
  promoters: CountedOption[];
  detractors: CountedOption[];
}): Insight {
  const { promoters, detractors } = motives;
  if (promoters.length === 0 && detractors.length === 0) {
    return { tone: 'neutral', headline: 'Sin motivos registrados todavía.' };
  }

  // Un motivo que aparece fuerte en los dos lados es la señal más útil de todo el panel:
  // significa que el mismo atributo se experimenta de forma opuesta según con quién trate.
  const porValor = new Map(detractors.map((option) => [option.value, option]));
  const ambos = promoters
    .map((option) => ({ option, contra: porValor.get(option.value) }))
    .filter(
      (entry): entry is { option: CountedOption; contra: CountedOption } =>
        entry.contra !== undefined && entry.option.share >= 15 && entry.contra.share >= 15,
    )
    .sort((a, b) => b.option.share + b.contra.share - (a.option.share + a.contra.share));

  if (ambos.length > 0) {
    const { option, contra } = ambos[0];
    return {
      tone: 'warn',
      headline: `${option.label} divide: es la razón de ${nf(option.share, 0)}% de los promotores y de ${nf(contra.share, 0)}% de los detractores.`,
      detail:
        'El mismo atributo se vive de forma opuesta según el área con la que se trate: el problema no es la empresa, es la desigualdad entre áreas.',
    };
  }

  const topDetractor = [...detractors].sort((a, b) => b.share - a.share)[0];
  const topPromotor = [...promoters].sort((a, b) => b.share - a.share)[0];

  return {
    tone: topDetractor ? 'neutral' : 'good',
    headline: topDetractor
      ? `Lo que más resta es ${topDetractor.label.toLowerCase()} (${nf(topDetractor.share, 0)}% de los detractores)${topPromotor ? `; lo que más suma es ${topPromotor.label.toLowerCase()} (${nf(topPromotor.share, 0)}%)` : ''}.`
      : `Lo que más suma es ${topPromotor.label.toLowerCase()} (${nf(topPromotor.share, 0)}% de los promotores).`,
  };
}

export function strengthenInsight(areas: CountedOption[]): Insight {
  if (areas.length === 0) {
    return { tone: 'neutral', headline: 'Nadie ha señalado un área a fortalecer.' };
  }
  const top = [...areas].sort((a, b) => b.share - a.share)[0];
  return {
    tone: 'neutral',
    headline: `${top.label} es el área que más personas piden fortalecer: ${nf(top.share, 0)}% la menciona.`,
    detail:
      'Es una petición de más relación, no una queja de desempeño: suele señalar un área con la que cuesta trabajar por diseño, no por actitud.',
  };
}

export function openAnswersInsight(
  answers: { theme: string | null }[],
  total: number,
): Insight {
  if (answers.length === 0) {
    return { tone: 'neutral', headline: 'Nadie ha dejado una respuesta abierta todavía.' };
  }
  const clasificadas = answers.filter((answer) => answer.theme).length;
  const cobertura = total > 0 ? (answers.length / total) * 100 : 0;

  return {
    tone: clasificadas === answers.length ? 'good' : 'neutral',
    headline: `${answers.length} ${answers.length === 1 ? 'persona escribió' : 'personas escribieron'} qué cambiarían (${nf(cobertura, 0)}% de quienes respondieron).`,
    detail:
      clasificadas === answers.length
        ? 'Todas están clasificadas por tema.'
        : `${answers.length - clasificadas} sin clasificar. Asignarles un tema permite contarlas junto a las cerradas.`,
  };
}

export function innovationInsight(
  edges: { sourceArea: string; targetArea: string; initiatives: number }[],
): Insight {
  if (edges.length === 0) {
    return {
      tone: 'warn',
      headline: 'Ningún área declara haber desarrollado iniciativas nuevas con otra en seis meses.',
      detail: 'La innovación conjunta es hoy inexistente, no baja.',
    };
  }

  const participantes = new Set(edges.flatMap((edge) => [edge.sourceArea, edge.targetArea]));
  const total = edges.reduce((sum, edge) => sum + edge.initiatives, 0);

  return {
    tone: 'neutral',
    headline: `${participantes.size} áreas aparecen en alguna iniciativa conjunta, con ${total} ${total === 1 ? 'mención' : 'menciones'} en total.`,
    detail: 'Las áreas que no aparecen aquí son las que no han desarrollado nada con nadie.',
  };
}
