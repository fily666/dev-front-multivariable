'use client';

import type { FieldProps } from './field.types';

export function TextField({ question, value, onChange, error, disabled }: FieldProps) {
  const text = value?.kind === 'text' ? value.value : '';
  const maxLength = question.maxLength ?? 1000;

  return (
    <div className="flex flex-col gap-1.5">
      <textarea
        rows={5}
        value={text}
        maxLength={maxLength}
        disabled={disabled}
        aria-invalid={error ? true : undefined}
        onChange={(event) => onChange({ kind: 'text', value: event.target.value })}
        className="resize-y rounded-lg border border-border-subtle bg-surface px-4 py-3 text-sm text-foreground placeholder:text-foreground-muted"
        placeholder="Escriba su respuesta"
      />
      <div className="flex justify-between text-xs text-foreground-muted">
        <span>{question.required ? '' : 'Opcional'}</span>
        <span aria-live="polite">
          {text.length} / {maxLength}
        </span>
      </div>
      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
