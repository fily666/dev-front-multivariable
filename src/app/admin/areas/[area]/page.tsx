'use client';

import { use } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { getAreaDetail } from '@/lib/admin-client';
import { ASPECT_LABELS } from '@/lib/admin.types';
import { formatIndex } from '@/lib/score-scale';
import { useThresholds } from '@/lib/use-thresholds';
import { BandChip } from '@/components/charts/BandChip';
import { BarRanking } from '@/components/charts/BarRanking';
import { KpiCard } from '@/components/charts/KpiCard';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

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
              <h1 className="text-lg font-semibold text-foreground">{data.area.name}</h1>
              <p className="text-sm text-foreground-muted">
                Cómo evalúan a esta área las demás, y cómo evalúa ella a las otras.
              </p>
            </header>

            <div className="grid gap-4 sm:grid-cols-3">
              <KpiCard
                label="Relacionamiento recibido"
                value={formatIndex(data.gap?.received ?? null, 1)}
                unit="de 100"
                band={data.gapBand}
                hint="Promedio que le otorgan las otras áreas"
              />
              <KpiCard
                label="Relacionamiento otorgado"
                value={formatIndex(data.gap?.granted ?? null, 1)}
                unit="de 100"
                hint="Promedio que esta área da a las demás"
              />
              <KpiCard
                label="Brecha de percepción"
                value={
                  data.gap?.gap === null || data.gap?.gap === undefined
                    ? '—'
                    : `${data.gap.gap > 0 ? '+' : ''}${data.gap.gap.toFixed(1)}`
                }
                hint={
                  data.gap?.gap == null
                    ? 'Falta uno de los dos lados'
                    : data.gap.gap > 0
                      ? 'Se percibe mejor de lo que percibe'
                      : 'Es más exigente de lo que la evalúan'
                }
              />
            </div>

            <PanelSection
              title="Aspectos evaluados"
              description="Los cinco aspectos del componente 2 que las otras áreas califican sobre esta."
            >
              {data.aspects ? (
                <BarRanking
                  max={100}
                  bands={bands}
                  rows={Object.keys(ASPECT_LABELS).map((code) => ({
                    key: code,
                    label: ASPECT_LABELS[code],
                    value: data.aspects?.aspects[code] ?? null,
                  }))}
                />
              ) : (
                <p className="text-sm text-foreground-muted">
                  Sin evaluaciones por aspecto todavía.
                </p>
              )}
            </PanelSection>

            <PanelSection
              title="NPS interno del área"
              description="Qué tan probable es que recomienden trabajar con esta área."
            >
              <NpsGauge nps={data.nps} />
            </PanelSection>

            {data.area.headcount !== null && (
              <p className="text-xs text-foreground-muted">
                Población registrada del área: {data.area.headcount} personas ·{' '}
                <BandChip band={data.gapBand} />
              </p>
            )}
          </>
        )}
      </EnvelopeGate>
    </>
  );
}
