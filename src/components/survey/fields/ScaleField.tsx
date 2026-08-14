'use client';

import { useId } from 'react';
import { fieldId, type FieldProps } from './field.types';

const VALUES = Array.from({ length: 11 }, (_, index) => index);

/**
 * Escala 0-10 como botones segmentados.
 *
 * No es un slider ni un `<select>`: en móvil un slider hace que dar exactamente un 7 sea
 * un ejercicio de puntería, y un select esconde la escala tras un toque. Los botones dejan
 * las once opciones a la vista y son un objetivo táctil grande.
 *
 * El grupo es un `radiogroup` real, así que las flechas del teclado lo recorren y un lector
 * de pantalla anuncia "3 de 11". Las anclas "muy deficiente"/"excelente" quedan visibles
 * porque sin ellas el número pierde significado.
 */
export function ScaleField({
  question,
  value,
  onChange,
  areaContext,
  error,
  disabled,
  compact,
}: FieldProps) {
  const groupId = useId();
  const selected = value?.kind === 'number' ? value.value : null;
  const describedBy = error ? `${groupId}-error` : undefined;

  return (
    <div className={compact ? 'flex flex-col gap-1.5' : 'flex flex-col gap-2'}>
      <div
        role="radiogroup"
        aria-labelledby={`${groupId}-label`}
        aria-describedby={describedBy}
        aria-invalid={error ? true : undefined}
        className="grid grid-cols-6 gap-1.5 sm:grid-cols-11"
      >
        {VALUES.map((option) => {
          const isSelected = selected === option;
          return (
            <button
              key={option}
              type="button"
              role="radio"
              aria-checked={isSelected}
              aria-label={`${option} de 10`}
              disabled={disabled}
              onClick={() => onChange({ kind: 'number', value: option })}
              id={`${fieldId(question, areaContext?.code)}-${option}`}
              className={[
                'rounded-md border py-2 text-sm font-medium transition-colors',
                'disabled:cursor-not-allowed disabled:opacity-50',
                isSelected
                  ? 'border-brand bg-brand text-white'
                  : 'border-border-subtle bg-surface text-foreground hover:border-brand hover:bg-brand-subtle',
              ].join(' ')}
            >
              {option}
            </button>
          );
        })}
      </div>

      <div className="flex justify-between text-xs text-foreground-muted">
        <span>0 · muy deficiente</span>
        <span>10 · excelente</span>
      </div>

      {error && (
        <p id={`${groupId}-error`} role="alert" className="text-sm text-danger">
          {error}
        </p>
      )}
    </div>
  );
}
