/**
 * Espejo de los DTOs del backend. Es el contrato del wizard schema-driven: el front no
 * conoce las 53 preguntas del instrumento, las recibe de `GET /survey/schema`.
 */

export type QuestionType = 'SINGLE' | 'MULTI' | 'SCALE_0_10' | 'TEXT' | 'MATRIX_AREA';

export interface Area {
  code: string;
  name: string;
  isEvaluable: boolean;
}

export interface QuestionOption {
  value: string;
  label: string;
  allowsText: boolean;
  exclusive: boolean;
}

export interface Question {
  code: string;
  componentId: number;
  label: string;
  helpText: string | null;
  type: QuestionType;
  required: boolean;
  minSelect: number | null;
  maxSelect: number | null;
  /** Cuando es true, la pregunta se repite por cada área evaluada. */
  perArea: boolean;
  maxLength: number | null;
  options: QuestionOption[];
}

export interface SurveyComponent {
  id: number;
  code: string;
  title: string;
  intro: string | null;
  questions: Question[];
}

export interface SurveySchema {
  campaign: { id: string; name: string; isOpen: boolean };
  areas: Area[];
  components: SurveyComponent[];
  settings: {
    maxAreasInteraccion: number;
    requireIdentity: boolean;
  };
}

/** El centinela que el back usa para las respuestas globales. */
export const GLOBAL_AREA_CODE = '__GLOBAL__';

/** Códigos de pregunta con significado especial para el flujo del wizard. */
export const OWN_AREA_QUESTION = 'c1_area_propia';
export const PIVOT_QUESTION = 'c1_areas_interaccion';
export const OTHER_OPTION_VALUES = ['OTRA', 'OTRO'];

/**
 * Valor de una respuesta. La variante discriminada evita el clásico bug de tratar un 0
 * como "sin responder": `{ kind: 'number', value: 0 }` es una respuesta real.
 */
export type AnswerValue =
  | { kind: 'option'; value: string; otherText?: string }
  | { kind: 'options'; values: string[]; otherText?: string }
  | { kind: 'number'; value: number }
  | { kind: 'text'; value: string };

/** Clave plana de react-hook-form; replica la unicidad de la tabla `answers`. */
export function fieldName(questionCode: string, targetArea = GLOBAL_AREA_CODE): string {
  return `${questionCode}__${targetArea}`;
}

export function parseFieldName(name: string): { questionCode: string; targetArea: string } {
  const [questionCode, targetArea] = name.split('__');
  return { questionCode, targetArea: targetArea || GLOBAL_AREA_CODE };
}

// ---------- payloads de la API de respuestas ----------

export interface StartResponseResult {
  responseId: string;
  draftToken: string;
  startedAt: string;
}

export interface StoredAnswer {
  questionCode: string;
  targetArea: string;
  valueNumber: number | null;
  valueOption: string | null;
  valueOptions: string[];
  valueText: string | null;
}

export interface DraftResult {
  responseId: string;
  status: 'DRAFT' | 'COMPLETED';
  lastStep: number;
  respondentName: string | null;
  respondentRole: string | null;
  answers: StoredAnswer[];
}

export interface AnswerPayload {
  questionCode: string;
  targetArea?: string;
  valueNumber?: number | null;
  valueOption?: string | null;
  valueOptions?: string[] | null;
  valueText?: string | null;
}

export interface RuleViolation {
  questionCode: string;
  targetArea?: string;
  message: string;
}

export interface MissingItem {
  questionCode: string;
  componentId: number;
  targetArea?: string;
}
