'use client';

import { useQuery } from '@tanstack/react-query';
import { getComponents, getIndicesByArea } from '@/lib/admin-client';
import {
  RESPONSE_TIME_OUT_OF_SCALE,
  byAreaInsight,
  innovationInsight,
  radarInsight,
  responseTimeInsight,
} from '@/lib/insights';
import { formatIndex, formatShare } from '@/lib/score-scale';
import { useAreaNames } from '@/lib/use-area-names';
import { InsightTitle, PageBody, PageHeader, PrintButton, SectionHeading } from '@/components/page/PageHeader';
import { BarRanking } from '@/components/charts/BarRanking';
import { ChartCard, Legend } from '@/components/charts/ChartCard';
import { DataTable } from '@/components/charts/DataTable';
import { EnvelopeGate, LoadingCard } from '@/components/charts/EnvelopeGate';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { IndicesHeatTable } from '@/components/charts/IndicesHeatTable';
import { OrdinalBars } from '@/components/charts/OrdinalBars';

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

/**
 * Cada componente del instrumento por separado, y cómo cambia según quién responde.
 */
export default function ComponentesPage() {
  const query = useQuery({ queryKey: ['components'], queryFn: () => getComponents() });
  const byArea = useQuery({ queryKey: ['indices-by-area'], queryFn: () => getIndicesByArea() });
  const nombreDe = useAreaNames();

  const data = query.data?.data ?? null;
  const titular = data ? radarInsight(data.indicators, data.thresholds) : null;

  return (
    <>
      <PageHeader
        breadcrumbs={[{ label: 'Diagnóstico', href: '/admin' }, { label: 'Componentes' }]}
        kicker="Componentes del instrumento"
        title={titular ? <InsightTitle insight={titular} /> : 'Lo que mide cada componente'}
        lede="Lo que mide cada componente del instrumento por separado, y cómo cambia según el área de quien responde."
        actions={<PrintButton />}
      />

      <PageBody>
        <EnvelopeGate query={query} loading={<LoadingCard height={360} />}>
          {(componentes) => {
            /*
             * La red de innovación llega con aristas de un área consigo misma. La pregunta 8.1
             * no lleva la regla de «no incluya su propia área» que sí tiene la 1.1, así que
             * alguien puede marcarse a sí mismo y el backend lo agrega tal cual. Un área que
             * innova consigo misma no dice nada sobre trabajo entre áreas, así que no se pinta.
             */
            const aristas = [...componentes.innovationNetwork]
              .filter((edge) => edge.sourceArea !== edge.targetArea)
              .sort((a, b) => b.initiatives - a.initiatives);
            const ordenados = [...componentes.indicators].sort((a, b) => (a.value ?? 999) - (b.value ?? 999));

            return (
              <>
                <ChartCard
                  accent
                  insight={radarInsight(componentes.indicators, componentes.thresholds)}
                  subtitle="Los indicadores ordenados por valor y no por código: lo primero que se ve es lo que hay que arreglar"
                  views={[
                    {
                      id: 'grafica',
                      label: 'Gráfica',
                      content: (
                        <IndicatorMeters
                          bands={componentes.thresholds}
                          rows={ordenados.map((indicator) => ({
                            key: indicator.code,
                            label: indicator.label,
                            value: indicator.value,
                            hint: `${indicator.code} · ${indicator.respondents} ${indicator.respondents === 1 ? 'respuesta' : 'respuestas'} · ${indicator.observations} observaciones`,
                          }))}
                        />
                      ),
                    },
                    {
                      id: 'tabla',
                      label: 'Tabla',
                      content: (
                        <DataTable
                          caption="Indicadores por componente"
                          rowKey={(row) => row.code}
                          rows={ordenados}
                          minWidth={480}
                          columns={[
                            { key: 'ind', header: 'Indicador', render: (row) => row.label },
                            { key: 'cod', header: 'Código', align: 'left', render: (row) => <code className="font-mono text-xs">{row.code}</code> },
                            { key: 'valor', header: 'Valor', render: (row) => formatIndex(row.value, 1) },
                            { key: 'banda', header: 'Banda', render: (row) => row.band?.label ?? '—' },
                            { key: 'n', header: 'Respuestas', render: (row) => row.respondents },
                          ]}
                        />
                      ),
                    },
                  ]}
                />

                <div className="grid gap-6 xl:grid-cols-2 xl:items-start">
                  <ChartCard
                    insight={responseTimeInsight(componentes.responseTimes)}
                    subtitle="Si a la gente le responden dentro del ANS, en el orden de la escala"
                    legend={
                      <Legend
                        items={[
                          { label: 'De supera a no cumple', color: 'var(--ramp-3)', hint: 'más oscuro = peor' },
                          { label: 'No conoce el ANS / no aplica', color: 'var(--border-strong)' },
                        ]}
                      />
                    }
                    views={[
                      {
                        id: 'grafica',
                        label: 'Gráfica',
                        content: (
                          <OrdinalBars
                            rows={componentes.responseTimes}
                            outOfScale={[RESPONSE_TIME_OUT_OF_SCALE]}
                            emptyMessage="Aún no hay respuestas con la pregunta del ANS."
                          />
                        ),
                      },
                      {
                        id: 'tabla',
                        label: 'Tabla',
                        content: (
                          <DataTable
                            caption="Cumplimiento del ANS"
                            rowKey={(row) => row.value}
                            rows={componentes.responseTimes}
                            minWidth={320}
                            columns={[
                              { key: 'op', header: 'Opción', render: (row) => row.label },
                              { key: 'n', header: 'Respuestas', render: (row) => row.count },
                              { key: 'pct', header: '%', render: (row) => formatShare(row.share) },
                            ]}
                          />
                        ),
                      },
                    ]}
                    howToRead={
                      <p>
                        Las opciones conservan su orden, de supera a no cumple, incluidas las que
                        están en cero: un hueco en la distribución también dice algo. Alimenta el
                        Índice de Agilidad; «No conoce el ANS / No aplica» va en gris y no puntúa.
                      </p>
                    }
                  />

                  <ChartCard
                    insight={innovationInsight(aristas)}
                    subtitle="Iniciativas conjuntas declaradas en los últimos seis meses, por par de áreas"
                    views={[
                      {
                        id: 'grafica',
                        label: 'Gráfica',
                        content: (
                          <BarRanking
                            labelWidth="18rem"
                            rows={aristas.slice(0, 10).map((edge) => ({
                              key: `${edge.sourceArea}-${edge.targetArea}`,
                              label: `${nombreDe(edge.sourceArea)} → ${nombreDe(edge.targetArea)}`,
                              value: edge.initiatives,
                            }))}
                            emptyMessage="Sin iniciativas conjuntas registradas."
                          />
                        ),
                      },
                      {
                        id: 'tabla',
                        label: 'Tabla',
                        content: (
                          <DataTable
                            caption="Iniciativas conjuntas por par de áreas"
                            rowKey={(row) => `${row.sourceArea}-${row.targetArea}`}
                            rows={aristas}
                            minWidth={420}
                            columns={[
                              { key: 'de', header: 'Área que declara', render: (row) => nombreDe(row.sourceArea) },
                              { key: 'con', header: 'Con', align: 'left', render: (row) => nombreDe(row.targetArea) },
                              { key: 'n', header: 'Menciones', render: (row) => row.initiatives },
                            ]}
                          />
                        ),
                      },
                    ]}
                  />
                </div>

                <SectionHeading kicker="Según quién responde" title="La misma organización, vista desde cada área" />
                <EnvelopeGate query={byArea}>
                  {(areaData) => (
                    <ChartCard
                      insight={byAreaInsight(areaData)}
                      subtitle="Los mismos índices según el área de quien respondió, de la más crítica a la más conforme"
                      howToRead={
                        <p>
                          Revela si el malestar está repartido o concentrado. Cada celda lleva su
                          número y un velo del color de su banda; las áreas con menos respuestas que
                          la cohorte mínima no aparecen.
                        </p>
                      }
                    >
                      {/* Sin filas, la lectura ya explica por qué: repetirlo debajo en un
                          recuadro vacío solo ocupa pantalla. */}
                      {areaData.rows.length > 0 && (
                        <IndicesHeatTable
                          payload={areaData}
                          columns={INDEX_COLUMNS}
                          labels={INDEX_LABELS}
                          bands={componentes.thresholds}
                        />
                      )}
                    </ChartCard>
                  )}
                </EnvelopeGate>
              </>
            );
          }}
        </EnvelopeGate>
      </PageBody>
    </>
  );
}
