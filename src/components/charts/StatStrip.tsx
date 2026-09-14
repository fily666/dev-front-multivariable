import type { ReactNode } from 'react';

/**
 * Tira de cifras sueltas: participación, finalización, duración.
 *
 * No son KPI de negocio sino la ficha técnica del corte — qué tan en serio se puede tomar
 * lo que se está leyendo. Van juntas y en pequeño a propósito: si compitieran en tamaño
 * con el índice principal, el lector no sabría cuál es el titular.
 */
export function StatStrip({
  items,
}: {
  items: { label: string; value: string; hint?: ReactNode }[];
}) {
  return (
    <dl className="grid grid-cols-2 gap-x-6 gap-y-4 sm:grid-cols-4">
      {items.map((item) => (
        <div key={item.label} className="flex flex-col gap-0.5">
          <dt className="text-[11px] uppercase tracking-wide text-foreground-muted">
            {item.label}
          </dt>
          <dd className="text-xl font-bold text-foreground">{item.value}</dd>
          {item.hint && <p className="text-xs text-foreground-muted">{item.hint}</p>}
        </div>
      ))}
    </dl>
  );
}
