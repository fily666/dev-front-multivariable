import type { NpsResult } from '@/lib/admin.types';
import { formatNps } from '@/lib/score-scale';

/**
 * Colores de los tres segmentos del NPS: son estados, y van con su etiqueta.
 *
 * Salen de la gama del Manual de Marca — verde PANTONE 3288 C para promotores y los
 * complementarios ámbar y coral para pasivos y detractores. Son rellenos, no tinta de
 * texto, así que se usan tal cual los define el manual.
 */
const SEGMENTS = [
  { key: 'promoters', label: 'Promotores', hint: '9-10', color: '#008500' },
  { key: 'passives', label: 'Pasivos', hint: '7-8', color: '#ffc947' },
  { key: 'detractors', label: 'Detractores', hint: '0-6', color: '#f05945' },
] as const;

/**
 * NPS con su desglose.
 *
 * Se muestra la composición y no solo el número porque un NPS de 0 puede ser "todos
 * pasivos" o "mitad promotores, mitad detractores", y son diagnósticos opuestos.
 */
export function NpsGauge({ nps }: { nps: NpsResult }) {
  const total = nps.total;

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tabular-nums text-foreground">
          {formatNps(nps.value)}
        </span>
        <span className="text-xs text-foreground-muted">de −100 a +100</span>
      </div>

      {total === 0 ? (
        <p className="text-xs text-foreground-muted">Sin calificaciones registradas.</p>
      ) : (
        <>
          {/* 2px de separación entre segmentos: sin el hueco, dos colores contiguos se leen
              como una sola banda. */}
          <div className="flex h-2.5 w-full gap-0.5 overflow-hidden rounded-full">
            {SEGMENTS.map((segment) => {
              const count = nps[segment.key];
              const share = (count / total) * 100;
              if (share === 0) return null;
              return (
                <div
                  key={segment.key}
                  style={{ width: `${share}%`, backgroundColor: segment.color }}
                  title={`${segment.label}: ${count}`}
                />
              );
            })}
          </div>

          <ul className="flex flex-wrap gap-x-5 gap-y-1.5">
            {SEGMENTS.map((segment) => {
              const count = nps[segment.key];
              const share = total === 0 ? 0 : Math.round((count / total) * 100);
              return (
                <li key={segment.key} className="flex items-center gap-1.5 text-xs">
                  <span
                    aria-hidden
                    className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
                    style={{ backgroundColor: segment.color }}
                  />
                  <span className="text-foreground">{segment.label}</span>
                  <span className="text-foreground-muted">
                    {segment.hint} · {count} ({share}%)
                  </span>
                </li>
              );
            })}
          </ul>

          <p className="text-xs text-foreground-muted">
            {total} {total === 1 ? 'calificación' : 'calificaciones'} de área
          </p>
        </>
      )}
    </div>
  );
}
