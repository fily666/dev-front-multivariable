'use client';

import { fieldName, type AnswerValue, type Question } from '@/lib/survey-schema.types';
import { QuestionRenderer } from './QuestionRenderer';
import { QuestionBlock } from './StepShell';

export interface StepEntry {
  question: Question;
  targetArea: string;
  areaName?: string;
}

interface ComponentStepProps {
  entries: StepEntry[];
  answers: Record<string, AnswerValue | undefined>;
  errors: Record<string, string>;
  onChange: (key: string, value: AnswerValue) => void;
  disabled?: boolean;
}

/**
 * Un componente por pantalla. El instrumento nunca pone más de cinco ítems por componente,
 * que es justo el techo que sostiene la sensación de avance del wizard.
 */
export function ComponentStep({
  entries,
  answers,
  errors,
  onChange,
  disabled,
}: ComponentStepProps) {
  return (
    <>
      {entries.map(({ question, targetArea, areaName }) => {
        const key = fieldName(question.code, targetArea);
        return (
          <QuestionBlock
            key={key}
            label={question.label}
            helpText={question.helpText}
            required={question.required}
          >
            <QuestionRenderer
              question={question}
              value={answers[key]}
              error={errors[key]}
              disabled={disabled}
              areaContext={areaName ? { code: targetArea, name: areaName } : undefined}
              onChange={(value) => onChange(key, value)}
            />
          </QuestionBlock>
        );
      })}
    </>
  );
}

/**
 * Componente 9: una fila compacta por área evaluada.
 *
 * Se agrupa por pregunta y no por área para que el encuestado califique lo mismo varias
 * veces seguidas: comparar áreas entre sí es más fácil que recordar el criterio al saltar
 * de pregunta en pregunta.
 */
export function ComponentStepPerAreaList({
  entries,
  answers,
  errors,
  onChange,
  disabled,
}: ComponentStepProps) {
  const grouped = new Map<string, StepEntry[]>();
  for (const entry of entries) {
    const group = grouped.get(entry.question.code);
    if (group) group.push(entry);
    else grouped.set(entry.question.code, [entry]);
  }

  return (
    <>
      {[...grouped.values()].map((group) => {
        const { question } = group[0];
        const isPerArea = question.perArea;

        return (
          <QuestionBlock
            key={question.code}
            label={question.label}
            helpText={question.helpText}
            required={question.required}
          >
            {isPerArea ? (
              <div className="flex flex-col gap-5">
                {group.map(({ targetArea, areaName }) => {
                  const key = fieldName(question.code, targetArea);
                  return (
                    <div key={key} className="flex flex-col gap-2">
                      <p className="text-sm font-medium text-brand">{areaName ?? targetArea}</p>
                      <QuestionRenderer
                        compact
                        question={question}
                        value={answers[key]}
                        error={errors[key]}
                        disabled={disabled}
                        areaContext={{ code: targetArea, name: areaName ?? targetArea }}
                        onChange={(value) => onChange(key, value)}
                      />
                    </div>
                  );
                })}
              </div>
            ) : (
              <QuestionRenderer
                question={question}
                value={answers[fieldName(question.code, group[0].targetArea)]}
                error={errors[fieldName(question.code, group[0].targetArea)]}
                disabled={disabled}
                onChange={(value) =>
                  onChange(fieldName(question.code, group[0].targetArea), value)
                }
              />
            )}
          </QuestionBlock>
        );
      })}
    </>
  );
}
