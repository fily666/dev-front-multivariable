import { EmptyState } from './InsufficientData';

export interface DivergingRow {
  key: string;
  label: string;
  value: number | null;
  /** Lo que se lee al pasar el cursor, y lo que va en la vista de tabla. */
  hint?: string;
}

/**
 * Barras a los dos lados de un cero.
 *
 * Es la forma de la polaridad: ningún extremo es «bueno», lo que importa es de qué lado
 * cae y cuánto. Una tabla de números con signo obliga a leer fila por fila para encontrar
 * los extremos; aquí saltan a la vista.
 *
 * Dos tonos, frío contra cálido, porque dos fríos no se leen como opuestos. Van con la
 * etiqueta de su lado en el encabezado: el color refuerza, no informa solo.
 */
export function DivergingBars({
  rows,
  negativeLabel,
  positiveLabel,
  unit = '',
  emptyMessage,
}: {
  rows: DivergingRow[];
  negativeLabel: string;
  positiveLabel: string;
  unit?: string;
  emptyMessage?: string;
}) {
  const conDato = rows.filter(
    (row): row is DivergingRow & { value: number } => row.value !== null,
  );
  if (conDato.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin datos para comparar.'} />;
  }

  // Escala simétrica: si un lado se midiera contra su propio máximo, un −3 y un +12 se
  // verían igual de largos y el gráfico mentiría sobre cuál pesa más.
  const tope = Math.max(...conDato.map((row) => Math.abs(row.value)), 1);
  const ordenadas = [...conDato].sort((a, b) => a.value - b.value);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center justify-between gap-3 text-[11px] font-medium uppercase tracking-wide">
        <span className="flex items-center gap-1.5 text-foreground-muted">
          <span aria-hidden className="size-2.5 rounded-sm bg-diverge-warm" />
          {negativeLabel}
        </span>
        <span className="flex items-center gap-1.5 text-foreground-muted">
          {positiveLabel}
          <span aria-hidden className="size-2.5 rounded-sm bg-diverge-cool" />
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {ordenadas.map((row) => {
          const share = (Math.abs(row.value) / tope) * 50;
          const negativa = row.value < 0;

          return (
            <li key={row.key} className="flex items-center gap-3">
              <span className="w-40 shrink-0 truncate text-xs text-foreground" title={row.label}>
                {row.label}
              </span>

              <span className="relative h-5 flex-1" title={row.hint ?? row.label}>
                {/* La línea del cero, siempre visible: sin ella no hay contra qué leer. */}
                <span
                  aria-hidden
                  className="absolute inset-y-0 left-1/2 w-px -translate-x-1/2 bg-border-strong"
                />
                <span
                  className="absolute top-1/2 h-2.5 -translate-y-1/2 rounded-sm"
                  style={{
                    width: `${Math.max(share, 0.6)}%`,
                    [negativa ? 'right' : 'left']: '50%',
                    backgroundColor: negativa
                      ? 'var(--diverge-warm)'
                      : 'var(--diverge-cool)',
                  }}
                />
              </span>

              <span className="w-14 shrink-0 text-right text-xs font-bold tabular-nums text-foreground">
                {row.value > 0 ? '+' : ''}
                {row.value.toFixed(1)}
                {unit}
              </span>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
