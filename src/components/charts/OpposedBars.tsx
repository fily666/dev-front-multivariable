import type { CountedOption } from '@/lib/admin.types';
import { EmptyState } from './InsufficientData';

/**
 * Los mismos motivos, a los dos lados: por qué recomiendan y por qué no.
 *
 * Puestos en dos listas separadas hay que ir y venir para ver si un motivo aparece en las
 * dos. Enfrentados, la coincidencia es la primera cosa que se ve — y esa coincidencia es
 * la lectura más útil del componente: el mismo atributo vivido al revés según el área.
 *
 * Los dos lados NO van en verde y rojo. Ese par se derrumba con deuteranopia (ΔE 4,5),
 * así que el color estaría fingiendo informar. Van en el par frío/cálido verificado
 * (ΔE 25,9 con protanopia), y quien dice cuál es cuál es la palabra del encabezado.
 */
export function OpposedBars({
  promoters,
  detractors,
  emptyMessage,
}: {
  promoters: CountedOption[];
  detractors: CountedOption[];
  emptyMessage?: string;
}) {
  const porValor = new Map<string, { label: string; pro: number; det: number }>();
  for (const option of promoters) {
    porValor.set(option.value, { label: option.label, pro: option.share, det: 0 });
  }
  for (const option of detractors) {
    const previo = porValor.get(option.value);
    if (previo) previo.det = option.share;
    else porValor.set(option.value, { label: option.label, pro: 0, det: option.share });
  }

  const filas = [...porValor.entries()]
    .map(([value, row]) => ({ value, ...row }))
    .sort((a, b) => b.pro + b.det - (a.pro + a.det));

  if (filas.length === 0) {
    return <EmptyState message={emptyMessage ?? 'Sin motivos registrados todavía.'} />;
  }

  const tope = Math.max(...filas.flatMap((row) => [row.pro, row.det]), 1);

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-3 text-[11px] font-medium uppercase tracking-wide">
        <span className="flex flex-1 items-center justify-end gap-1.5 text-foreground-muted">
          <span aria-hidden className="size-2.5 rounded-sm bg-diverge-warm" />
          Detractores
        </span>
        <span className="w-32 shrink-0" />
        <span className="flex flex-1 items-center gap-1.5 text-foreground-muted">
          <span aria-hidden className="size-2.5 rounded-sm bg-diverge-cool" />
          Promotores
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {filas.map((row) => {
          const ambos = row.pro >= 15 && row.det >= 15;
          return (
            <li key={row.value} className="flex items-center gap-3">
              <span className="flex flex-1 items-center justify-end gap-2">
                <span className="text-xs tabular-nums text-foreground-muted">
                  {row.det > 0 ? `${row.det.toFixed(0)}%` : ''}
                </span>
                <span className="relative h-5 flex-1">
                  <span
                    className="absolute right-0 top-1/2 h-2.5 -translate-y-1/2 rounded-l-sm bg-diverge-warm"
                    style={{ width: `${(row.det / tope) * 100}%` }}
                  />
                </span>
              </span>

              <span
                className={[
                  'w-32 shrink-0 truncate text-center text-xs',
                  ambos ? 'font-bold text-foreground' : 'text-foreground',
                ].join(' ')}
                title={ambos ? `${row.label} — aparece con fuerza en los dos lados` : row.label}
              >
                {row.label}
              </span>

              <span className="flex flex-1 items-center gap-2">
                <span className="relative h-5 flex-1">
                  <span
                    className="absolute left-0 top-1/2 h-2.5 -translate-y-1/2 rounded-r-sm bg-diverge-cool"
                    style={{ width: `${(row.pro / tope) * 100}%` }}
                  />
                </span>
                <span className="text-xs tabular-nums text-foreground-muted">
                  {row.pro > 0 ? `${row.pro.toFixed(0)}%` : ''}
                </span>
              </span>
            </li>
          );
        })}
      </ul>

      <p className="text-xs text-foreground-muted">
        En negrita, los motivos que pesan en los dos lados a la vez.
      </p>
    </div>
  );
}
