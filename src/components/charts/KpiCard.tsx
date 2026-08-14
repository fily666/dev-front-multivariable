import type { ReactNode } from 'react';
import type { ThresholdBand } from '@/lib/admin.types';
import { BandChip } from './BandChip';

interface KpiCardProps {
  label: string;
  value: string;
  /** Unidad o escala, p. ej. "de 100" o "−100 a +100". */
  unit?: string;
  band?: ThresholdBand | null;
  hint?: string;
  children?: ReactNode;
}

/**
 * Tarjeta de un KPI. El número es el protagonista: es lo que alguien busca al abrir el
 * panel, así que no compite con decoración.
 */
export function KpiCard({ label, value, unit, band, hint, children }: KpiCardProps) {
  return (
    <article className="flex flex-col gap-2 rounded-xl border border-border-subtle bg-surface p-5">
      <h3 className="text-xs font-medium uppercase tracking-wide text-foreground-muted">
        {label}
      </h3>

      <p className="flex items-baseline gap-1.5">
        <span className="text-3xl font-semibold tabular-nums text-foreground">{value}</span>
        {unit && <span className="text-xs text-foreground-muted">{unit}</span>}
      </p>

      {band !== undefined && <BandChip band={band} />}
      {hint && <p className="text-xs text-foreground-muted">{hint}</p>}
      {children}
    </article>
  );
}
