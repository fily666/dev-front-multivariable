import type { ThresholdBand } from '@/lib/admin.types';
import { classify, formatIndex } from '@/lib/score-scale';
import { EmptyState } from './InsufficientData';

export interface MeterRow {
  key: string;
  label: string;
  value: number | null;
  hint?: string;
}

/**
 * Un índice 0-100 sobre su pista.
 *
 * Es un medidor y no una barra de ranking: la pista completa está siempre a la vista, así
 * que se lee «cuánto de lo posible» y no solo «más que el de al lado». Para ocho índices
 * que comparten escala, eso es lo que importa.
 *
 * Las marcas de banda dividen la pista en los tramos del semáforo. Sin ellas un 62 y un 58
 * se ven casi iguales, cuando uno es «Aceptable» y el otro «En riesgo».
 */
export function IndicatorMeters({
  rows,
  bands,
  emptyMessage,
  href,
}: {
  rows: MeterRow[];
  bands: ThresholdBand[];
  emptyMessage?: string;
  href?: (row: MeterRow) => string;
}) {
  if (rows.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin indicadores para mostrar.'} />;
  }

  // Los cortes entre bandas, para dibujarlos sobre la pista una sola vez.
  const cortes = bands
    .map((band) => band.minValue)
    .filter((value) => value > 0 && value < 100)
    .sort((a, b) => a - b);

  return (
    <ul className="flex flex-col gap-3.5">
      {rows.map((row) => {
        const band = classify(row.value, bands);
        const width = row.value === null ? 0 : Math.max(row.value, 1);

        return (
          <li key={row.key} className="flex flex-col gap-1.5">
            <div className="flex items-baseline justify-between gap-3">
              {href ? (
                <a href={href(row)} className="text-sm text-foreground hover:underline">
                  {row.label}
                </a>
              ) : (
                <span className="text-sm text-foreground">{row.label}</span>
              )}
              <span className="flex shrink-0 items-baseline gap-2">
                <span className="text-sm font-bold tabular-nums text-foreground">
                  {formatIndex(row.value, 1)}
                </span>
                <span className="text-xs text-foreground-muted">
                  {band?.label ?? 'sin dato'}
                </span>
              </span>
            </div>

            <div className="relative h-2.5 w-full overflow-hidden rounded-full bg-surface-muted">
              <div
                className="h-full rounded-full transition-[width] duration-500"
                style={{
                  width: `${width}%`,
                  backgroundColor: band?.color ?? 'var(--border-strong)',
                }}
              />
              {cortes.map((corte) => (
                <span
                  key={corte}
                  aria-hidden
                  className="absolute top-0 h-full w-px bg-background/70"
                  style={{ left: `${corte}%` }}
                />
              ))}
            </div>

            {row.hint && <p className="text-xs text-foreground-muted">{row.hint}</p>}
          </li>
        );
      })}
    </ul>
  );
}
