import type { ThresholdBand } from '@/lib/admin.types';
import { classify, formatIndex } from '@/lib/score-scale';
import { EmptyState } from './InsufficientData';

export interface BarRow {
  key: string;
  label: string;
  value: number | null;
  /** Texto secundario, p. ej. el número de respuestas que sostienen la fila. */
  hint?: string;
}

interface Props {
  rows: BarRow[];
  /** Presente cuando los valores son índices 0-100 y llevan banda semafórica. */
  bands?: ThresholdBand[];
  /** Máximo del eje. Fijo en 100 para índices; calculado para conteos. */
  max?: number;
  emptyMessage?: string;
  /** Sufijo del valor, p. ej. "%" para porcentajes. */
  suffix?: string;
  href?: (row: BarRow) => string;
}

/**
 * Barras horizontales.
 *
 * Se eligen horizontales porque las etiquetas son nombres de área y de opción: en vertical
 * habría que rotarlas o truncarlas, y el nombre es justo lo que el lector necesita.
 */
export function BarRanking({ rows, bands, max, emptyMessage, suffix, href }: Props) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin datos para mostrar.'} />;
  }

  const ceiling =
    max ?? Math.max(...rows.map((row) => row.value ?? 0), 1);

  return (
    <ul className="flex flex-col gap-3">
      {rows.map((row) => {
        const band = bands ? classify(row.value, bands) : null;
        const width = row.value === null ? 0 : Math.max((row.value / ceiling) * 100, 1.5);
        const label = (
          <span className="text-sm text-foreground">{row.label}</span>
        );

        return (
          <li key={row.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              {href ? (
                <a href={href(row)} className="text-sm text-brand hover:underline">
                  {row.label}
                </a>
              ) : (
                label
              )}
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatIndex(row.value, suffix === '%' ? 1 : 0)}
                  {suffix}
                </span>
                {band && <span className="text-xs text-foreground-muted">{band.label}</span>}
              </span>
            </div>

            <div className="h-2 w-full overflow-hidden rounded-full bg-surface-muted">
              {/* Extremo redondeado de 4px anclado a la línea base, como el resto de las
                  marcas del panel. */}
              <div
                className="h-full rounded-full"
                style={{
                  width: `${width}%`,
                  backgroundColor: band?.color ?? 'var(--brand-accent)',
                }}
              />
            </div>

            {row.hint && <p className="text-xs text-foreground-muted">{row.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}
