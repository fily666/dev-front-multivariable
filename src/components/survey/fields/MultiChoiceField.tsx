'use client';

import type { FieldProps } from './field.types';

export function MultiChoiceField({
  question,
  value,
  onChange,
  error,
  disabled,
}: FieldProps) {
  const selected = value?.kind === 'options' ? value.values : [];
  const otherText = value?.kind === 'options' ? (value.otherText ?? '') : '';

  const exclusiveValues = question.options
    .filter((option) => option.exclusive)
    .map((option) => option.value);

  const atLimit =
    question.maxSelect != null && selected.length >= question.maxSelect;

  function toggle(optionValue: string) {
    const isExclusive = exclusiveValues.includes(optionValue);
    const alreadySelected = selected.includes(optionValue);

    let next: string[];
    if (alreadySelected) {
      next = selected.filter((entry) => entry !== optionValue);
    } else if (isExclusive) {
      // Marcar la excluyente (p. ej. "Ninguna") reemplaza toda la selección: dejarla
      // conviviendo con otras produciría una respuesta contradictoria.
      next = [optionValue];
    } else {
      next = [...selected.filter((entry) => !exclusiveValues.includes(entry)), optionValue];
    }

    const stillNeedsText = question.options.some(
      (option) => option.allowsText && next.includes(option.value),
    );
    onChange({
      kind: 'options',
      values: next,
      otherText: stillNeedsText ? otherText : undefined,
    });
  }

  const textOption = question.options.find(
    (option) => option.allowsText && selected.includes(option.value),
  );

  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-col gap-2" aria-invalid={error ? true : undefined}>
        {question.options.map((option) => {
          const isSelected = selected.includes(option.value);
          // Al llegar al tope solo se pueden desmarcar opciones, no añadir más.
          const isBlocked =
            !isSelected && atLimit && !exclusiveValues.includes(option.value);

          return (
            <button
              key={option.value}
              type="button"
              role="checkbox"
              aria-checked={isSelected}
              disabled={disabled || isBlocked}
              onClick={() => toggle(option.value)}
              className={[
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-40',
                isSelected
                  ? 'border-brand bg-brand-subtle text-foreground'
                  : 'border-border-subtle bg-surface text-foreground hover:border-brand',
              ].join(' ')}
            >
              <span
                aria-hidden
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded border-2 text-white',
                  isSelected ? 'border-brand bg-brand' : 'border-border-strong',
                ].join(' ')}
              >
                {isSelected && (
                  <svg viewBox="0 0 12 12" className="h-3 w-3" fill="none" aria-hidden>
                    <path
                      d="M2.5 6.2 4.8 8.5 9.5 3.8"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      {question.maxSelect != null && (
        <p className="text-xs text-foreground-muted" aria-live="polite">
          {selected.length} de {question.maxSelect} seleccionadas
        </p>
      )}

      {textOption && (
        <input
          type="text"
          value={otherText}
          maxLength={200}
          disabled={disabled}
          placeholder="Indique cuál"
          aria-label={`Especifique: ${textOption.label}`}
          onChange={(event) =>
            onChange({ kind: 'options', values: selected, otherText: event.target.value })
          }
          className="rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-foreground placeholder:text-foreground-muted"
        />
      )}

      {error && (
        <p role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
