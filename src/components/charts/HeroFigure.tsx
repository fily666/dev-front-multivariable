import type { ReactNode } from 'react';
import type { ThresholdBand } from '@/lib/admin.types';

/**
 * La cifra con la que abre el panel.
 *
 * Sin `tabular-nums`: a este tamaño los dígitos de ancho fijo dejan huecos y un «11» se ve
 * suelto. La alineación tabular es para columnas de tabla, no para una cifra sola.
 */
export function HeroFigure({
  label,
  value,
  unit,
  band,
  children,
}: {
  label: string;
  value: string;
  unit?: string;
  band?: ThresholdBand | null;
  children?: ReactNode;
}) {
  return (
    <div className="flex flex-col gap-2">
      <p className="text-xs font-medium uppercase tracking-wider text-foreground-muted">
        {label}
      </p>
      <p className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
        <span className="text-6xl font-black leading-none tracking-tight text-foreground">
          {value}
        </span>
        {unit && <span className="text-sm text-foreground-muted">{unit}</span>}
        {band && (
          <span
            className="inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold"
            style={{ backgroundColor: `${band.color}1f`, color: band.color }}
          >
            <span
              aria-hidden
              className="size-2 rounded-full"
              style={{ backgroundColor: band.color }}
            />
            {band.label}
          </span>
        )}
      </p>
      {children}
    </div>
  );
}
