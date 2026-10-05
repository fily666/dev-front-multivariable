'use client';

import { useQuery } from '@tanstack/react-query';
import {
  getIndicators,
  getOverview,
  getQualitative,
  getRelationshipMap,
} from '@/lib/admin-client';
import {
  barriersInsight,
  gapInsight,
  imcInsight,
  motivesInsight,
  npsInsight,
  priorities,
  radarInsight,
  rankingInsight,
  strengthenInsight,
  strengths,
  strengthsHeading,
} from '@/lib/insights';
import { formatDateTime, formatDuration, formatIndex, formatNps, formatShare } from '@/lib/score-scale';
import {
  HowToReadButton,
  InsightTitle,
  MoreLink,
  PageBody,
  PageHeader,
  PrintButton,
  SectionHeading,
  StatGrid,
} from '@/components/page/PageHeader';
import { BarRanking } from '@/components/charts/BarRanking';
import { ChartCard } from '@/components/charts/ChartCard';
import { DataTable } from '@/components/charts/DataTable';
import { DivergingBars } from '@/components/charts/DivergingBars';
import { EnvelopeGate, LoadingCard } from '@/components/charts/EnvelopeGate';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { OpposedBars } from '@/components/charts/OpposedBars';
import { PointList, PriorityCards } from '@/components/charts/PriorityList';
import { RadarIndices } from '@/components/charts/RadarIndices';

/**
 * El resumen ejecutivo: el diagnóstico completo en una sola lectura de arriba abajo.
 *
 * Está escrito para alguien que tiene cinco minutos y tiene que decidir algo. Por eso
 * cuenta una historia en orden y no ofrece una rejilla de gráficos para explorar:
 *
 *   1. Cuánto vale la colaboración hoy, y si el dato se puede tomar en serio.
 *   2. Dónde está fuerte y dónde está rota, con nombre propio.
 *   3. Qué atacar primero.
 *   4. Qué se siente al trabajar con otra área.
 *   5. Qué señala la gente como el problema.
 *   6. Cómo se evalúan las áreas entre sí.
 *
 * Las consultas van en paralelo y cada tramo resuelve la suya: una sola consulta gigante
 * dejaría la pantalla en blanco hasta que llegara la más lenta.
 */
export default function ResumenPage() {
  const overview = useQuery({ queryKey: ['overview'], queryFn: () => getOverview() });
  const indicators = useQuery({ queryKey: ['indicators'], queryFn: () => getIndicators() });
  const qualitative = useQuery({ queryKey: ['qualitative'], queryFn: () => getQualitative() });
  const map = useQuery({ queryKey: ['relationship-map'], queryFn: () => getRelationshipMap() });

  const bands = indicators.data?.data?.thresholds ?? [];
  const data = overview.data?.data ?? null;
  const meta = overview.data?.meta;

  const veredicto = data ? imcInsight(data.imc, bands) : null;
  const perfil = data ? radarInsight(data.radar, bands) : null;
  const experiencia = data ? npsInsight(data.nps) : null;

  return (
    <>
      <PageHeader
        variant="hero"
        kicker="Diagnóstico organizacional · Resumen ejecutivo"
        title={
          veredicto ? (
            <InsightTitle insight={veredicto} />
          ) : overview.isLoading ? (
            'Cargando el diagnóstico…'
          ) : (
            'Cómo colabora LinkTIC hoy'
          )
        }
        lede={
          perfil && experiencia
            ? `${perfil.headline} ${experiencia.headline}`
            : meta?.insufficient
              ? `Hay ${meta.n} ${meta.n === 1 ? 'respuesta completa' : 'respuestas completas'}; el diagnóstico se publica a partir de ${meta.minCohortSize}, para que ningún resultado permita deducir quién dijo qué.`
              : undefined
        }
        actions={
          <>
            <HowToReadButton title="Cómo leer este resumen" onDark>
              <p>
                Cada bloque abre con su conclusión escrita y pone el gráfico debajo como respaldo.
                Las conclusiones se calculan desde el mismo dato que se pinta al lado.
              </p>
              <p>
                El semáforo (Crítico, En riesgo, Aceptable…) sale de los umbrales que define la
                organización, no de este panel. Los cortes con menos de{' '}
                {meta?.minCohortSize ?? 4} respuestas se ocultan.
              </p>
            </HowToReadButton>
            <PrintButton onDark />
          </>
        }
        stats={
          data && (
            <StatGrid
              onDark
              items={[
                {
                  label: 'Índice de Madurez Colaborativa',
                  value: formatIndex(data.imc.value, 1),
                  unit: 'de 100',
                  tag: data.imc.band ? { label: data.imc.band.label, color: data.imc.band.color } : null,
                },
                {
                  label: 'NPS interno',
                  value: formatNps(data.nps.value),
                  hint: `${data.nps.total} calificaciones de área`,
                },
                {
                  label: 'Respuestas completas',
                  value: String(data.completion.completed),
                  hint:
                    data.participation.rate !== null
                      ? `${formatShare(data.participation.rate)} de participación`
                      : `${formatShare(data.completion.rate)} de quienes la abrieron`,
                },
                {
                  label: 'Duración mediana',
                  value: formatDuration(data.medianDurationSeconds),
                  hint: 'El instrumento estima 15 min',
                },
              ]}
            />
          )
        }
      />

      <PageBody>
        <EnvelopeGate query={overview} loading={<LoadingCard height={320} />}>
          {(resumen, corte) => (
            <>
              {/* ---------- Fuerte y roto ---------- */}
              <EnvelopeGate query={indicators}>
                {(ind) => {
                  const fuertes = strengths(ind.radar, ind.thresholds);
                  const urgencias = priorities(ind.radar, ind.thresholds);
                  const titulo = strengthsHeading(fuertes);

                  return (
                    <>
                      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr]">
                        <ChartCard
                          accent
                          insight={radarInsight(ind.radar, ind.thresholds)}
                          subtitle="Los ocho índices del instrumento sobre su pista 0-100, con los tramos del semáforo"
                          views={[
                            {
                              id: 'grafica',
                              label: 'Gráfica',
                              content: (
                                <IndicatorMeters
                                  bands={ind.thresholds}
                                  href={(row) => `/admin/indices#${row.key}`}
                                  rows={[...ind.radar]
                                    .sort((a, b) => (a.value ?? 999) - (b.value ?? 999))
                                    .map((point) => ({ key: point.code, label: point.label, value: point.value }))}
                                />
                              ),
                            },
                            {
                              id: 'tabla',
                              label: 'Tabla',
                              content: (
                                <DataTable
                                  caption="Los ocho índices"
                                  rowKey={(row) => row.code}
                                  rows={ind.radar}
                                  minWidth={360}
                                  columns={[
                                    { key: 'indice', header: 'Índice', render: (row) => row.label },
                                    { key: 'valor', header: 'Valor', render: (row) => formatIndex(row.value, 1) },
                                    { key: 'banda', header: 'Banda', render: (row) => row.band?.label ?? '—' },
                                  ]}
                                />
                              ),
                            },
                          ]}
                          howToRead={
                            <p>
                              Se lee cuánto falta, no solo quién va delante: la pista completa está a
                              la vista y sus tramos son los del semáforo. Un 62 y un 58 se ven casi
                              iguales y pueden ser bandas distintas; por eso la banda va escrita.
                            </p>
                          }
                        />

                        <aside className="lk-tarjeta flex flex-col gap-5 p-5 sm:p-6">
                          <div className="flex flex-col gap-3">
                            <h2 className="text-[15px] text-foreground">{titulo.title}</h2>
                            {titulo.note && (
                              <p className="text-[13px] leading-relaxed text-tone-warn">{titulo.note}</p>
                            )}
                            <PointList items={fuertes} />
                          </div>
                          <div className="flex flex-col gap-3 border-t border-border-subtle pt-5">
                            <h2 className="text-[15px] text-foreground">Lo que hay que atacar primero</h2>
                            <PointList items={urgencias} />
                          </div>
                          <div className="mt-auto">
                            <MoreLink href="/admin/indices">Ver cómo se calcula cada índice</MoreLink>
                          </div>
                        </aside>
                      </div>

                      {/* ---------- Qué atacar primero ---------- */}
                      <SectionHeading
                        kicker="Intervenir primero"
                        title={`${urgencias.length === 1 ? 'El índice' : `Los ${urgencias.length} índices`} más bajos, con un punto de partida`}
                        aside={<MoreLink href="/admin/componentes">Ver los componentes</MoreLink>}
                      />
                      <div className="grid gap-6 xl:grid-cols-[1.7fr_1fr] xl:items-start">
                        <PriorityCards items={urgencias} href="/admin/indices" />
                        <ChartCard
                          title="Perfil organizacional"
                          subtitle="La silueta de los ocho índices, en escala fija 0-100"
                        >
                          <RadarIndices points={resumen.radar} />
                        </ChartCard>
                      </div>
                    </>
                  );
                }}
              </EnvelopeGate>

              {/* ---------- La experiencia ---------- */}
              <SectionHeading kicker="La experiencia" title="Qué se siente al trabajar con otra área" />
              <EnvelopeGate query={qualitative}>
                {(qual) => (
                  <>
                    <div className="grid gap-6 lg:grid-cols-2">
                      <ChartCard
                        insight={npsInsight(resumen.nps)}
                        subtitle="NPS interno y su composición: el número neto esconde si es indiferencia o polarización"
                      >
                        <NpsGauge nps={resumen.nps} />
                      </ChartCard>
                      <ChartCard
                        insight={motivesInsight(qual.npsMotives)}
                        subtitle="Motivos de promotores y detractores, enfrentados"
                      >
                        <OpposedBars promoters={qual.npsMotives.promoters} detractors={qual.npsMotives.detractors} />
                      </ChartCard>
                    </div>

                    {/* ---------- Qué señala la gente ---------- */}
                    <SectionHeading
                      kicker="La voz de la gente"
                      title="Qué señalan como el problema"
                      aside={<MoreLink href="/admin/cualitativo">Ver todo lo cualitativo</MoreLink>}
                    />
                    <div className="grid gap-6 lg:grid-cols-2">
                      <ChartCard
                        insight={barriersInsight(qual.barriers)}
                        subtitle="Mayores obstáculos para el trabajo entre áreas, en % de encuestados"
                      >
                        <BarRanking
                          suffix="%"
                          max={100}
                          rows={qual.barriers.slice(0, 6).map((option) => ({
                            key: option.value,
                            label: option.label,
                            value: option.share,
                            hint: `${option.count} ${option.count === 1 ? 'mención' : 'menciones'}`,
                          }))}
                        />
                      </ChartCard>
                      <ChartCard
                        insight={strengthenInsight(qual.areasToStrengthen)}
                        subtitle="Áreas que las demás piden fortalecer, en % de encuestados"
                      >
                        <BarRanking
                          suffix="%"
                          max={100}
                          rows={qual.areasToStrengthen.slice(0, 6).map((option) => ({
                            key: option.value,
                            label: option.label,
                            value: option.share,
                            hint: `${option.count} ${option.count === 1 ? 'mención' : 'menciones'}`,
                          }))}
                          emptyMessage="Nadie ha señalado un área a fortalecer."
                        />
                      </ChartCard>
                    </div>
                  </>
                )}
              </EnvelopeGate>

              {/* ---------- El mapa, resumido ---------- */}
              <SectionHeading
                kicker="Relacionamiento"
                title="Cómo se evalúan las áreas entre sí"
                aside={<MoreLink href="/admin/mapa">Ver el mapa completo</MoreLink>}
              />
              <EnvelopeGate query={map}>
                {(mapa) => (
                  <div className="grid gap-6 lg:grid-cols-2">
                    <ChartCard
                      insight={rankingInsight(mapa.ranking, mapa.suppressedRanking)}
                      subtitle="Relacionamiento que cada área recibe de las demás (0-100)"
                    >
                      <BarRanking
                        max={100}
                        bands={bands}
                        href={(row) => `/admin/areas/${row.key}`}
                        rows={mapa.ranking.slice(0, 8).map((row) => ({
                          key: row.areaCode,
                          label: row.areaName,
                          value: row.irel,
                        }))}
                        emptyMessage="Ningún área alcanza todavía la cohorte mínima."
                      />
                    </ChartCard>
                    <ChartCard
                      insight={gapInsight(mapa.gap)}
                      subtitle="Recibido menos otorgado: a la derecha, las que exigen más de lo que les exigen"
                    >
                      <DivergingBars
                        negativeLabel="Da mejor nota"
                        positiveLabel="Exige más"
                        rows={[...mapa.gap]
                          .filter((row) => row.gap !== null)
                          .sort((a, b) => Math.abs(b.gap ?? 0) - Math.abs(a.gap ?? 0))
                          .slice(0, 8)
                          .map((row) => ({ key: row.areaCode, label: row.areaName, value: row.gap }))}
                        emptyMessage="Ningún área tiene los dos lados de la brecha todavía."
                      />
                    </ChartCard>
                  </div>
                )}
              </EnvelopeGate>

              <p className="text-xs leading-relaxed text-foreground-muted">
                Corte de {corte.n} {corte.n === 1 ? 'respuesta completa' : 'respuestas completas'},
                generado el {formatDateTime(corte.generatedAt)}. Los cortes con menos de{' '}
                {corte.minCohortSize} respuestas se ocultan: con menos, publicar el dato permitiría
                deducir quién dijo qué.
              </p>
            </>
          )}
        </EnvelopeGate>
      </PageBody>
    </>
  );
}
