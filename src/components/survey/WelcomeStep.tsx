'use client';

import { LinkticLogo } from '@/components/brand/Logo';
import type { SurveySchema } from '@/lib/survey-schema.types';

interface WelcomeStepProps {
  schema: SurveySchema;
  identity: { respondentName: string; respondentRole: string };
  onIdentityChange: (identity: { respondentName: string; respondentRole: string }) => void;
  onStart: () => void;
  busy?: boolean;
  error?: string | null;
}

const RESPONSE_TYPES = [
  ['Selección única', 'Marque solo una opción.'],
  ['Selección múltiple', 'Marque una o varias opciones, según la instrucción.'],
  ['Escala 0 a 10', 'Seleccione el número que mejor represente su percepción.'],
];

export function WelcomeStep({
  schema,
  identity,
  onIdentityChange,
  onStart,
  busy,
  error,
}: WelcomeStepProps) {
  const requireIdentity = schema.settings.requireIdentity;

  return (
    <section className="flex flex-col gap-7" aria-labelledby="welcome-title">
      <header className="flex flex-col gap-3">
        <LinkticLogo width={200} priority className="mb-3" />
        <p className="text-xs font-medium uppercase tracking-wide text-brand">
          Encuesta interna de percepción organizacional
        </p>
        <h1 id="welcome-title" className="text-2xl text-foreground sm:text-3xl">
          Instrumento de Diagnóstico Organizacional
        </h1>
        <p className="text-sm leading-relaxed text-foreground-muted">
          Este instrumento tiene como propósito comprender la forma en que interactúan las
          áreas de la organización, identificar fortalezas y oportunidades de mejora en la
          colaboración interna, y generar información estratégica para fortalecer la
          capacidad de respuesta, la integración de procesos y la cultura de servicio.
        </p>
      </header>

      <div className="rounded-lg bg-brand-subtle px-4 py-3">
        <p className="text-sm text-foreground">
          La información recopilada será utilizada exclusivamente con fines de mejora
          organizacional y fortalecimiento institucional.
        </p>
      </div>

      <dl className="grid gap-4 sm:grid-cols-2">
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">
            Tiempo estimado
          </dt>
          <dd className="text-sm text-foreground">15 minutos</dd>
        </div>
        <div>
          <dt className="text-xs uppercase tracking-wide text-foreground-muted">Componentes</dt>
          <dd className="text-sm text-foreground">
            {schema.components.length}, uno por pantalla
          </dd>
        </div>
      </dl>

      <div className="flex flex-col gap-3">
        <h2 className="text-sm text-foreground">Instrucciones generales</h2>
        <p className="text-sm text-foreground-muted">
          Marque una sola opción en las preguntas de selección única, marque las opciones que
          correspondan en las preguntas de selección múltiple y califique de 0 a 10 los
          aspectos solicitados, donde 0 significa muy deficiente y 10 significa excelente.
        </p>
        <ul className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-muted p-4">
          {RESPONSE_TYPES.map(([type, use]) => (
            <li key={type} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3">
              <span className="font-medium text-foreground sm:w-40 sm:shrink-0">{type}</span>
              <span className="text-foreground-muted">{use}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex flex-col gap-4 border-t border-border-subtle pt-6">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm text-foreground">
            Identificación {requireIdentity ? '' : '(opcional)'}
          </h2>
          {!requireIdentity && (
            <p className="text-xs text-foreground-muted">
              La encuesta es anónima. Puede dejar estos campos vacíos y sus respuestas se
              registrarán igual.
            </p>
          )}
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground">Nombre</span>
            <input
              type="text"
              maxLength={120}
              value={identity.respondentName}
              onChange={(event) =>
                onIdentityChange({ ...identity, respondentName: event.target.value })
              }
              className="rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-foreground"
            />
          </label>
          <label className="flex flex-col gap-1.5 text-sm">
            <span className="text-foreground">Cargo</span>
            <input
              type="text"
              maxLength={120}
              value={identity.respondentRole}
              onChange={(event) =>
                onIdentityChange({ ...identity, respondentRole: event.target.value })
              }
              className="rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-foreground"
            />
          </label>
        </div>
      </div>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-subtle px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={onStart}
        disabled={busy}
        className="self-start rounded-lg bg-brand px-6 py-3 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
      >
        {busy ? 'Preparando…' : 'Comenzar la encuesta'}
      </button>
    </section>
  );
}
