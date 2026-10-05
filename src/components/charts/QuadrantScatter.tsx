'use client';

import { useMemo, useState } from 'react';
import { formatNumber } from '@/lib/score-scale';
import { ChartTooltip, TooltipRow, stagger, useMeasure } from './chart-utils';
import { EmptyState } from './InsufficientData';

export interface ScatterPoint {
  key: string;
  label: string;
  x: number;
  y: number;
  /** Para destacar con rótulo las más extremas; el orden lo decide quien llama. */
  emphasis?: number;
  href?: string;
}

interface Quadrant {
  /** Arriba a la izquierda, arriba a la derecha, abajo a la izquierda, abajo a la derecha. */
  topLeft: string;
  topRight: string;
  bottomLeft: string;
  bottomRight: string;
}

function median(values: number[]): number {
  const sorted = [...values].sort((a, b) => a - b);
  const middle = Math.floor(sorted.length / 2);
  return sorted.length % 2 ? sorted[middle] : (sorted[middle - 1] + sorted[middle]) / 2;
}

/**
 * El plano: dos medidas de cada área, una por eje, cortado por sus medianas.
 *
 * Es la forma que la línea gráfica de referencia usa para ordenar factores por alcance e
 * intensidad, y aquí ordena áreas por lo que dan y lo que reciben. Las medianas no son
 * metas: parten el grupo en mitades, así que cada cuadrante dice «por encima o por debajo
 * de lo típico en LinkTIC» en las dos medidas a la vez. La diagonal añade la lectura de la
 * brecha: sobre ella, el área recibe lo mismo que da.
 *
 * Una sola serie y en el tono 1: los cuadrantes se distinguen por posición y por rótulo,
 * no por color, así que no hace falta gastar el canal del color en ellos.
 */
export function QuadrantScatter({
  points,
  xLabel,
  yLabel,
  quadrants,
  diagonalLabel,
  height = 440,
  labelCount = 6,
  onSelect,
}: {
  points: ScatterPoint[];
  xLabel: string;
  yLabel: string;
  quadrants: Quadrant;
  diagonalLabel?: string;
  height?: number;
  labelCount?: number;
  onSelect?: (point: ScatterPoint) => void;
}) {
  const { ref, width } = useMeasure<HTMLDivElement>();
  const [hover, setHover] = useState<string | null>(null);

  const domain = useMemo(() => {
    if (points.length === 0) return { min: 0, max: 100 };
    const values = points.flatMap((point) => [point.x, point.y]);
    const lo = Math.max(0, Math.floor((Math.min(...values) - 5) / 10) * 10);
    const hi = Math.min(100, Math.ceil((Math.max(...values) + 5) / 10) * 10);
    return { min: lo, max: Math.max(hi, lo + 20) };
  }, [points]);

  if (points.length < 2) {
    return (
      <EmptyState message="Hacen falta al menos dos áreas con los dos lados medidos para dibujar el plano." />
    );
  }

  const margin = { top: 28, right: 20, bottom: 44, left: 48 };
  const innerWidth = Math.max(width - margin.left - margin.right, 10);
  const innerHeight = height - margin.top - margin.bottom;
  const span = domain.max - domain.min;
  const xAt = (value: number) => margin.left + ((value - domain.min) / span) * innerWidth;
  const yAt = (value: number) => margin.top + innerHeight - ((value - domain.min) / span) * innerHeight;

  const medianX = median(points.map((point) => point.x));
  const medianY = median(points.map((point) => point.y));
  const ticks = Array.from({ length: Math.floor(span / 10) + 1 }, (_, i) => domain.min + i * 10);

  const labelled = new Set(
    [...points]
      .sort((a, b) => (b.emphasis ?? 0) - (a.emphasis ?? 0))
      .slice(0, labelCount)
      .map((point) => point.key),
  );

  const hovered = points.find((point) => point.key === hover) ?? null;

  /** El punto más cercano al cursor, si está a menos de 28 px: no hace falta atinarle. */
  function nearest(event: React.PointerEvent<SVGRectElement>) {
    const box = event.currentTarget.getBoundingClientRect();
    const px = event.clientX - box.left + margin.left;
    const py = event.clientY - box.top + margin.top;
    let best: { key: string; distance: number } | null = null;
    for (const point of points) {
      const distance = Math.hypot(xAt(point.x) - px, yAt(point.y) - py);
      if (distance < 28 && (!best || distance < best.distance)) best = { key: point.key, distance };
    }
    setHover(best?.key ?? null);
  }

  const x0 = xAt(domain.min);
  const x1 = xAt(domain.max);
  const y0 = yAt(domain.min);
  const y1 = yAt(domain.max);
  const mx = xAt(medianX);
  const my = yAt(medianY);

  return (
    <div ref={ref} className="relative w-full" style={{ height }}>
      {width > 0 && (
        <svg width={width} height={height} className="block overflow-visible" aria-hidden="true">
          {/* Velos de cuadrante: el de arriba a la derecha es el bueno en las dos medidas. */}
          <rect x={mx} y={y1} width={x1 - mx} height={my - y1} fill="#2a78d6" opacity={0.06} />
          <rect x={x0} y={my} width={mx - x0} height={y0 - my} fill="#e34948" opacity={0.05} />
          <rect x={x0} y={y1} width={mx - x0} height={my - y1} fill="#94a3b8" opacity={0.06} />
          <rect x={mx} y={my} width={x1 - mx} height={y0 - my} fill="#94a3b8" opacity={0.06} />

          {ticks.map((tick) => (
            <g key={tick}>
              <line x1={xAt(tick)} x2={xAt(tick)} y1={y1} y2={y0} stroke="var(--chart-grid)" />
              <line x1={x0} x2={x1} y1={yAt(tick)} y2={yAt(tick)} stroke="var(--chart-grid)" />
              <text x={xAt(tick)} y={y0 + 16} textAnchor="middle" fontSize={11} fill="var(--chart-ink)">
                {tick}
              </text>
              <text x={x0 - 8} y={yAt(tick) + 4} textAnchor="end" fontSize={11} fill="var(--chart-ink)">
                {tick}
              </text>
            </g>
          ))}

          {diagonalLabel && (
            <g>
              <line x1={x0} y1={y0} x2={x1} y2={y1} stroke="var(--chart-axis)" strokeWidth={1} />
              {/* El rótulo va a tres cuartos de la diagonal y por encima de ella: en la
                  esquina chocaría con el nombre del cuadrante. */}
              <text
                x={x0 + (x1 - x0) * 0.74}
                y={y0 - (y0 - y1) * 0.74 - 6}
                textAnchor="end"
                fontSize={10.5}
                fill="var(--chart-ink)"
                transform={`rotate(${(-Math.atan2(y0 - y1, x1 - x0) * 180) / Math.PI} ${x0 + (x1 - x0) * 0.74} ${y0 - (y0 - y1) * 0.74 - 6})`}
              >
                {diagonalLabel}
              </text>
            </g>
          )}

          <line x1={mx} x2={mx} y1={y1} y2={y0} stroke="var(--chart-benchmark)" strokeOpacity={0.55} />
          <line x1={x0} x2={x1} y1={my} y2={my} stroke="var(--chart-benchmark)" strokeOpacity={0.55} />
          <text x={mx} y={y1 - 8} textAnchor="middle" fontSize={11} fill="var(--foreground-muted)">
            Mediana {formatNumber(medianX, 1)}
          </text>
          <text x={x1} y={my - 6} textAnchor="end" fontSize={11} fill="var(--foreground-muted)">
            Mediana {formatNumber(medianY, 1)}
          </text>

          <QuadrantLabel x={x0 + 8} y={y1 + 16} text={quadrants.topLeft} />
          <QuadrantLabel x={x1 - 8} y={y1 + 16} text={quadrants.topRight} anchor="end" />
          <QuadrantLabel x={x0 + 8} y={y0 - 10} text={quadrants.bottomLeft} />
          <QuadrantLabel x={x1 - 8} y={y0 - 10} text={quadrants.bottomRight} anchor="end" />

          {points.map((point, index) => {
            const cx = xAt(point.x);
            const cy = yAt(point.y);
            const active = hover === point.key;
            const nearRight = cx > x1 - 140;
            return (
              <g key={point.key}>
                <circle
                  className="lk-graf-punto"
                  style={stagger(index, 0.03)}
                  cx={cx}
                  cy={cy}
                  r={active ? 7.5 : 6}
                  fill="var(--series-1)"
                  stroke="#fff"
                  strokeWidth={2}
                />
                {(labelled.has(point.key) || active) && (
                  <text
                    x={nearRight ? cx - 11 : cx + 11}
                    y={cy + 4}
                    textAnchor={nearRight ? 'end' : 'start'}
                    fontSize={11.5}
                    fontWeight={600}
                    fill="var(--foreground)"
                    paintOrder="stroke"
                    stroke="#fff"
                    strokeWidth={3}
                    strokeLinejoin="round"
                  >
                    {point.label.length > 26 ? `${point.label.slice(0, 25)}…` : point.label}
                  </text>
                )}
              </g>
            );
          })}

          <text x={x1} y={height - 6} textAnchor="end" fontSize={11} fill="var(--chart-ink)">
            {xLabel} →
          </text>
          <text x={x0 - 40} y={y1 - 12} fontSize={11} fill="var(--chart-ink)">
            ↑ {yLabel}
          </text>

          <rect
            x={x0}
            y={y1}
            width={x1 - x0}
            height={y0 - y1}
            fill="transparent"
            onPointerMove={nearest}
            onPointerLeave={() => setHover(null)}
            onClick={() => {
              if (hovered && onSelect) onSelect(hovered);
            }}
            style={{ cursor: hovered && onSelect ? 'pointer' : undefined }}
          />
        </svg>
      )}

      {hovered && (
        <ChartTooltip x={xAt(hovered.x)} y={yAt(hovered.y) - 10} containerWidth={width}>
          <p className="mb-1 max-w-56 font-medium whitespace-normal text-white">{hovered.label}</p>
          <TooltipRow value={formatNumber(hovered.y, 1)} label={yLabel.toLowerCase()} />
          <TooltipRow value={formatNumber(hovered.x, 1)} label={xLabel.toLowerCase()} />
          {onSelect && <p className="mt-1 text-slate-400">Clic para abrir la ficha</p>}
        </ChartTooltip>
      )}
    </div>
  );
}

function QuadrantLabel({
  x,
  y,
  text,
  anchor = 'start',
}: {
  x: number;
  y: number;
  text: string;
  anchor?: 'start' | 'end';
}) {
  return (
    <text x={x} y={y} textAnchor={anchor} fontSize={11} fontWeight={600} fill="var(--foreground-muted)">
      {text}
    </text>
  );
}
