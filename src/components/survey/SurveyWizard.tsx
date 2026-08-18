'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { ComponentStep, ComponentStepPerAreaList } from './ComponentStep';
import { ProgressBar } from './ProgressBar';
import { ReviewStep } from './ReviewStep';
import { StepShell } from './StepShell';
import { WelcomeStep } from './WelcomeStep';
import { useSurveyWizard } from './useSurveyWizard';
import { layoutOf } from './wizard-steps';

export function SurveyWizard() {
  const router = useRouter();
  const { state, currentStep, currentComponent, currentEntries, evaluableAreas, actions } =
    useSurveyWizard();

  useEffect(() => {
    if (state.submitted) router.push('/gracias');
  }, [state.submitted, router]);

  // Al cambiar de paso el foco vuelve arriba: sin esto, en móvil el usuario queda a media
  // pantalla y no ve el encabezado del componente nuevo.
  useEffect(() => {
    if (typeof window !== 'undefined') window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [state.stepIndex]);

  if (state.loading) {
    return (
      <p className="py-16 text-center text-sm text-foreground-muted" role="status">
        Cargando la encuesta…
      </p>
    );
  }

  if (state.loadError || !state.schema) {
    return (
      <div className="py-16 text-center" role="alert">
        <p className="text-sm text-danger">{state.loadError}</p>
      </div>
    );
  }

  if (!state.started) {
    return (
      <div className="flex flex-col gap-6">
        {state.resumable && (
          <div className="flex flex-col gap-3 rounded-lg border border-brand bg-brand-subtle p-4 sm:flex-row sm:items-center sm:justify-between">
            <p className="text-sm text-foreground">
              Tiene una encuesta a medio diligenciar en este navegador.
            </p>
            <button
              type="button"
              onClick={() => void actions.resume()}
              disabled={state.busy}
              className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
            >
              Continuar donde quedé
            </button>
          </div>
        )}

        <WelcomeStep
          schema={state.schema}
          identity={state.identity}
          onIdentityChange={actions.setIdentity}
          onStart={() => void actions.begin()}
          busy={state.busy}
          error={state.stepError}
        />
      </div>
    );
  }

  const totalSteps = state.steps.length;

  return (
    <div className="flex flex-col gap-7">
      <ProgressBar
        current={state.stepIndex + 1}
        total={totalSteps}
        remainingMinutes={state.remainingMinutes}
      />

      {currentStep?.kind === 'welcome' && (
        <WelcomeStep
          schema={state.schema}
          identity={state.identity}
          onIdentityChange={actions.setIdentity}
          onStart={() => void actions.goNext()}
          busy={state.busy}
          error={state.stepError}
        />
      )}

      {currentStep?.kind === 'component' && currentComponent && (
        <StepShell
          title={`${currentComponent.id}. ${currentComponent.title}`}
          intro={currentComponent.intro}
          subProgress={
            currentStep.areaTotal && currentStep.areaTotal > 1
              ? `Evaluando ${evaluableAreas.find((area) => area.code === currentStep.areaCode)?.name ?? ''} · área ${currentStep.areaIndex} de ${currentStep.areaTotal}`
              : undefined
          }
          onBack={actions.goBack}
          onNext={() => void actions.goNext()}
          busy={state.busy}
          error={state.stepError}
        >
          {layoutOf(currentComponent) === 'list-per-area' ? (
            <ComponentStepPerAreaList
              entries={currentEntries}
              answers={state.answers}
              errors={state.errors}
              onChange={actions.setAnswer}
              disabled={state.busy}
            />
          ) : (
            <ComponentStep
              entries={currentEntries}
              answers={state.answers}
              errors={state.errors}
              onChange={actions.setAnswer}
              disabled={state.busy}
            />
          )}
        </StepShell>
      )}

      {currentStep?.kind === 'review' && (
        <StepShell
          title="Revise sus respuestas"
          onBack={actions.goBack}
          onNext={() => void actions.goNext()}
          nextLabel="Enviar la encuesta"
          busy={state.busy}
          error={state.stepError}
        >
          <ReviewStep
            schema={state.schema}
            answers={state.answers}
            evaluableAreas={evaluableAreas}
            onEdit={actions.goToComponent}
          />
        </StepShell>
      )}
    </div>
  );
}
