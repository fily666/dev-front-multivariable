'use client';

import { useMemo } from 'react';
import { LinkticLogo } from '@/components/brand/Logo';
import { PhaseRoadmap } from './PhaseRoadmap';
import type { Identity, SurveySchema } from '@/lib/survey-schema.types';

interface WelcomeStepProps {
  schema: SurveySchema;
  identity: Identity;
  onIdentityChange: (identity: Identity) => void;
  /** Errores por campo de la identificación (`ownArea`, `respondentRole`). */
  identityErrors?: Record<string, string>;
  onStart: () => void;
  busy?: boolean;
  error?: string | null;
}

const RESPONSE_TYPES = [
  ['Selección única', 'Marque solo una opción.'],
  ['Selección múltiple', 'Marque una o varias opciones, según la instrucción.'],
  ['Escala 0 a 10', 'Seleccione el número que mejor represente su percepción.'],
];

const SELECT_CLASS =
  'rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-foreground';

export function WelcomeStep({
  schema,
  identity,
  onIdentityChange,
  identityErrors = {},
  onStart,
  busy,
  error,
}: WelcomeStepProps) {
  /**
   * Las áreas se ofrecen agrupadas por gestión. Con 24 subprocesos, una lista plana
   * obliga a leerla entera para encontrar el propio; la gestión es la pista con la que
   * cada persona se ubica primero.
   */
  const areasPorGestion = useMemo(() => {
    const evaluables = schema.areas.filter((area) => area.isEvaluable);
    return schema.procesos
      .map((proceso) => ({
        proceso,
        areas: evaluables.filter((area) => area.procesoCode === proceso.code),
      }))
      .filter((grupo) => grupo.areas.length > 0);
  }, [schema.areas, schema.procesos]);

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
        <p className="max-w-prose text-sm leading-relaxed text-foreground-muted">
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

      <PhaseRoadmap />

      {/*
       * Instrucciones e identificación son dos cosas cortas y sin relación entre sí: una se
       * lee una vez y la otra se rellena. En PC van lado a lado para que «Empezar» entre en
       * la primera pantalla; apiladas, la bienvenida pide dos scrolls antes del botón.
       */}
      <div className="grid gap-7 lg:grid-cols-2 lg:items-start lg:gap-x-10">
        <div className="flex flex-col gap-3">
          <h2 className="text-sm text-foreground">Cómo se responde</h2>
          <ul className="flex flex-col gap-2 rounded-lg border border-border-subtle bg-surface-muted p-4">
            {RESPONSE_TYPES.map(([type, use]) => (
              <li key={type} className="flex flex-col gap-0.5 text-sm sm:flex-row sm:gap-3">
                <span className="font-medium text-foreground sm:w-40 sm:shrink-0">{type}</span>
                <span className="text-foreground-muted">{use}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="flex flex-col gap-4 border-t border-border-subtle pt-6 lg:border-t-0 lg:pt-0">
          <div className="flex flex-col gap-1">
            <h2 className="text-sm text-foreground">Identificación</h2>
            <p className="text-xs text-foreground-muted">
              La encuesta es anónima: no se pide su nombre. El área y el cargo son necesarios
              para leer los resultados por proceso y por nivel.
            </p>
          </div>

          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-1 xl:grid-cols-2">
            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground">¿A qué área pertenece?</span>
              <select
                value={identity.ownArea}
                disabled={busy}
                aria-invalid={identityErrors.ownArea ? true : undefined}
                onChange={(event) =>
                  onIdentityChange({ ...identity, ownArea: event.target.value })
                }
                className={SELECT_CLASS}
              >
                <option value="">Seleccione su área…</option>
                {areasPorGestion.map(({ proceso, areas }) => (
                  <optgroup key={proceso.code} label={proceso.name}>
                    {areas.map((area) => (
                      <option key={area.code} value={area.code}>
                        {area.name}
                      </option>
                    ))}
                  </optgroup>
                ))}
              </select>
              {identityErrors.ownArea && (
                <span role="alert" className="text-sm text-danger">
                  {identityErrors.ownArea}
                </span>
              )}
            </label>

            <label className="flex flex-col gap-1.5 text-sm">
              <span className="text-foreground">Cargo</span>
              <select
                value={identity.respondentRole}
                disabled={busy}
                aria-invalid={identityErrors.respondentRole ? true : undefined}
                onChange={(event) =>
                  onIdentityChange({ ...identity, respondentRole: event.target.value })
                }
                className={SELECT_CLASS}
              >
                <option value="">Seleccione su cargo…</option>
                {schema.roles.map((role) => (
                  <option key={role.value} value={role.value}>
                    {role.label}
                  </option>
                ))}
              </select>
              {identityErrors.respondentRole && (
                <span role="alert" className="text-sm text-danger">
                  {identityErrors.respondentRole}
                </span>
              )}
            </label>
          </div>
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
        {busy ? 'Preparando…' : 'Empezar el bloque 1'}
      </button>
    </section>
  );
}
