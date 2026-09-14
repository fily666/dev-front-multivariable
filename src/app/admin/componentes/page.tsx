'use client';

import { useQuery } from '@tanstack/react-query';
import { getComponents, getIndicesByArea } from '@/lib/admin-client';
import {
  byAreaInsight,
  innovationInsight,
  responseTimeInsight,
} from '@/lib/insights';
import { useAreaNames } from '@/lib/use-area-names';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { IndicesHeatTable } from '@/components/charts/IndicesHeatTable';
import { OrdinalBars } from '@/components/charts/OrdinalBars';
import { Readout } from '@/components/charts/Readout';
import { EmptyState } from '@/components/charts/InsufficientData';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

/** Los siete del IMC más NIO: el mismo conjunto que el radar. */
const INDEX_COLUMNS = ['IREL', 'ICOM', 'ISI', 'IAG', 'IINT', 'ICOL', 'IINN', 'NIO'];

const INDEX_LABELS: Record<string, string> = {
  IREL: 'Relacionamiento',
  ICOM: 'Comunicación',
  ISI: 'Servicio interno',
  IAG: 'Agilidad',
  IINT: 'Integración',
  ICOL: 'Colaboración',
  IINN: 'Innovación',
  NIO: 'Interacción',
};

export default function ComponentesPage() {
  const query = useQuery({ queryKey: ['components'], queryFn: () => getComponents() });
  const byArea = useQuery({
    queryKey: ['indices-by-area'],
    queryFn: () => getIndicesByArea(),
  });
  const nombreDe = useAreaNames();

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">Componentes</h1>
        <p className="text-sm text-foreground-muted">
          Lo que mide cada componente del instrumento por separado, y cómo cambia según
          quién responde.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data) => {
          /*
           * La red de innovación llega con aristas de un área consigo misma. La pregunta
           * 8.1 no lleva la regla de «no incluya su propia área» que sí tiene la 1.1, así
           * que alguien puede marcarse a sí mismo y el backend lo agrega tal cual. Un área
           * que innova consigo misma no dice nada sobre trabajo entre áreas, que es lo que
           * este panel mide, así que no se pinta.
           */
          const aristas = [...data.innovationNetwork]
            .filter((edge) => edge.sourceArea !== edge.targetArea)
            .sort((a, b) => b.initiatives - a.initiatives);

          return (
          <>
            <PanelSection
              title="Los indicadores, de peor a mejor"
              description="Ordenados por valor y no por código: lo primero que se ve es lo que hay que arreglar."
            >
              <IndicatorMeters
                bands={data.thresholds}
                rows={[...data.indicators]
                  .sort((a, b) => (a.value ?? 999) - (b.value ?? 999))
                  .map((indicator) => ({
                    key: indicator.code,
                    label: indicator.label,
                    value: indicator.value,
                    hint: `${indicator.code} · ${indicator.respondents} ${indicator.respondents === 1 ? 'respuesta' : 'respuestas'} · ${indicator.observations} observaciones`,
                  }))}
              />
            </PanelSection>

            <PanelSection
              title="Cuánto tardan en responderle a uno"
              description="Los tramos conservan su orden natural, incluidos los que están en cero: un hueco en la distribución también dice algo. Alimenta el Índice de Agilidad."
            >
              <Readout insight={responseTimeInsight(data.responseTimes)} />
              <OrdinalBars rows={data.responseTimes} />
            </PanelSection>

            <PanelSection
              title="Quién innova con quién"
              description="Iniciativas conjuntas declaradas en los últimos seis meses."
            >
              <Readout insight={innovationInsight(aristas)} />
              {aristas.length === 0 ? (
                <EmptyState message="Sin iniciativas conjuntas registradas." />
              ) : (
                <ul className="flex flex-col gap-2">
                  {aristas.map((edge) => (
                    <li
                      key={`${edge.sourceArea}-${edge.targetArea}`}
                      className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 text-sm"
                    >
                      <span className="text-foreground">
                        {nombreDe(edge.sourceArea)}{' '}
                        <span className="text-foreground-muted">→</span>{' '}
                        {nombreDe(edge.targetArea)}
                      </span>
                      <span className="tabular-nums text-foreground-muted">
                        {edge.initiatives} {edge.initiatives === 1 ? 'mención' : 'menciones'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelSection>

            <PanelSection
              title="La misma organización, vista desde cada área"
              description="Los mismos índices según el área de quien respondió, de la más crítica a la más conforme. Revela si el malestar está repartido o concentrado."
            >
              <EnvelopeGate query={byArea}>
                {(areaData) => (
                  <>
                    <Readout insight={byAreaInsight(areaData)} />
                    {/* Sin filas, la lectura ya explica por qué: repetirlo debajo en un
                        recuadro vacío solo ocupa pantalla. */}
                    {areaData.rows.length > 0 && (
                      <IndicesHeatTable
                        payload={areaData}
                        columns={INDEX_COLUMNS}
                        labels={INDEX_LABELS}
                        bands={data.thresholds}
                      />
                    )}
                  </>
                )}
              </EnvelopeGate>
            </PanelSection>
          </>
          );
        }}
      </EnvelopeGate>
    </>
  );
}
