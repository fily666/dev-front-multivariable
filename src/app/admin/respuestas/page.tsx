'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { exportUrl, getOverview, getResponses } from '@/lib/admin-client';
import { collectionInsight } from '@/lib/insights';
import { formatDuration, formatShare } from '@/lib/score-scale';
import { Readout } from '@/components/charts/Readout';
import { StatStrip } from '@/components/charts/StatStrip';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';

const PAGE_SIZE = 50;

export default function RespuestasPage() {
  const [page, setPage] = useState(1);
  const query = useQuery({
    queryKey: ['responses', page],
    queryFn: () => getResponses(page, PAGE_SIZE),
  });
  // El mismo corte que lee el dashboard: aquí contesta «¿ya se puede cerrar la campaña?».
  const overview = useQuery({ queryKey: ['overview'], queryFn: () => getOverview() });

  return (
    <>
      <header className="flex flex-wrap items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-lg text-foreground">Respuestas</h1>
          <p className="text-sm text-foreground-muted">
            Cómo va la recolección y el listado de lo recibido.
          </p>
        </div>

        <div className="flex gap-2">
          {/* Navegación directa y no fetch: la descarga la sirve el backend por streaming
              con su propia cabecera Content-Disposition. */}
          <a
            href={exportUrl('csv')}
            className="rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted"
          >
            Descargar CSV
          </a>
          <a
            href={exportUrl('xlsx')}
            className="rounded-lg border border-border-strong px-3 py-2 text-xs font-medium text-foreground hover:bg-surface-muted"
          >
            Descargar Excel
          </a>
        </div>
      </header>

      <EnvelopeGate query={overview}>
        {(data, meta) => (
          <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5">
            <StatStrip
              items={[
                {
                  label: 'Completadas',
                  value: String(data.completion.completed),
                  hint: `de ${data.completion.started} iniciadas`,
                },
                {
                  label: 'Participación',
                  value:
                    data.participation.rate === null
                      ? '—'
                      : formatShare(data.participation.rate),
                  hint:
                    data.participation.population === null
                      ? 'Sin población registrada'
                      : `de ${data.participation.population} personas`,
                },
                {
                  label: 'Finalización',
                  value:
                    data.completion.rate === null ? '—' : formatShare(data.completion.rate),
                  hint: 'de las que se abrieron',
                },
                {
                  label: 'Duración mediana',
                  value: formatDuration(data.medianDurationSeconds),
                  hint: 'El instrumento estima 15 min',
                },
              ]}
            />
            <Readout
              insight={collectionInsight(
                data.participation,
                data.completion,
                meta.n,
                meta.minCohortSize,
              )}
            />
          </section>
        )}
      </EnvelopeGate>

      <PanelSection
        title="Listado"
        description="La encuesta es anónima: no se guarda el nombre. El área y el cargo son obligatorios y sirven para leer los resultados por proceso y por nivel."
      >
        <EnvelopeGate query={query}>
          {(data) => (
            <div className="flex flex-col gap-4">
              <div className="overflow-x-auto">
                <table className="w-full min-w-[680px] text-sm">
                  <thead>
                    <tr className="border-b border-border-subtle text-left">
                      <th className="py-2 text-xs font-medium text-foreground-muted">Área</th>
                      <th className="py-2 text-xs font-medium text-foreground-muted">Cargo</th>
                      <th className="py-2 text-xs font-medium text-foreground-muted">Enviada</th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Duración
                      </th>
                      <th className="py-2 text-right text-xs font-medium text-foreground-muted">
                        Respuestas
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.rows.map((row) => (
                      <tr key={row.id} className="border-b border-border-subtle">
                        <td className="py-2 text-foreground">
                          {row.ownAreaName ?? row.ownArea ?? '—'}
                          {row.ownAreaOther && (
                            <span className="ml-1.5 text-xs text-foreground-muted">
                              ({row.ownAreaOther})
                            </span>
                          )}
                        </td>
                        <td className="py-2 text-foreground-muted">
                          {row.respondentRoleLabel ?? row.respondentRole ?? '—'}
                        </td>
                        <td className="py-2 text-foreground-muted">
                          {row.submittedAt
                            ? new Date(row.submittedAt).toLocaleString('es-CO')
                            : '—'}
                        </td>
                        <td className="py-2 text-right tabular-nums text-foreground-muted">
                          {formatDuration(row.durationSeconds)}
                        </td>
                        <td className="py-2 text-right tabular-nums text-foreground-muted">
                          {row.answerCount}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between gap-3">
                <p className="text-xs text-foreground-muted">
                  {data.total} respuestas · página {data.page} de{' '}
                  {Math.max(1, Math.ceil(data.total / data.pageSize))}
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    disabled={page <= 1}
                    onClick={() => setPage((current) => Math.max(1, current - 1))}
                    className="rounded-md border border-border-strong px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
                  >
                    Anterior
                  </button>
                  <button
                    type="button"
                    disabled={page * data.pageSize >= data.total}
                    onClick={() => setPage((current) => current + 1)}
                    className="rounded-md border border-border-strong px-3 py-1.5 text-xs text-foreground disabled:opacity-40"
                  >
                    Siguiente
                  </button>
                </div>
              </div>
            </div>
          )}
        </EnvelopeGate>
      </PanelSection>
    </>
  );
}
