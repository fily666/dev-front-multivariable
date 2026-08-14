import type { DistributionRow } from '@/lib/admin.types';
import { EmptyState } from './InsufficientData';

/**
 * Distribución ordinal, p. ej. los tramos de tiempo de respuesta.
 *
 * Conserva el orden natural de la escala y muestra los tramos con cero: un hueco en la
 * distribución es información, y reordenar por frecuencia perdería la secuencia temporal.
 */
export function StackedBars({ rows, emptyMessage }: { rows: DistributionRow[]; emptyMessage?: string }) {
  const total = rows.reduce((sum, row) => sum + row.count, 0);
  if (total === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin respuestas registradas.'} />;
  }

  return (
    <ul className="flex flex-col gap-2.5">
      {rows.map((row) => (
        <li key={row.value} className="flex items-center gap-3">
          <span className="w-32 shrink-0 text-xs text-foreground">{row.label}</span>
          <span className="h-2 flex-1 overflow-hidden rounded-full bg-surface-muted">
            <span
              className="block h-full rounded-full bg-brand"
              style={{ width: `${row.share}%` }}
            />
          </span>
          <span className="w-20 shrink-0 text-right text-xs tabular-nums text-foreground-muted">
            {row.count} · {row.share.toFixed(1)}%
          </span>
        </li>
      ))}
    </ul>
  );
}
