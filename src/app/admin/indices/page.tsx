'use client';

import { useQuery } from '@tanstack/react-query';
import { getIndicators, getNps } from '@/lib/admin-client';
import { npsInsight, priorities, radarInsight } from '@/lib/insights';
import { formatIndex, formatNps } from '@/lib/score-scale';
import { BarRanking } from '@/components/charts/BarRanking';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { PriorityList } from '@/components/charts/PriorityList';
import { RadarIndices } from '@/components/charts/RadarIndices';
import { Readout } from '@/components/charts/Readout';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

/**
 * Los índices, con su construcción a la vista.
 *
 * El dashboard dice qué pasa; esta pantalla dice de dónde sale. Es la que se abre cuando
 * alguien pregunta «¿y ese 56 cómo se calculó?», así que muestra los pesos del compuesto y
 * el NPS desagregado por área, que el dashboard resume en una sola cifra.
 */
export default function IndicesPage() {
  const query = useQuery({ queryKey: ['indicators'], queryFn: () => getIndicators() });
  const nps = useQuery({ queryKey: ['nps'], queryFn: () => getNps() });

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">Índices</h1>
        <p className="text-sm text-foreground-muted">
          Los ocho índices del instrumento, cómo se combinan en el índice compuesto y cómo
          se reparte la experiencia entre áreas.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data, meta) => {
          const pesos = new Map(data.weights.map((w) => [w.indicatorCode, w.weight]));

          return (
            <>
              <PanelSection
                title="Los ocho índices"
                description="Escala 0 a 100, sobre la pista completa. Las marcas de la pista son los cortes del semáforo, así que se ve a qué distancia está cada índice de cambiar de banda."
              >
                <Readout insight={radarInsight(data.radar, data.thresholds)} />
                <IndicatorMeters
                  bands={data.thresholds}
                  rows={[...data.radar]
                    .sort((a, b) => (a.value ?? 999) - (b.value ?? 999))
                    .map((point) => ({
                      key: point.code,
                      label: point.label,
                      value: point.value,
                      hint:
                        pesos.get(point.code) !== undefined
                          ? `Pesa ${Math.round((pesos.get(point.code) ?? 0) * 100)}% del índice compuesto`
                          : 'No entra en el índice compuesto',
                    }))}
                />
              </PanelSection>

              <div className="grid gap-6 lg:grid-cols-2">
                <PanelSection
                  title="Perfil organizacional"
                  description="La silueta de los ocho índices. Escala fija 0-100 para que dos cortes distintos se puedan superponer."
                >
                  <RadarIndices points={data.radar} />
                </PanelSection>

                <PanelSection
                  title="Cómo se arma el índice compuesto"
                  description="El IMC no es un promedio simple: cada índice entra con el peso que fija el instrumento."
                >
                  <div className="flex flex-col gap-4">
                    <p className="flex items-baseline gap-2">
                      <span className="text-3xl font-bold text-foreground">
                        {formatIndex(data.composite.value, 1)}
                      </span>
                      <span className="text-xs text-foreground-muted">
                        de 100 · {data.composite.respondents} respuestas
                      </span>
                    </p>
                    <BarRanking
                      suffix="%"
                      max={Math.max(...data.weights.map((w) => w.weight * 100), 1)}
                      rows={data.weights.map((weight) => {
                        const punto = data.radar.find((p) => p.code === weight.indicatorCode);
                        return {
                          key: weight.indicatorCode,
                          label: punto?.label ?? weight.indicatorCode,
                          value: weight.weight * 100,
                          hint:
                            punto?.value != null
                              ? `Vale ${formatIndex(punto.value, 1)} y aporta ${formatIndex(punto.value * weight.weight, 1)} puntos`
                              : 'Sin dato todavía',
                        };
                      })}
                    />
                  </div>
                </PanelSection>
              </div>

              <PanelSection
                title="Qué atacar primero"
                description="Los tres índices más bajos, con un punto de partida para cada uno."
              >
                <PriorityList items={priorities(data.radar, data.thresholds)} />
              </PanelSection>

              <EnvelopeGate query={nps}>
                {(npsData) => (
                  <PanelSection
                    title="Experiencia de servicio interno"
                    description="El NPS interno, su composición y su reparto por área evaluada."
                  >
                    <Readout insight={npsInsight(npsData.global)} />
                    <NpsGauge nps={npsData.global} />

                    <div className="border-t border-border-subtle pt-4">
                      <h3 className="mb-3 text-xs font-medium uppercase tracking-wide text-foreground-muted">
                        NPS por área evaluada
                      </h3>
                      <BarRanking
                        max={100}
                        href={(row) => `/admin/areas/${row.key}`}
                        rows={[...npsData.byArea]
                          .sort((a, b) => (b.value ?? -101) - (a.value ?? -101))
                          .map((row) => ({
                            key: row.areaCode,
                            label: row.areaName,
                            // La barra se mide sobre 0-100 porque no puede dibujar un valor
                            // negativo, pero el número que se lee es el NPS real: mostrar el
                            // valor normalizado sería publicar una cifra que no existe en
                            // ningún informe.
                            value: row.value === null ? null : (row.value + 100) / 2,
                            display: row.value === null ? '—' : formatNps(row.value),
                            hint: `${row.total} ${row.total === 1 ? 'calificación' : 'calificaciones'}`,
                          }))}
                        emptyMessage="Ningún área alcanza la cohorte mínima para publicar su NPS."
                      />
                      <p className="mt-3 text-xs text-foreground-muted">
                        El número es el NPS real, de −100 a +100. La barra está normalizada
                        a 0…100 porque no puede dibujar un valor negativo.
                      </p>
                    </div>
                  </PanelSection>
                )}
              </EnvelopeGate>

              <p className="text-xs text-foreground-muted">
                Corte de {meta.n} respuestas · generado{' '}
                {new Date(meta.generatedAt).toLocaleString('es-CO')}
              </p>
            </>
          );
        }}
      </EnvelopeGate>
    </>
  );
}
