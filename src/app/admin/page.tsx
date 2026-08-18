'use client';

import { useQuery } from '@tanstack/react-query';
import { getOverview } from '@/lib/admin-client';
import { formatDuration, formatIndex, formatNps, formatShare } from '@/lib/score-scale';
import { KpiCard } from '@/components/charts/KpiCard';
import { NpsGauge } from '@/components/charts/NpsGauge';
import { RadarIndices } from '@/components/charts/RadarIndices';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

export default function AdminOverviewPage() {
  const query = useQuery({ queryKey: ['overview'], queryFn: () => getOverview() });

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">Resumen del diagnóstico</h1>
        <p className="text-sm text-foreground-muted">
          Indicadores agregados de la campaña activa.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data, meta) => (
          <>
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              <KpiCard
                label="Índice de Madurez Colaborativa"
                value={formatIndex(data.imc.value)}
                unit="de 100"
                band={data.imc.band}
                hint={`${data.imc.respondents} respuestas`}
              />
              <KpiCard
                label="NPS interno"
                value={formatNps(data.nps.value)}
                unit="de −100 a +100"
                hint={`${data.nps.total} calificaciones de área`}
              />
              <KpiCard
                label="Participación"
                value={
                  data.participation.rate === null
                    ? '—'
                    : formatShare(data.participation.rate)
                }
                hint={
                  data.participation.population === null
                    ? 'Defina el número de personas por área para calcularla'
                    : `${data.participation.completed} de ${data.participation.population} personas`
                }
              />
              <KpiCard
                label="Finalización"
                value={
                  data.completion.rate === null ? '—' : formatShare(data.completion.rate)
                }
                hint={`${data.completion.completed} completadas de ${data.completion.started} iniciadas`}
              />
              <KpiCard
                label="Duración mediana"
                value={formatDuration(data.medianDurationSeconds)}
                hint="El instrumento estima 15 minutos"
              />
              <KpiCard
                label="Área que genera más valor"
                value={data.topValueArea?.name ?? '—'}
                hint={
                  data.topValueArea
                    ? `${data.topValueArea.mentions} menciones`
                    : 'Sin menciones todavía'
                }
              />
            </div>

            <PanelSection
              title="Perfil organizacional"
              description="Los siete índices que componen el IMC más el nivel de interacción, en escala 0 a 100."
            >
              <RadarIndices points={data.radar} />
            </PanelSection>

            <PanelSection
              title="Experiencia de servicio interno"
              description="NPS interno y su composición. Un mismo NPS puede venir de todos pasivos o de mitad promotores y mitad detractores, y son diagnósticos opuestos."
            >
              <NpsGauge nps={data.nps} />
            </PanelSection>

            <p className="text-xs text-foreground-muted">
              Corte de {meta.n} respuestas completadas · generado{' '}
              {new Date(meta.generatedAt).toLocaleString('es-CO')}
            </p>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}
