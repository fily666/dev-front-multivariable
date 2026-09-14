import type { Tone } from '@/lib/insights';
import type { RadarPoint } from '@/lib/admin.types';
import { formatIndex } from '@/lib/score-scale';

const DOT: Record<Tone, string> = {
  good: 'bg-tone-good',
  neutral: 'bg-tone-neutral',
  warn: 'bg-tone-warn',
  bad: 'bg-tone-bad',
};

/**
 * Las prioridades, con lo que habría que hacer con cada una.
 *
 * Un panel que termina en un número deja el trabajo a medias: alguien tiene que traducirlo
 * a una decisión, y esa traducción es donde se pierde el diagnóstico. La acción sugerida
 * no reemplaza el criterio de gerencia, pero le da un punto de partida concreto.
 */
export function PriorityList({
  items,
  emptyMessage,
}: {
  items: { point: RadarPoint & { value: number }; tone: Tone; action?: string }[];
  emptyMessage?: string;
}) {
  if (items.length === 0) {
    return (
      <p className="text-sm text-foreground-muted">
        {emptyMessage ?? 'Sin índices con dato suficiente.'}
      </p>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {items.map(({ point, tone, action }, index) => (
        <li key={point.code} className="flex items-start gap-3">
          <span className="flex size-6 shrink-0 items-center justify-center rounded-full bg-surface-muted text-xs font-bold text-foreground-muted">
            {index + 1}
          </span>
          <div className="flex min-w-0 flex-col gap-0.5">
            <p className="flex flex-wrap items-baseline gap-x-2 text-sm">
              <span className="font-semibold text-foreground">{point.label}</span>
              <span className="flex items-center gap-1.5 text-xs text-foreground-muted">
                <span aria-hidden className={`size-2 rounded-full ${DOT[tone]}`} />
                {formatIndex(point.value, 1)} · {point.band?.label ?? 'sin banda'}
              </span>
            </p>
            {action && (
              <p className="text-xs leading-relaxed text-foreground-muted">{action}</p>
            )}
          </div>
        </li>
      ))}
    </ol>
  );
}
