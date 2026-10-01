import type { DistributionRow } from '@/lib/admin.types';
import { EmptyState } from './InsufficientData';

const RAMP = [
  'var(--ramp-1)',
  'var(--ramp-2)',
  'var(--ramp-3)',
  'var(--ramp-4)',
  'var(--ramp-5)',
];

/**
 * Distribución sobre una escala ORDENADA, con el orden pintado en el color.
 *
 * El cumplimiento del ANS tiene orden natural (supera, cumple, parcial, no cumple), y
 * perderlo es perder el dato: lo que interesa no es qué opción gana sino hacia qué extremo
 * se inclina la masa. Por eso conserva el orden de la escala —nunca se reordena por
 * frecuencia— y muestra las opciones en cero, porque un hueco también es información.
 *
 * Un solo tono en pasos de luminancia, no cinco colores: las categorías están ordenadas,
 * así que el color debe mostrar esa secuencia. Cinco tonos distintos sugerirían que son
 * cosas independientes.
 *
 * `outOfScale` marca las opciones que no pertenecen a la escala ("No aplica"): van en gris
 * y no consumen un paso de la rampa, porque pintarlas con el tono más oscuro las leería
 * como el extremo peor.
 */
export function OrdinalBars({
  rows,
  emptyMessage,
  outOfScale = [],
}: {
  rows: DistributionRow[];
  emptyMessage?: string;
  outOfScale?: string[];
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin respuestas registradas.'} />;
  }

  const tope = Math.max(...rows.map((row) => row.share), 1);
  const scaled = rows.filter((row) => !outOfScale.includes(row.value));

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row) => (
        <li key={row.value} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-xs text-foreground">{row.label}</span>
          <span className="h-5 flex-1">
            <span
              className="block h-2.5 translate-y-[5px] rounded-sm transition-[width] duration-500"
              style={{
                width: `${Math.max((row.share / tope) * 100, row.share > 0 ? 1.5 : 0)}%`,
                backgroundColor: outOfScale.includes(row.value)
                  ? 'var(--border-strong)'
                  : RAMP[Math.min(scaled.indexOf(row), RAMP.length - 1)],
              }}
            />
          </span>
          <span className="w-24 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
            <span className="font-bold text-foreground">{row.share.toFixed(1)}%</span> ·{' '}
            {row.count}
          </span>
        </li>
      ))}
    </ul>
  );
}
