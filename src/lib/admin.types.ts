/**
 * Espejo de los DTOs de analítica del backend
 * (`dev-back/src/analytics/dto/analytics.dto.ts`). Se replican en vez de importarse porque
 * son dos proyectos npm independientes con despliegues separados.
 */

export interface ThresholdBand {
  label: string;
  minValue: number;
  maxValue: number;
  color: string;
}

/** Toda respuesta analítica llega envuelta así. */
export interface Envelope<T> {
  data: T | null;
  meta: {
    n: number;
    /** true cuando el corte no alcanza la cohorte mínima y el dato queda oculto. */
    insufficient: boolean;
    minCohortSize: number;
    generatedAt: string;
  };
}

export interface IndicatorResult {
  code: string;
  value: number | null;
  respondents: number;
  observations: number;
}

export interface NpsResult {
  code: string;
  value: number | null;
  promoters: number;
  passives: number;
  detractors: number;
  total: number;
}

export interface RadarPoint {
  code: string;
  label: string;
  value: number | null;
  band: ThresholdBand | null;
}

export interface OverviewPayload {
  imc: { value: number | null; band: ThresholdBand | null; respondents: number };
  nps: NpsResult;
  participation: { completed: number; population: number | null; rate: number | null };
  completion: { completed: number; started: number; rate: number | null };
  medianDurationSeconds: number | null;
  topValueArea: { code: string; name: string; mentions: number } | null;
  radar: RadarPoint[];
}

export interface IndicatorsPayload {
  indicators: IndicatorResult[];
  composite: IndicatorResult;
  nps: NpsResult;
  radar: RadarPoint[];
  thresholds: ThresholdBand[];
  weights: { indicatorCode: string; weight: number }[];
}

export interface DistributionRow {
  value: string;
  label: string;
  count: number;
  share: number;
}

export type CountedOption = DistributionRow;

export interface ComponentsPayload {
  indicators: (IndicatorResult & { label: string; band: ThresholdBand | null })[];
  composite: IndicatorResult;
  responseTimes: DistributionRow[];
  innovationNetwork: { sourceArea: string; targetArea: string; initiatives: number }[];
  thresholds: ThresholdBand[];
}

export interface RelationshipCell {
  sourceArea: string;
  targetArea: string;
  irel: number | null;
  iconf: number | null;
  ival: number | null;
  respondents: number;
  weight: number;
}

export interface AreaRankingRow {
  areaCode: string;
  areaName: string;
  irel: number | null;
  respondents: number;
}

export interface PerceptionGapRow {
  areaCode: string;
  areaName: string;
  received: number | null;
  granted: number | null;
  gap: number | null;
}

export interface AspectMatrixRow {
  areaCode: string;
  areaName: string;
  aspects: Record<string, number | null>;
  respondents: number;
}

export interface RelationshipPayload {
  map: {
    areas: { code: string; name: string }[];
    cells: RelationshipCell[];
    degrees: { areaCode: string; inbound: number; outbound: number }[];
  };
  suppressedCells: number;
  ranking: AreaRankingRow[];
  suppressedRanking: number;
  gap: PerceptionGapRow[];
  aspects: AspectMatrixRow[];
}

export interface NpsPayload {
  global: NpsResult;
  byArea: (NpsResult & { areaCode: string; areaName: string; respondents: number })[];
  motives: { promoters: CountedOption[]; detractors: CountedOption[] };
}

export interface OpenAnswer {
  id: string;
  text: string;
  theme: string | null;
  ownArea: string | null;
  submittedAt: string | null;
}

export interface QualitativePayload {
  barriers: CountedOption[];
  reworkProcesses: CountedOption[];
  areasToStrengthen: CountedOption[];
  npsMotives: { promoters: CountedOption[]; detractors: CountedOption[] };
  openAnswers: OpenAnswer[];
}

export interface AreaDetailPayload {
  area: { code: string; name: string; headcount: number | null };
  gap: PerceptionGapRow | null;
  gapBand: ThresholdBand | null;
  aspects: AspectMatrixRow | null;
  nps: NpsResult;
}

export interface ResponsesPayload {
  total: number;
  page: number;
  pageSize: number;
  rows: {
    id: string;
    ownArea: string | null;
    ownAreaOther: string | null;
    respondentName: string | null;
    respondentRole: string | null;
    submittedAt: string | null;
    durationSeconds: number | null;
    answerCount: number;
  }[];
}

export interface IndicesByAreaPayload {
  rows: {
    areaCode: string;
    areaName: string;
    respondents: number;
    indicators: Record<string, number | null>;
  }[];
  suppressed: number;
}

export interface AdminFilters {
  campaignId?: string;
  ownArea?: string;
  frecuencia?: string;
  tipoInteraccion?: string;
  from?: string;
  to?: string;
}

/** Etiquetas de los aspectos del componente 2, para la matriz. */
export const ASPECT_LABELS: Record<string, string> = {
  c2_facilidad: 'Facilidad para trabajar',
  c2_comunicacion: 'Comunicación',
  c2_confianza: 'Confianza',
  c2_cumplimiento: 'Cumplimiento',
  c2_valor: 'Generación de valor',
};
