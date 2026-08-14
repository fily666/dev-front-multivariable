import type { AnswerValue, Question } from '@/lib/survey-schema.types';

export interface FieldProps {
  question: Question;
  value: AnswerValue | undefined;
  onChange: (value: AnswerValue) => void;
  /** Presente cuando la pregunta se responde por área evaluada. */
  areaContext?: { code: string; name: string };
  error?: string;
  disabled?: boolean;
  /** Variante compacta: una fila por área, para el NPS del componente 9. */
  compact?: boolean;
}

/** Identificador estable del campo, para `htmlFor` y `aria-describedby`. */
export function fieldId(question: Question, areaCode?: string): string {
  return areaCode ? `${question.code}--${areaCode}` : question.code;
}
