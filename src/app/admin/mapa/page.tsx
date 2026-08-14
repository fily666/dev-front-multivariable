'use client';

import { useQuery } from '@tanstack/react-query';
import { getRelationshipMap } from '@/lib/admin-client';
import { formatIndex } from '@/lib/score-scale';
import { useThresholds } from '@/lib/use-thresholds';
import { BarRanking } from '@/components/charts/BarRanking';
import { RelationshipMatrixView } from '@/components/charts/RelationshipMatrixView';
import { ScoreHeatmapGrid } from '@/components/charts/ScoreHeatmapGrid';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

export default function MapaPage() {
  const query = useQuery({
    queryKey: ['relationship-map'],
    queryFn: () => getRelationshipMap(),
  });
  const bands = useThresholds();

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg font-semibold text-foreground">Mapa de relacionamiento</h1>
        <p className="text-sm text-foreground-muted">
          Cómo se evalúan las áreas entre sí. Cada celda es el índice de relacionamiento que
          el área de la fila otorga al área de la columna.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data) => (
          <>
            <PanelSection
              title="Matriz área evaluadora × área evaluada"
              description="Lea una fila para ver cómo evalúa un área a las demás, o una columna para ver cómo la evalúan a ella."
            >
              <RelationshipMatrixView payload={data} bands={bands} />
            </PanelSection>

            <PanelSection
              title="Ranking de áreas por relacionamiento recibido"
              description="Promedio del índice que cada área recibe de las demás."
            >
              <BarRanking
                max={100}
                bands={bands}
                href={(row) => `/admin/areas/${row.key}`}
                rows={data.ranking.map((row) => ({
                  key: row.areaCode,
                  label: row.areaName,
                  value: row.irel,
                  hint: `${row.respondents} respuestas`,
                }))}
                emptyMessage="Ningún área alcanza todavía la cohorte mínima para publicarse."
              />
              {data.suppressedRanking > 0 && (
                <p className="mt-3 text-xs text-foreground-muted">
                  {data.suppressedRanking}{' '}
                  {data.suppressedRanking === 1 ? 'área oculta' : 'áreas ocultas'} por cohorte
                  insuficiente.
                </p>
              )}
            </PanelSection>

            <PanelSection
              title="Brecha de percepción"
              description="Diferencia entre el relacionamiento que un área recibe y el que otorga. Una brecha positiva señala un área mejor evaluada de lo que evalúa; una negativa, un área exigente con las demás."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[520px] text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left">
                      <th className="py-2 text-xs font-medium text-foreground-muted">Área</th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Recibe
                      </th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Otorga
                      </th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Brecha
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.gap.map((row) => (
                      <tr key={row.areaCode} className="border-b border-border-subtle">
                        <td className="py-2 text-foreground">{row.areaName}</td>
                        <td className="py-2 text-right tabular-nums text-foreground">
                          {formatIndex(row.received, 1)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-foreground">
                          {formatIndex(row.granted, 1)}
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums text-foreground">
                          {row.gap === null
                            ? '—'
                            : `${row.gap > 0 ? '+' : ''}${row.gap.toFixed(1)}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelSection>

            <PanelSection
              title="Aspectos de la red de colaboración"
              description="Los cinco aspectos del componente 2 por área evaluada. Distingue un área que falla en comunicación de una que falla en cumplimiento."
            >
              <ScoreHeatmapGrid rows={data.aspects} bands={bands} />
            </PanelSection>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}
