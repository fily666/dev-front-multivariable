'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getAreaDetail } from '@/lib/admin-client';
import { ASPECT_LABELS } from '@/lib/admin.types';
import { npsInsight, toneOfBand, type Insight } from '@/lib/insights';
import { classify, formatIndex } from '@/lib/score-scale';
import { useThresholds } from '@/lib/use-thresholds';
import { IndicatorMeters } from '@/components/charts/IndicatorMeter';
import { HeroFigure } from '@/components/charts/HeroFigure';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { Readout } from '@/components/charts/Readout';
import { StatStrip } from '@/components/charts/StatStrip';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';
import type { AreaDetailPayload, ThresholdBand } from '@/lib/admin.types';

export default function AreaDetailPage({ params }: PageProps<'/admin/areas/[area]'>) {
  // En Next 16 los params son una promesa; `use` los desenvuelve en el cliente.
  const { area } = use(params);
  const query = useQuery({
    queryKey: ['area', area],
    queryFn: () => getAreaDetail(area),
  });
  const bands = useThresholds();

  return (
    <>
      <nav className="text-xs text-foreground-muted">
        <Link href="/admin/mapa" className="hover:text-foreground">
          ← Volver al mapa de relacionamiento
        </Link>
      </nav>

      <EnvelopeGate query={query}>
        {(data) => (
          <>
            <header className="flex flex-col gap-1">
              <h1 className="text-lg text-foreground">{data.area.name}</h1>
              <p className="text-sm text-foreground-muted">
                Cómo la evalúan las demás áreas, y cómo evalúa ella a las otras.
              </p>
            </header>

            <section className="flex flex-col gap-5 rounded-xl border border-border-subtle bg-surface p-6">
              <div className="flex flex-wrap items-start justify-between gap-6">
                <HeroFigure
                  label="Relacionamiento recibido"
                  value={formatIndex(data.gap?.received ?? null, 1)}
                  unit="de 100"
                  band={data.gapBand}
                />
                <div className="min-w-[220px] flex-1">
                  <StatStrip
                    items={[
                      {
                        label: 'Otorga a las demás',
                        value: formatIndex(data.gap?.granted ?? null, 1),
                        hint: 'Promedio que esta área da',
                      },
                      {
                        label: 'Brecha',
                        value:
                          data.gap?.gap == null
                            ? '—'
                            : `${data.gap.gap > 0 ? '+' : ''}${data.gap.gap.toFixed(1)}`,
                        hint: 'Recibido menos otorgado',
                      },
                      {
                        label: 'Población',
                        value:
                          data.area.headcount === null ? '—' : String(data.area.headcount),
                        hint: data.area.headcount === null ? 'Sin registrar' : 'personas',
                      },
                    ]}
                  />
                </div>
              </div>

              <Readout insight={areaInsight(data, bands)} />
            </section>

            <PanelSection
              title="En qué es fuerte y en qué falla"
              description="Los cinco aspectos que las otras áreas califican sobre esta, de peor a mejor."
            >
              {data.aspects ? (
                <>
                  <Readout insight={aspectDetailInsight(data, bands)} />
                  <IndicatorMeters
                    bands={bands}
                    rows={Object.keys(ASPECT_LABELS)
                      .map((code) => ({
                        key: code,
                        label: ASPECT_LABELS[code],
                        value: data.aspects?.aspects[code] ?? null,
                      }))
                      .sort((a, b) => (a.value ?? 999) - (b.value ?? 999))}
                  />
                </>
              ) : (
                <p className="text-sm text-foreground-muted">
                  Sin evaluaciones por aspecto todavía.
                </p>
              )}
            </PanelSection>

            <PanelSection
              title="Qué tan probable es que la recomienden"
              description="El NPS interno de esta área, con su composición."
            >
              <Readout insight={npsInsight(data.nps)} />
              <NpsGauge nps={data.nps} />
            </PanelSection>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}

/** Qué significa la brecha de ESTA área, dicho en una frase. */
function areaInsight(data: AreaDetailPayload, bands: ThresholdBand[]): Insight {
  const { gap } = data;
  if (!gap || gap.received === null) {
    return {
      tone: 'neutral',
      headline: 'Todavía no hay evaluaciones suficientes sobre esta área.',
    };
  }

  const tone = toneOfBand(data.gapBand, bands);
  const banda = data.gapBand?.label ?? 'sin banda';

  if (gap.gap === null) {
    return {
      tone,
      headline: `Las demás áreas la califican en ${gap.received.toFixed(1)} sobre 100 («${banda}»).`,
      detail: 'Falta el otro lado de la brecha: esta área todavía no ha evaluado a las demás.',
    };
  }

  const magnitud = Math.abs(gap.gap);
  if (magnitud < 5) {
    return {
      tone,
      headline: `Da y recibe casi lo mismo (${gap.received.toFixed(1)} contra ${gap.granted?.toFixed(1)}): sus expectativas están alineadas con las del resto.`,
      detail: `Banda «${banda}».`,
    };
  }

  // Brecha = recibido − otorgado. Positiva: recibe más de lo que reparte, es la exigente.
  return {
    tone: magnitud >= 15 ? 'warn' : tone,
    headline:
      gap.gap > 0
        ? `Es más exigente de lo que la evalúan: califica ${magnitud.toFixed(1)} puntos por debajo de la nota que ella recibe.`
        : `La califican peor de lo que ella califica: ${magnitud.toFixed(1)} puntos por debajo de lo que reparte.`,
    detail:
      gap.gap > 0
        ? 'Conviene revisar si está midiendo a las demás con una vara distinta a la que le aplican a ella.'
        : 'Suele pasar en áreas de las que todos dependen: reparten buena nota y cargan con la insatisfacción ajena.',
  };
}

/** El aspecto más flojo de esta área concreta. */
function aspectDetailInsight(data: AreaDetailPayload, bands: ThresholdBand[]): Insight {
  const entradas = Object.keys(ASPECT_LABELS)
    .map((code) => ({ code, label: ASPECT_LABELS[code], value: data.aspects?.aspects[code] ?? null }))
    .filter((entry): entry is { code: string; label: string; value: number } => entry.value !== null);

  if (entradas.length < 2) {
    return { tone: 'neutral', headline: 'Faltan aspectos con dato para compararlos.' };
  }

  const ordenados = [...entradas].sort((a, b) => a.value - b.value);
  const peor = ordenados[0];
  const mejor = ordenados[ordenados.length - 1];
  const distancia = mejor.value - peor.value;

  if (distancia < 8) {
    return {
      tone: toneOfBand(classify(peor.value, bands), bands),
      headline: `Los cinco aspectos van parejos, entre ${peor.value.toFixed(1)} y ${mejor.value.toFixed(1)}.`,
      detail: 'No hay una falla puntual: lo que se mueva tiene que moverse en bloque.',
    };
  }

  return {
    tone: toneOfBand(classify(peor.value, bands), bands),
    headline: `Donde más falla es en ${peor.label.toLowerCase()} (${peor.value.toFixed(1)}); donde mejor está es en ${mejor.label.toLowerCase()} (${mejor.value.toFixed(1)}).`,
    detail: `${distancia.toFixed(1)} puntos de diferencia: es una falla concreta, no una percepción general.`,
  };
}
