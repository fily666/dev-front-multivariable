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
 * Los tramos de tiempo de respuesta tienen orden natural, y perderlo es perder el dato: lo
 * que interesa no es qué tramo gana sino hacia qué extremo se inclina la masa. Por eso
 * conserva el orden de la escala —nunca se reordena por frecuencia— y muestra los tramos
 * en cero, porque un hueco en la distribución también es información.
 *
 * Un solo tono en pasos de luminancia, no cinco colores: las categorías están ordenadas,
 * así que el color debe mostrar esa secuencia. Cinco tonos distintos sugerirían que son
 * cosas independientes.
 */
export function OrdinalBars({
  rows,
  emptyMessage,
}: {
  rows: DistributionRow[];
  emptyMessage?: string;
}) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin respuestas registradas.'} />;
  }

  const tope = Math.max(...rows.map((row) => row.share), 1);

  return (
    <ul className="flex flex-col gap-2">
      {rows.map((row, index) => (
        <li key={row.value} className="flex items-center gap-3">
          <span className="w-36 shrink-0 text-xs text-foreground">{row.label}</span>
          <span className="h-5 flex-1">
            <span
              className="block h-2.5 translate-y-[5px] rounded-sm transition-[width] duration-500"
              style={{
                width: `${Math.max((row.share / tope) * 100, row.share > 0 ? 1.5 : 0)}%`,
                backgroundColor: RAMP[Math.min(index, RAMP.length - 1)],
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
