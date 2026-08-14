'use client';

import type { ReactNode } from 'react';

interface StepShellProps {
  title: string;
  /** Texto introductorio del componente, literal del instrumento. */
  intro?: string | null;
  /** Progreso secundario dentro del paso, p. ej. "Área 2 de 4". */
  subProgress?: string;
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
  subProgress,
  children,
  onBack,
  onNext,
  nextLabel = 'Continuar',
  backLabel = 'Atrás',
  busy,
  error,
}: StepShellProps) {
  return (
    <section className="flex flex-col gap-6" aria-labelledby="step-title">
      <header className="flex flex-col gap-2">
        {subProgress && (
          <p className="text-xs font-medium uppercase tracking-wide text-brand">
            {subProgress}
          </p>
        )}
        <h2 id="step-title" className="text-xl font-semibold text-foreground sm:text-2xl">
          {title}
        </h2>
        {intro && <p className="text-sm leading-relaxed text-foreground-muted">{intro}</p>}
      </header>

      <div className="flex flex-col gap-7">{children}</div>

      {error && (
        <p role="alert" className="rounded-lg bg-danger-subtle px-4 py-3 text-sm text-danger">
          {error}
        </p>
      )}

      <footer className="flex items-center justify-between gap-3 border-t border-border-subtle pt-5">
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
          className="rounded-lg bg-brand px-6 py-2.5 text-sm font-semibold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? 'Guardando…' : nextLabel}
        </button>
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
