'use client';

import {
  PolarAngleAxis,
  PolarGrid,
  PolarRadiusAxis,
  Radar,
  RadarChart,
  ResponsiveContainer,
  Tooltip,
} from 'recharts';
import type { RadarPoint } from '@/lib/admin.types';
import { EmptyState } from './InsufficientData';

/** Una sola serie: el perfil de la organización. Sin leyenda — el título la nombra. */
const SERIES_COLOR = 'var(--brand-accent)';

export function RadarIndices({ points }: { points: RadarPoint[] }) {
  const withData = points.filter((point) => point.value !== null);
  if (withData.length < 3) {
    return <EmptyState message="Se necesitan al menos tres índices con datos para el perfil." />;
  }

  const data = points.map((point) => ({
    label: point.label,
    value: point.value ?? 0,
    band: point.band?.label ?? 'Sin dato',
    hasData: point.value !== null,
  }));

  return (
    <div className="h-88 w-full">
      <ResponsiveContainer width="100%" height="100%">
        {/* Márgenes generosos y radio corto: con ocho ejes, «Servicio interno» y
            «Relacionamiento» se salían del contenedor y quedaban cortados. */}
        <RadarChart
          data={data}
          outerRadius="62%"
          margin={{ top: 16, right: 72, bottom: 16, left: 72 }}
        >
          <PolarGrid stroke="var(--border)" />
          <PolarAngleAxis
            dataKey="label"
            tick={{ fill: 'var(--foreground-muted)', fontSize: 11 }}
          />
          {/* Escala fija 0-100: dejarla automática haría que dos cortes distintos no se
              puedan comparar visualmente.

              Sin números en el eje: caían diagonalmente sobre la silueta y chocaban con
              las etiquetas. Los anillos de la retícula siguen marcando 0-25-50-75-100, el
              valor exacto está en el tooltip, y al lado hay una lista con las ocho cifras
              escritas — así que ningún dato depende solo de pasar el cursor. */}
          <PolarRadiusAxis domain={[0, 100]} tickCount={5} tick={false} axisLine={false} />
          <Radar
            dataKey="value"
            stroke={SERIES_COLOR}
            strokeWidth={2}
            fill={SERIES_COLOR}
            fillOpacity={0.18}
          />
          <Tooltip
            contentStyle={{
              backgroundColor: 'var(--surface)',
              border: '1px solid var(--border)',
              borderRadius: 8,
              fontSize: 12,
              color: 'var(--foreground)',
            }}
            formatter={(value, _name, item) => {
              const payload = item?.payload as
                | { band: string; hasData: boolean }
                | undefined;
              if (!payload?.hasData) return ['Sin dato', ''];
              return [`${String(value)} · ${payload.band}`, 'Índice'];
            }}
          />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
