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
  collectionInsight,
  gapInsight,
  imcInsight,
  motivesInsight,
  npsInsight,
  priorities,
  radarInsight,
  rankingInsight,
  strengths,
  strengthsHeading,
} from '@/lib/insights';
import { formatDuration, formatIndex, formatNps, formatShare } from '@/lib/score-scale';
import { BarRanking } from '@/components/charts/BarRanking';
import { HeroFigure } from '@/components/charts/HeroFigure';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { PriorityList } from '@/components/charts/PriorityList';
import { RadarIndices } from '@/components/charts/RadarIndices';
import { Readout, ReadoutLine } from '@/components/charts/Readout';
import { StatStrip } from '@/components/charts/StatStrip';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

/**
 * El dashboard: el diagnóstico completo en una sola lectura de arriba abajo.
 *
 * Está escrito para alguien que tiene cinco minutos y tiene que decidir algo. Por eso
 * cuenta una historia en orden y no ofrece una rejilla de gráficos para explorar:
 *
 *   1. Cuánto vale la colaboración hoy, y si el dato se puede tomar en serio.
 *   2. Dónde está fuerte y dónde está rota, con nombre propio.
 *   3. Qué siente la gente al trabajar con otras áreas.
 *   4. Qué señalan como el problema.
 *   5. Qué haría falta hacer.
 *
 * Cada bloque abre con su conclusión escrita y pone el gráfico debajo como respaldo. El
 * orden inverso —gráfico primero, conclusión después si acaso— es lo que hace que un panel
 * se mire y no se use.
 *
 * Las cinco consultas van en paralelo y cada bloque resuelve la suya: una sola consulta
 * gigante dejaría la pantalla en blanco hasta que llegara la más lenta.
 */
export default function DashboardPage() {
  const overview = useQuery({ queryKey: ['overview'], queryFn: () => getOverview() });
  const indicators = useQuery({ queryKey: ['indicators'], queryFn: () => getIndicators() });
  const qualitative = useQuery({ queryKey: ['qualitative'], queryFn: () => getQualitative() });
  const map = useQuery({
    queryKey: ['relationship-map'],
    queryFn: () => getRelationshipMap(),
  });

  const bands = indicators.data?.data?.thresholds ?? [];

  return (
    <>
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div className="flex flex-col gap-1">
          <p className="text-xs font-medium uppercase tracking-wider text-brand">
            Diagnóstico organizacional
          </p>
          <h1 className="text-2xl text-foreground">Cómo colabora LinkTIC hoy</h1>
        </div>
        <button
          type="button"
          onClick={() => window.print()}
          className="rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted print:hidden"
        >
          Imprimir o guardar en PDF
        </button>
      </header>

      <EnvelopeGate query={overview}>
        {(data, meta) => {
          const veredicto = imcInsight(data.imc, bands);
          const recoleccion = collectionInsight(
            data.participation,
            data.completion,
            meta.n,
            meta.minCohortSize,
          );

          return (
            <>
              {/* ---------- 1. El titular ---------- */}
              <section className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-6">
                <div className="flex flex-wrap items-start justify-between gap-6">
                  <HeroFigure
                    label="Índice de Madurez Colaborativa"
                    value={formatIndex(data.imc.value, 1)}
                    unit="de 100"
                    band={data.imc.band}
                  />
                  <div className="min-w-[240px] flex-1">
                    <StatStrip
                      items={[
                        {
                          label: 'Participación',
                          value:
                            data.participation.rate === null
                              ? '—'
                              : formatShare(data.participation.rate),
                          hint:
                            data.participation.population === null
                              ? 'Sin población registrada'
                              : `${data.participation.completed} de ${data.participation.population}`,
                        },
                        {
                          label: 'Finalización',
                          value:
                            data.completion.rate === null
                              ? '—'
                              : formatShare(data.completion.rate),
                          hint: `${data.completion.completed} de ${data.completion.started} iniciadas`,
                        },
                        {
                          label: 'NPS interno',
                          value: formatNps(data.nps.value),
                          hint: `${data.nps.total} calificaciones`,
                        },
                        {
                          label: 'Duración mediana',
                          value: formatDuration(data.medianDurationSeconds),
                          hint: 'El instrumento estima 15 min',
                        },
                      ]}
                    />
                  </div>
                </div>

                <Readout insight={veredicto} />
                <Readout insight={recoleccion} compact />
              </section>

              {/* ---------- 2. Fuerte y roto ---------- */}
              <EnvelopeGate query={indicators}>
                {(ind) => {
                  const perfil = radarInsight(ind.radar, ind.thresholds);
                  const urgencias = priorities(ind.radar, ind.thresholds);
                  const fuertes = strengths(ind.radar, ind.thresholds);
                  const titulo = strengthsHeading(fuertes);

                  return (
                    <PanelSection
                      title="Dónde está fuerte y dónde está rota la colaboración"
                      description="Los ocho índices del instrumento en escala 0 a 100, sobre la pista completa: se lee cuánto falta, no solo quién va delante."
                    >
                      <Readout insight={perfil} />

                      <div className="grid gap-6 lg:grid-cols-2">
                        <IndicatorMeters
                          bands={ind.thresholds}
                          rows={[...ind.radar]
                            .sort((a, b) => (a.value ?? 999) - (b.value ?? 999))
                            .map((point) => ({
                              key: point.code,
                              label: point.label,
                              value: point.value,
                            }))}
                        />
                        <div className="flex flex-col gap-5">
                          <div className="flex flex-col gap-2.5">
                            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                              {titulo.title}
                            </h3>
                            {titulo.note && (
                              <p className="text-xs leading-relaxed text-tone-warn">
                                {titulo.note}
                              </p>
                            )}
                            <PriorityList items={fuertes} />
                          </div>
                          <div className="flex flex-col gap-2.5 border-t border-border-subtle pt-5">
                            <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                              Lo que hay que atacar primero
                            </h3>
                            <PriorityList items={urgencias} />
                          </div>
                        </div>
                      </div>
                    </PanelSection>
                  );
                }}
              </EnvelopeGate>

              {/* ---------- 3. La experiencia ---------- */}
              <div className="grid gap-6 lg:grid-cols-2">
                <PanelSection
                  title="Qué se siente al trabajar con otra área"
                  description="NPS interno y su composición. El número neto esconde si el reparto es indiferencia o polarización."
                >
                  <Readout insight={npsInsight(data.nps)} />
                  <NpsGauge nps={data.nps} />
                </PanelSection>

                <PanelSection
                  title="Perfil organizacional"
                  description="El mismo dato de los ocho índices, en forma de silueta: sirve para comparar dos cortes de un vistazo."
                >
                  <RadarIndices points={data.radar} />
                </PanelSection>
              </div>

              {/* ---------- 4. Qué señalan como el problema ---------- */}
              <EnvelopeGate query={qualitative}>
                {(qual) => (
                  <PanelSection
                    title="Qué señala la gente como el problema"
                    description="Obstáculos declarados y motivos del NPS. Es lo único del instrumento donde el encuestado elige el tema."
                  >
                    <Readout insight={barriersInsight(qual.barriers)} />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                          Mayores obstáculos
                        </h3>
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
                      </div>
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                          Áreas que piden fortalecer
                        </h3>
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
                      </div>
                    </div>

                    <div className="border-t border-border-subtle pt-4">
                      <ReadoutLine insight={motivesInsight(qual.npsMotives)} />
                    </div>
                  </PanelSection>
                )}
              </EnvelopeGate>

              {/* ---------- 5. El mapa, resumido ---------- */}
              <EnvelopeGate query={map}>
                {(mapa) => (
                  <PanelSection
                    title="Cómo se evalúan las áreas entre sí"
                    description="El resumen del mapa. El detalle par a par está en Mapa de relacionamiento."
                    aside={
                      <a
                        href="/admin/mapa"
                        className="shrink-0 text-xs font-medium text-brand hover:underline print:hidden"
                      >
                        Ver el mapa completo
                      </a>
                    }
                  >
                    <Readout
                      insight={rankingInsight(mapa.ranking, mapa.suppressedRanking)}
                    />

                    <div className="grid gap-6 lg:grid-cols-2">
                      <div className="flex flex-col gap-3">
                        <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                          Relacionamiento recibido
                        </h3>
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
                      </div>
                      <div className="flex flex-col justify-center">
                        <ReadoutLine insight={gapInsight(mapa.gap)} />
                      </div>
                    </div>
                  </PanelSection>
                )}
              </EnvelopeGate>

              {/* ---------- 6. La letra pequeña ---------- */}
              <footer className="flex flex-col gap-1 border-t border-border-subtle pt-4 text-xs text-foreground-muted">
                <p>
                  Corte de {meta.n} {meta.n === 1 ? 'respuesta completa' : 'respuestas completas'} ·
                  generado el {new Date(meta.generatedAt).toLocaleString('es-CO')}
                </p>
                <p>
                  Los cortes con menos de {meta.minCohortSize} respuestas se ocultan: con
                  menos, publicar el dato permitiría deducir quién dijo qué.
                </p>
              </footer>
            </>
          );
        }}
      </EnvelopeGate>
    </>
  );
}
