'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getQualitative, updateTheme } from '@/lib/admin-client';
import { BarRanking } from '@/components/charts/BarRanking';
import { EmptyState } from '@/components/charts/InsufficientData';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';
import type { CountedOption, OpenAnswer } from '@/lib/admin.types';

export default function CualitativoPage() {
  const query = useQuery({ queryKey: ['qualitative'], queryFn: () => getQualitative() });

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">
          Oportunidades de transformación
        </h1>
        <p className="text-sm text-foreground-muted">
          Barreras, reprocesos y las respuestas abiertas del instrumento.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data) => (
          <>
            <PanelSection
              title="Mayores obstáculos para trabajar entre áreas"
              description="Selección múltiple: los porcentajes se calculan sobre encuestados, así que suman más de 100."
            >
              <BarRanking rows={toRows(data.barriers)} suffix="%" max={100} />
            </PanelSection>

            <div className="grid gap-6 lg:grid-cols-2">
              <PanelSection title="Procesos que generan más reprocesos">
                <BarRanking rows={toRows(data.reworkProcesses)} suffix="%" max={100} />
              </PanelSection>

              <PanelSection title="Áreas que necesitan fortalecer su relacionamiento">
                <BarRanking rows={toRows(data.areasToStrengthen)} suffix="%" max={100} />
              </PanelSection>
            </div>

            <PanelSection
              title="Motivos del NPS"
              description="Separados por segmento. Un mismo motivo puede aparecer en ambos lados, y ahí está la lectura interesante."
            >
              <div className="grid gap-6 sm:grid-cols-2">
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Promotores
                  </h3>
                  <BarRanking
                    rows={toRows(data.npsMotives.promoters)}
                    suffix="%"
                    max={100}
                    emptyMessage="Sin motivos de promotores todavía."
                  />
                </div>
                <div className="flex flex-col gap-3">
                  <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
                    Detractores
                  </h3>
                  <BarRanking
                    rows={toRows(data.npsMotives.detractors)}
                    suffix="%"
                    max={100}
                    emptyMessage="Sin motivos de detractores todavía."
                  />
                </div>
              </div>
            </PanelSection>

            <PanelSection
              title="Si pudiera cambiar una sola cosa"
              description="Respuestas abiertas. Asigne un tema para poder agruparlas; la clasificación es manual y queda auditada."
            >
              <OpenAnswersList answers={data.openAnswers} />
            </PanelSection>
          </>
        )}
      </EnvelopeGate>
    </>
  );
}

function toRows(options: CountedOption[]) {
  return options.map((option) => ({
    key: option.value,
    label: option.label,
    value: option.share,
    hint: `${option.count} ${option.count === 1 ? 'mención' : 'menciones'}`,
  }));
}

function OpenAnswersList({ answers }: { answers: OpenAnswer[] }) {
  const queryClient = useQueryClient();
  const [drafts, setDrafts] = useState<Record<string, string>>({});

  const mutation = useMutation({
    mutationFn: ({ id, theme }: { id: string; theme: string | null }) =>
      updateTheme(id, theme),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['qualitative'] }),
  });

  if (answers.length === 0) {
    return <EmptyState message="Nadie ha dejado una respuesta abierta todavía." />;
  }

  return (
    <ul className="flex flex-col gap-4">
      {answers.map((answer) => {
        const draft = drafts[answer.id] ?? answer.theme ?? '';
        const dirty = draft !== (answer.theme ?? '');

        return (
          <li
            key={answer.id}
            className="flex flex-col gap-3 rounded-lg border border-border-subtle bg-surface-muted p-4"
          >
            <p className="text-sm leading-relaxed text-foreground">{answer.text}</p>

            <div className="flex flex-wrap items-center gap-3 text-xs text-foreground-muted">
              <span>{answer.ownArea ?? 'Área sin declarar'}</span>
              {answer.submittedAt && (
                <span>{new Date(answer.submittedAt).toLocaleDateString('es-CO')}</span>
              )}
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <label className="flex flex-1 items-center gap-2 text-xs">
                <span className="text-foreground-muted">Tema</span>
                <input
                  type="text"
                  value={draft}
                  maxLength={120}
                  placeholder="Sin clasificar"
                  onChange={(event) =>
                    setDrafts((previous) => ({ ...previous, [answer.id]: event.target.value }))
                  }
                  className="min-w-0 flex-1 rounded-md border border-border-subtle bg-surface px-3 py-1.5 text-foreground"
                />
              </label>
              <button
                type="button"
                disabled={!dirty || mutation.isPending}
                onClick={() =>
                  mutation.mutate({ id: answer.id, theme: draft.trim() || null })
                }
                className="rounded-md bg-brand px-3 py-1.5 text-xs font-medium text-white hover:bg-brand-hover disabled:opacity-40"
              >
                Guardar
              </button>
            </div>
          </li>
        );
      })}
    </ul>
  );
}
