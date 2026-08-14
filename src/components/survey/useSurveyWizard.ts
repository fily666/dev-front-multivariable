'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { ApiError } from '@/lib/api';
import {
  clearDraftPointer,
  readDraftPointer,
  saveDraftPointer,
} from '@/lib/draft-storage';
import {
  fromStored,
  getDraft,
  getSchema,
  saveStep,
  startResponse,
  submitSurvey,
  toPayload,
} from '@/lib/survey-client';
import { validateStep } from '@/lib/zod-schema-builder';
import {
  fieldName,
  type AnswerValue,
  type MissingItem,
  type RuleViolation,
  type SurveySchema,
} from '@/lib/survey-schema.types';
import {
  PIVOT_KEY,
  buildSteps,
  questionsForStep,
  resolveEvaluableAreas,
  type WizardStep,
} from './wizard-steps';

/** Minutos que el instrumento declara para diligenciarse completo. */
const TARGET_MINUTES = 15;

type Answers = Record<string, AnswerValue | undefined>;

export interface WizardState {
  schema: SurveySchema | null;
  loading: boolean;
  loadError: string | null;
  resumable: boolean;
  started: boolean;
  steps: WizardStep[];
  stepIndex: number;
  answers: Answers;
  errors: Record<string, string>;
  stepError: string | null;
  busy: boolean;
  submitted: boolean;
  remainingMinutes: number | null;
  identity: { respondentName: string; respondentRole: string };
}

export function useSurveyWizard() {
  const [schema, setSchema] = useState<SurveySchema | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [draftToken, setDraftToken] = useState<string | null>(null);
  const [resumable, setResumable] = useState(false);
  const [started, setStarted] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);
  const [answers, setAnswers] = useState<Answers>({});
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [stepError, setStepError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const [identity, setIdentity] = useState({ respondentName: '', respondentRole: '' });

  /** Duración de los pasos ya completados, para estimar lo que falta. */
  const [stepDurations, setStepDurations] = useState<number[]>([]);
  const stepStartedAt = useRef<number>(0);

  useEffect(() => {
    stepStartedAt.current = Date.now();
  }, [stepIndex]);

  useEffect(() => {
    let cancelled = false;

    void (async () => {
      try {
        const loaded = await getSchema();
        if (cancelled) return;
        setSchema(loaded);
        setResumable(readDraftPointer() !== null);
      } catch (error) {
        if (cancelled) return;
        setLoadError(
          error instanceof ApiError
            ? error.message
            : 'No pudimos cargar la encuesta. Intente de nuevo en unos minutos.',
        );
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  const evaluableAreas = useMemo(() => {
    const pivot = answers[PIVOT_KEY];
    const selected = pivot?.kind === 'options' ? pivot.values : undefined;
    return resolveEvaluableAreas(schema?.areas ?? [], selected);
  }, [answers, schema]);

  const steps = useMemo(
    () => (schema ? buildSteps(schema, evaluableAreas.map((area) => area.code)) : []),
    [schema, evaluableAreas],
  );

  const currentStep = steps[stepIndex] as WizardStep | undefined;

  const currentComponent = useMemo(() => {
    if (!schema || currentStep?.kind !== 'component') return null;
    return schema.components.find((component) => component.id === currentStep.componentId) ?? null;
  }, [schema, currentStep]);

  const currentEntries = useMemo(() => {
    if (!currentComponent || currentStep?.kind !== 'component') return [];
    return questionsForStep(currentComponent, currentStep, evaluableAreas);
  }, [currentComponent, currentStep, evaluableAreas]);

  /**
   * Minutos restantes con el ritmo real del encuestado. Antes de tener dos pasos medidos
   * se extrapola desde los 15 minutos que declara el instrumento, para no mostrar una
   * estimación errática al principio.
   */
  const remainingMinutes = useMemo(() => {
    if (steps.length === 0) return null;
    const remaining = steps.length - stepIndex - 1;
    if (remaining <= 0) return 0;

    const perStepMs =
      stepDurations.length >= 2
        ? stepDurations.reduce((sum, ms) => sum + ms, 0) / stepDurations.length
        : (TARGET_MINUTES * 60_000) / steps.length;

    return Math.max(1, Math.round((remaining * perStepMs) / 60_000));
  }, [steps.length, stepIndex, stepDurations]);

  const setAnswer = useCallback((key: string, value: AnswerValue) => {
    setAnswers((previous) => ({ ...previous, [key]: value }));
    setErrors((previous) => {
      if (!previous[key]) return previous;
      const next = { ...previous };
      delete next[key];
      return next;
    });
  }, []);

  /** Abre un borrador nuevo. */
  const begin = useCallback(async () => {
    setBusy(true);
    setStepError(null);
    try {
      const { draftToken: token } = await startResponse();
      setDraftToken(token);
      saveDraftPointer(token, 0);
      setStarted(true);
      setStepIndex(1);
    } catch (error) {
      setStepError(
        error instanceof ApiError
          ? error.message
          : 'No pudimos iniciar la encuesta. Intente de nuevo.',
      );
    } finally {
      setBusy(false);
    }
  }, []);

  /** Retoma el borrador guardado en este navegador. */
  const resume = useCallback(async () => {
    const pointer = readDraftPointer();
    if (!pointer || !schema) return;

    setBusy(true);
    setStepError(null);
    try {
      const draft = await getDraft(pointer.draftToken);
      if (draft.status === 'COMPLETED') {
        clearDraftPointer();
        setSubmitted(true);
        return;
      }

      const questionByCode = new Map(
        schema.components.flatMap((component) =>
          component.questions.map((question) => [question.code, question] as const),
        ),
      );

      const restored: Answers = {};
      for (const stored of draft.answers) {
        const question = questionByCode.get(stored.questionCode);
        if (!question) continue;
        const value = fromStored(question, stored);
        if (value !== undefined) {
          restored[fieldName(stored.questionCode, stored.targetArea)] = value;
        }
      }

      setDraftToken(pointer.draftToken);
      setAnswers(restored);
      setIdentity({
        respondentName: draft.respondentName ?? '',
        respondentRole: draft.respondentRole ?? '',
      });
      setStarted(true);
      // `lastStep` es el id del último componente guardado; el paso siguiente arranca ahí.
      setStepIndex(Math.max(1, draft.lastStep));
    } catch (error) {
      // Un borrador que ya no existe en el servidor no debe bloquear el arranque.
      clearDraftPointer();
      setResumable(false);
      setStepError(
        error instanceof ApiError
          ? 'No encontramos su borrador anterior. Puede empezar de nuevo.'
          : 'No pudimos recuperar su borrador.',
      );
    } finally {
      setBusy(false);
    }
  }, [schema]);

  const goBack = useCallback(() => {
    setStepError(null);
    setErrors({});
    setStepIndex((index) => Math.max(0, index - 1));
  }, []);

  const goToComponent = useCallback(
    (componentId: number) => {
      const target = steps.findIndex(
        (step) => step.kind === 'component' && step.componentId === componentId,
      );
      if (target >= 0) {
        setStepIndex(target);
        setStepError(null);
      }
    },
    [steps],
  );

  /** Cierra la encuesta. Si faltan respuestas, lleva al paso del primer componente incompleto. */
  const finish = useCallback(async () => {
    if (!draftToken) return;

    setBusy(true);
    setStepError(null);
    try {
      await submitSurvey(draftToken);
      clearDraftPointer();
      setSubmitted(true);
    } catch (error) {
      if (error instanceof ApiError && error.isValidationError) {
        const body = error.body as { missing?: MissingItem[] } | undefined;
        const missing = body?.missing ?? [];
        if (missing.length > 0) {
          const fieldErrors: Record<string, string> = {};
          for (const item of missing) {
            fieldErrors[fieldName(item.questionCode, item.targetArea)] =
              'Esta pregunta es obligatoria.';
          }
          setErrors(fieldErrors);
          goToComponent(missing[0].componentId);
          setStepError('Faltan respuestas obligatorias en este componente.');
          return;
        }
      }
      setStepError(
        error instanceof ApiError ? error.message : 'No pudimos enviar la encuesta.',
      );
    } finally {
      setBusy(false);
    }
  }, [draftToken, goToComponent]);

  /** Valida el paso, lo guarda y avanza. */
  const goNext = useCallback(async () => {
    if (!schema || !currentStep) return;

    if (currentStep.kind === 'welcome') {
      if (schema.settings.requireIdentity && identity.respondentName.trim().length === 0) {
        setStepError('El nombre es obligatorio en esta campaña.');
        return;
      }
      setStepIndex((index) => index + 1);
      return;
    }

    if (currentStep.kind === 'review') {
      await finish();
      return;
    }

    const validationErrors = validateStep(
      currentEntries.map((entry) => ({
        question: entry.question,
        targetArea: entry.targetArea,
        value: answers[fieldName(entry.question.code, entry.targetArea)],
      })),
    );

    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      setStepError('Revise las respuestas señaladas antes de continuar.');
      return;
    }

    if (!draftToken) {
      setStepError('La sesión de la encuesta se perdió. Recargue la página.');
      return;
    }

    setBusy(true);
    setStepError(null);
    try {
      const payloads = currentEntries.map((entry) =>
        toPayload(
          entry.question,
          answers[fieldName(entry.question.code, entry.targetArea)],
          entry.targetArea,
        ),
      );

      await saveStep(draftToken, currentStep.componentId, payloads, {
        respondentName: identity.respondentName || undefined,
        respondentRole: identity.respondentRole || undefined,
      });

      saveDraftPointer(draftToken, currentStep.componentId);
      const elapsed = Date.now() - stepStartedAt.current;
      setStepDurations((previous) => [...previous, elapsed]);
      setErrors({});
      setStepIndex((index) => index + 1);
    } catch (error) {
      applyServerErrors(error, setErrors, setStepError);
    } finally {
      setBusy(false);
    }
  }, [schema, currentStep, currentEntries, answers, draftToken, identity, finish]);


  return {
    state: {
      schema,
      loading,
      loadError,
      resumable,
      started,
      steps,
      stepIndex,
      answers,
      errors,
      stepError,
      busy,
      submitted,
      remainingMinutes,
      identity,
    } satisfies WizardState,
    currentStep,
    currentComponent,
    currentEntries,
    evaluableAreas,
    actions: { begin, resume, goBack, goNext, goToComponent, setAnswer, setIdentity, finish },
  };
}

/** Traduce un 422 del servidor a errores por campo. */
function applyServerErrors(
  error: unknown,
  setErrors: (errors: Record<string, string>) => void,
  setStepError: (message: string) => void,
) {
  if (error instanceof ApiError && error.isValidationError) {
    const body = error.body as { violations?: RuleViolation[] } | undefined;
    const violations = body?.violations ?? [];
    if (violations.length > 0) {
      const fieldErrors: Record<string, string> = {};
      for (const violation of violations) {
        fieldErrors[fieldName(violation.questionCode, violation.targetArea)] =
          violation.message;
      }
      setErrors(fieldErrors);
      setStepError('Revise las respuestas señaladas.');
      return;
    }
  }

  setStepError(
    error instanceof ApiError
      ? error.message
      : 'No pudimos guardar sus respuestas. Revise su conexión e intente de nuevo.',
  );
}
