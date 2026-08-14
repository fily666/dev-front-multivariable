'use client';

import {
  GLOBAL_AREA_CODE,
  fieldName,
  type AnswerValue,
  type SurveySchema,
} from '@/lib/survey-schema.types';
import { QuestionRenderer } from './QuestionRenderer';
import { layoutOf } from './wizard-steps';

interface ReviewStepProps {
  schema: SurveySchema;
  answers: Record<string, AnswerValue | undefined>;
  evaluableAreas: { code: string; name: string }[];
  onEdit: (componentId: number) => void;
}

/**
 * Resumen antes de enviar. Reutiliza el mismo `QuestionRenderer` en modo lectura en vez de
 * recorrer el catálogo con su propia lógica de presentación, para que lo que el encuestado
 * revisa sea exactamente lo que respondió.
 */
export function ReviewStep({ schema, answers, evaluableAreas, onEdit }: ReviewStepProps) {
  return (
    <div className="flex flex-col gap-6">
      <p className="text-sm text-foreground-muted">
        Revise sus respuestas antes de enviar. Puede volver a cualquier componente para
        modificarlas.
      </p>

      {schema.components.map((component) => {
        const perArea = layoutOf(component) !== 'simple';

        return (
          <section
            key={component.id}
            className="rounded-lg border border-border-subtle bg-surface p-4"
          >
            <header className="mb-3 flex items-start justify-between gap-3">
              <h3 className="text-sm font-semibold text-foreground">
                {component.id}. {component.title}
              </h3>
              <button
                type="button"
                onClick={() => onEdit(component.id)}
                className="shrink-0 text-xs font-medium text-brand hover:underline"
              >
                Editar
              </button>
            </header>

            <dl className="flex flex-col gap-3">
              {component.questions.map((question) => {
                const targets =
                  question.perArea && perArea
                    ? evaluableAreas
                    : [{ code: GLOBAL_AREA_CODE, name: '' }];

                return targets.map((target) => {
                  const key = fieldName(question.code, target.code);
                  return (
                    <div
                      key={key}
                      className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3"
                    >
                      <dt className="text-xs text-foreground-muted sm:w-1/2 sm:shrink-0">
                        {question.label}
                        {target.name && <span className="text-brand"> · {target.name}</span>}
                      </dt>
                      <dd>
                        <QuestionRenderer
                          mode="review"
                          question={question}
                          value={answers[key]}
                          onChange={() => undefined}
                        />
                      </dd>
                    </div>
                  );
                });
              })}
            </dl>
          </section>
        );
      })}
    </div>
  );
}
