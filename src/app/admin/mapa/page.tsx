'use client';

import { useQuery } from '@tanstack/react-query';
import { getRelationshipMap } from '@/lib/admin-client';
import { aspectsInsight, gapInsight, rankingInsight } from '@/lib/insights';
import { useThresholds } from '@/lib/use-thresholds';
import { BarRanking } from '@/components/charts/BarRanking';
import { DivergingBars } from '@/components/charts/DivergingBars';
import { Readout } from '@/components/charts/Readout';
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
        <h1 className="text-lg text-foreground">Mapa de relacionamiento</h1>
        <p className="text-sm text-foreground-muted">
          Cómo se evalúan las áreas entre sí. Cada celda es el índice que el área de la fila
          le otorga al área de la columna.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data) => (
          <>
            <PanelSection
              title="Quién trabaja bien con quién"
              description="Ranking del relacionamiento que cada área RECIBE de las demás. Es la lectura más directa del mapa: con quién cuesta trabajar."
            >
              <Readout insight={rankingInsight(data.ranking, data.suppressedRanking)} />
              <BarRanking
                max={100}
                bands={bands}
                href={(row) => `/admin/areas/${row.key}`}
                rows={data.ranking.map((row) => ({
                  key: row.areaCode,
                  label: row.areaName,
                  value: row.irel,
                  hint: `${row.respondents} ${row.respondents === 1 ? 'respuesta' : 'respuestas'}`,
                }))}
                emptyMessage="Ningún área alcanza todavía la cohorte mínima para publicarse."
              />
            </PanelSection>

            <PanelSection
              title="Quién exige más de lo que recibe"
              description="Recibido menos otorgado, a los dos lados del cero. A la derecha, las áreas que califican a las demás por debajo de la nota que ellas reciben; a la izquierda, las que reparten mejores notas de las que les dan."
            >
              <Readout insight={gapInsight(data.gap)} />
              <DivergingBars
                negativeLabel="Da mejor nota de la que recibe"
                positiveLabel="Exige más de lo que le exigen"
                rows={data.gap.map((row) => ({
                  key: row.areaCode,
                  label: row.areaName,
                  value: row.gap,
                  hint: `${row.areaName}: recibe ${row.received?.toFixed(1) ?? '—'}, otorga ${row.granted?.toFixed(1) ?? '—'}`,
                }))}
                emptyMessage="Ningún área tiene los dos lados de la brecha todavía."
              />
            </PanelSection>

            <PanelSection
              title="En qué falla cada área"
              description="Los cinco aspectos del componente 2 por área evaluada. Distingue un área que falla en comunicación de una que falla en cumplimiento — el índice agregado las promedia y borra esa diferencia."
            >
              <Readout insight={aspectsInsight(data.aspects, bands)} />
              <ScoreHeatmapGrid rows={data.aspects} bands={bands} />
            </PanelSection>

            <PanelSection
              title="La matriz completa, par a par"
              description="Lea una fila para ver cómo evalúa un área a las demás, o una columna para ver cómo la evalúan a ella. Es el dato en bruto: lo de arriba son sus conclusiones."
            >
              <RelationshipMatrixView payload={data} bands={bands} />
            </PanelSection>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}
