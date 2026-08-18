'use client';

import { useQuery } from '@tanstack/react-query';
import { getComponents, getIndicesByArea } from '@/lib/admin-client';
import { formatIndex } from '@/lib/score-scale';
import { BandChip } from '@/components/charts/BandChip';
import { StackedBars } from '@/components/charts/StackedBars';
import { EmptyState } from '@/components/charts/InsufficientData';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

export default function ComponentesPage() {
  const query = useQuery({ queryKey: ['components'], queryFn: () => getComponents() });
  const byArea = useQuery({
    queryKey: ['indices-by-area'],
    queryFn: () => getIndicesByArea(),
  });

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">Detalle por componente</h1>
        <p className="text-sm text-foreground-muted">
          Los indicadores del instrumento con su banda semafórica.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data) => (
          <>
            <PanelSection
              title="Indicadores"
              description="Escala 0 a 100. El NPS interno se reporta aparte porque su escala va de −100 a +100."
            >
              <div className="overflow-x-auto">
                <table className="w-full min-w-[560px] text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left">
                      <th className="py-2 text-xs font-medium text-foreground-muted">Indicador</th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Valor
                      </th>
                      <th className="py-2 text-xs font-medium text-foreground-muted">Nivel</th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Respuestas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.indicators.map((indicator) => (
                      <tr key={indicator.code} className="border-b border-border-subtle">
                        <td className="py-2 text-foreground">
                          {indicator.label}
                          <span className="ml-2 text-xs text-foreground-muted">
                            {indicator.code}
                          </span>
                        </td>
                        <td className="py-2 text-right font-medium tabular-nums text-foreground">
                          {formatIndex(indicator.value, 1)}
                        </td>
                        <td className="py-2">
                          <BandChip band={indicator.band} />
                        </td>
                        <td className="py-2 text-right tabular-nums text-foreground-muted">
                          {indicator.respondents}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </PanelSection>

            <PanelSection
              title="Tiempo de respuesta percibido"
              description="Cuánto tarda una área en responder una solicitud, según quien la hizo. Alimenta el Índice de Agilidad."
            >
              <StackedBars rows={data.responseTimes} />
            </PanelSection>

            <PanelSection
              title="Red de innovación"
              description="Iniciativas conjuntas de los últimos seis meses. Las áreas que no aparecen aquí son las que no han desarrollado nada con nadie."
            >
              {data.innovationNetwork.length === 0 ? (
                <EmptyState message="Sin iniciativas conjuntas registradas." />
              ) : (
                <ul className="flex flex-col gap-2">
                  {data.innovationNetwork.map((edge) => (
                    <li
                      key={`${edge.sourceArea}-${edge.targetArea}`}
                      className="flex items-center justify-between gap-3 border-b border-border-subtle py-1.5 text-sm"
                    >
                      <span className="text-foreground">
                        {edge.sourceArea} → {edge.targetArea}
                      </span>
                      <span className="tabular-nums text-foreground-muted">
                        {edge.initiatives}{' '}
                        {edge.initiatives === 1 ? 'mención' : 'menciones'}
                      </span>
                    </li>
                  ))}
                </ul>
              )}
            </PanelSection>

            <PanelSection
              title="Índices por área de origen"
              description="Los mismos indicadores, según el área a la que pertenece quien respondió. Revela si la percepción crítica se concentra en un área."
            >
              <EnvelopeGate query={byArea}>
                {(areaData) =>
                  areaData.rows.length === 0 ? (
                    <EmptyState message="Ningún área alcanza la cohorte mínima para desglosarse." />
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full min-w-[720px] text-sm">
                        <thead>
                          <tr className="border-b border-border-subtle text-left">
                            <th className="py-2 text-xs font-medium text-foreground-muted">
                              Área
                            </th>
                            <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                              n
                            </th>
                            {INDEX_COLUMNS.map((code) => (
                              <th
                                key={code}
                                className="py-2 text-right text-xs font-medium text-foreground-muted"
                              >
                                {code}
                              </th>
                            ))}
                          </tr>
                        </thead>
                        <tbody>
                          {areaData.rows.map((row) => (
                            <tr key={row.areaCode} className="border-b border-border-subtle">
                              <td className="py-2 text-foreground">{row.areaName}</td>
                              <td className="py-2 text-right tabular-nums text-foreground-muted">
                                {row.respondents}
                              </td>
                              {INDEX_COLUMNS.map((code) => (
                                <td
                                  key={code}
                                  className="py-2 text-right tabular-nums text-foreground"
                                >
                                  {formatIndex(row.indicators[code] ?? null)}
                                </td>
                              ))}
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {areaData.suppressed > 0 && (
                        <p className="mt-3 text-xs text-foreground-muted">
                          {areaData.suppressed}{' '}
                          {areaData.suppressed === 1 ? 'área oculta' : 'áreas ocultas'} por
                          cohorte insuficiente.
                        </p>
                      )}
                    </div>
                  )
                }
              </EnvelopeGate>
            </PanelSection>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}

/** Los siete del IMC más NIO: el mismo conjunto que el radar. */
const INDEX_COLUMNS = ['IREL', 'ICOM', 'ISI', 'IAG', 'IINT', 'ICOL', 'IINN', 'NIO'];
