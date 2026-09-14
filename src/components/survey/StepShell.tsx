'use client';

import type { ReactNode } from 'react';
import { CheckIcon } from './PhaseIcon';

interface StepShellProps {
  title: string;
  /** Texto introductorio del componente, literal del instrumento. */
  intro?: string | null;
  /** La cinta o el hito del bloque. Va encima del título. */
  banner?: ReactNode;
  /** Progreso secundario dentro del paso, p. ej. "Área 2 de 4". */
  subProgress?: ReactNode;
  /** Cuántas preguntas del paso están respondidas. */
  answered?: { done: number; total: number };
  children: ReactNode;
  onBack?: () => void;
  onNext: () => void;
  nextLabel?: string;
  backLabel?: string;
  busy?: boolean;
  error?: string | null;
}

export function StepShell({
  title,
  intro,
  banner,
  subProgress,
  answered,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  busy,
  error,
}: StepShellProps) {
  const complete = answered ? answered.done >= answered.total : false;

  return (
    <section className="flex flex-col gap-6" aria-labelledby="step-title">
      {banner}

      <header className="flex flex-col gap-2">
        {/*
         * El título lleva el color del bloque. Es el elemento más grande de la pantalla,
         * así que es el que hace visible de un golpe que se cambió de terreno; el resto
         * del color (cinta, escala, botón) lo confirma.
         */}
        <h2 id="step-title" className="text-xl text-phase sm:text-2xl">
          {title}
        </h2>
        {intro && <p className="text-sm leading-relaxed text-foreground-muted">{intro}</p>}
      </header>

      {subProgress}

      <div className="flex flex-col gap-7">{children}</div>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-subtle px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      {/*
       * El pie queda pegado abajo: con cinco escalas de 0 a 10, en un móvil el botón de
       * continuar cae fuera de pantalla y hay que ir a buscarlo. Pegado, el siguiente paso
       * está siempre a un toque, y al lado se ve que lo respondido ya quedó guardado.
       */}
      <footer className="sticky bottom-0 -mx-5 flex flex-col gap-2.5 border-t border-border-subtle bg-background/92 px-5 pb-5 pt-3.5 backdrop-blur-sm sm:-mx-8 sm:px-8">
        <div className="flex items-center justify-between gap-3 text-xs text-foreground-muted">
          <span className="flex items-center gap-1.5">
            <CheckIcon size={12} className="shrink-0 text-phase" />
            Se guarda al continuar · puede cerrar y seguir después
          </span>
          {answered && answered.total > 0 && (
            <span className={complete ? 'font-medium text-phase' : undefined}>
              {answered.done} de {answered.total}
            </span>
          )}
        </div>

        <div className="flex items-center justify-between gap-3">
          {onBack ? (
            <button
              type="button"
              onClick={onBack}
              disabled={busy}
              className="rounded-lg px-4 py-2.5 text-sm font-medium text-foreground-muted hover:text-foreground disabled:opacity-50"
            >
              {backLabel}
            </button>
          ) : (
            <span />
          )}

          <button
            type="button"
            onClick={onNext}
            disabled={busy}
            className="rounded-lg bg-phase px-6 py-2.5 text-sm font-bold text-phase-on hover:bg-phase-hover disabled:opacity-60"
          >
            {busy ? 'Guardando…' : nextLabel}
          </button>
        </div>
      </footer>
    </section>
  );
}

/** Envuelve una pregunta con su etiqueta y su ayuda. */
export function QuestionBlock({
  label,
  helpText,
  required,
  children,
}: {
  label: string;
  helpText?: string | null;
  required?: boolean;
  children: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-col gap-1">
        <p className="text-sm font-medium text-foreground">
          {label}
          {!required && (
            <span className="ml-2 text-xs font-normal text-foreground-muted">(opcional)</span>
          )}
        </p>
        {helpText && <p className="text-xs text-foreground-muted">{helpText}</p>}
      </div>
      {children}
    </div>
  );
}
