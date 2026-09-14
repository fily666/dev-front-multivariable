'use client';

import { useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { getQualitative, updateTheme } from '@/lib/admin-client';
import {
  barriersInsight,
  motivesInsight,
  openAnswersInsight,
  strengthenInsight,
} from '@/lib/insights';
import { useAreaNames } from '@/lib/use-area-names';
import { BarRanking } from '@/components/charts/BarRanking';
import { OpposedBars } from '@/components/charts/OpposedBars';
import { Readout } from '@/components/charts/Readout';
import { EmptyState } from '@/components/charts/InsufficientData';
import { EnvelopeGate, PanelSection } from '@/components/charts/PanelSection';
import type { CountedOption, OpenAnswer } from '@/lib/admin.types';

export default function CualitativoPage() {
  const query = useQuery({ queryKey: ['qualitative'], queryFn: () => getQualitative() });

  return (
    <>
      <header className="flex flex-col gap-1">
        <h1 className="text-lg text-foreground">Oportunidades de transformación</h1>
        <p className="text-sm text-foreground-muted">
          Lo que la gente señala como el problema, con sus propias palabras y con las
          opciones que marcó.
        </p>
      </header>

      <EnvelopeGate query={query}>
        {(data, meta) => (
          <>
            <PanelSection
              title="Qué frena el trabajo entre áreas"
              description="Selección múltiple: los porcentajes son sobre encuestados, así que suman más de 100. Lo que importa es la distancia entre el primero y el segundo, no el valor absoluto."
            >
              <Readout insight={barriersInsight(data.barriers)} />
              <BarRanking rows={toRows(data.barriers)} suffix="%" max={100} />
            </PanelSection>

            <PanelSection
              title="Por qué recomiendan y por qué no"
              description="Los motivos del NPS, enfrentados en lugar de en dos listas: así se ve de una vez si un mismo motivo pesa en los dos lados."
            >
              <Readout insight={motivesInsight(data.npsMotives)} />
              <OpposedBars
                promoters={data.npsMotives.promoters}
                detractors={data.npsMotives.detractors}
              />
            </PanelSection>

            <div className="grid gap-6 lg:grid-cols-2">
              <PanelSection
                title="Procesos que generan más reprocesos"
                description="Marcado sobre la gestión completa, no sobre el subproceso."
              >
                <BarRanking
                  rows={toRows(data.reworkProcesses)}
                  suffix="%"
                  max={100}
                  emptyMessage="Nadie ha señalado un proceso todavía."
                />
              </PanelSection>

              <PanelSection
                title="Áreas que piden fortalecer"
                description="Es una petición de más relación, no una queja de desempeño."
              >
                <Readout insight={strengthenInsight(data.areasToStrengthen)} compact />
                <BarRanking
                  rows={toRows(data.areasToStrengthen)}
                  suffix="%"
                  max={100}
                  emptyMessage="Nadie ha señalado un área todavía."
                />
              </PanelSection>
            </div>

            <PanelSection
              title="Si pudiera cambiar una sola cosa"
              description="Lo único del instrumento donde el encuestado escribe con sus palabras. Asigne un tema para poder contarlas junto a las preguntas cerradas; la clasificación es manual y queda auditada."
            >
              <Readout insight={openAnswersInsight(data.openAnswers, meta.n)} />
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
  const nombreDe = useAreaNames();
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
              <span>{answer.ownArea ? nombreDe(answer.ownArea) : 'Área sin declarar'}</span>
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
