'use client';

import { useId } from 'react';
import type { FieldProps } from './field.types';

export function SingleChoiceField({
  question,
  value,
  onChange,
  error,
  disabled,
}: FieldProps) {
  const groupId = useId();
  const selected = value?.kind === 'option' ? value.value : null;
  const otherText = value?.kind === 'option' ? (value.otherText ?? '') : '';
  const selectedOption = question.options.find((option) => option.value === selected);

  return (
    <div className="flex flex-col gap-2">
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        aria-invalid={error ? true : undefined}
        className="flex flex-col gap-2"
      >
        {question.options.map((option) => {
          const isSelected = selected === option.value;
          return (
            <button
              key={option.value}
              type="button"
              role="radio"
              aria-checked={isSelected}
              disabled={disabled}
              onClick={() =>
                onChange({
                  kind: 'option',
                  value: option.value,
                  // Cambiar de opción descarta el texto de "Otra": conservarlo dejaría un
                  // valor colgado que el servidor rechazaría al guardar.
                  otherText: option.allowsText ? otherText : undefined,
                })
              }
              className={[
                'flex items-center gap-3 rounded-lg border px-4 py-3 text-left text-sm transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'border-brand bg-brand-subtle text-foreground'
                  : 'border-border-subtle bg-surface text-foreground hover:border-brand',
              ].join(' ')}
            >
              <span
                aria-hidden
                className={[
                  'flex h-4 w-4 shrink-0 items-center justify-center rounded-full border-2',
                  isSelected ? 'border-brand' : 'border-border-strong',
                ].join(' ')}
              >
                {isSelected && <span className="h-2 w-2 rounded-full bg-brand" />}
              </span>
              {option.label}
            </button>
          );
        })}
      </div>

      {selectedOption?.allowsText && (
        <input
          type="text"
          value={otherText}
          maxLength={200}
          disabled={disabled}
          placeholder="Indique cuál"
          aria-label={`Especifique: ${selectedOption.label}`}
          onChange={(event) =>
            onChange({
              kind: 'option',
              value: selectedOption.value,
              otherText: event.target.value,
            })
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
