import type { ReactNode } from 'react';
import type { Envelope } from '@/lib/admin.types';
import { InsufficientData } from './InsufficientData';

/** Encabezado de sección con su explicación. */
export function PanelSection({
  title,
  description,
  children,
  aside,
}: {
  title: string;
  description?: string;
  children: ReactNode;
  aside?: ReactNode;
}) {
  return (
    <section className="flex flex-col gap-4 rounded-xl border border-border-subtle bg-surface p-5">
      <header className="flex items-start justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h2 className="text-sm font-semibold text-foreground">{title}</h2>
          {description && (
            <p className="text-xs leading-relaxed text-foreground-muted">{description}</p>
          )}
        </div>
        {aside}
      </header>
      {children}
    </section>
  );
}

/**
 * Resuelve el envoltorio analítico en un solo lugar.
 *
 * Centralizarlo garantiza que ninguna pantalla pueda olvidarse de honrar la regla de
 * anonimato y pintar un gráfico con un corte demasiado pequeño.
 */
export function EnvelopeGate<T>({
  query,
  children,
}: {
  query: { data?: Envelope<T>; isLoading: boolean; error: unknown };
  children: (data: T, meta: Envelope<T>['meta']) => ReactNode;
}) {
  if (query.isLoading) {
    return (
      <p role="status" className="py-8 text-center text-sm text-foreground-muted">
        Cargando…
      </p>
    );
  }

  if (query.error || !query.data) {
    return (
      <p role="alert" className="py-8 text-center text-sm text-danger">
        No pudimos cargar esta información.
      </p>
    );
  }

  const { data, meta } = query.data;
  if (meta.insufficient || data === null) {
    return <InsufficientData n={meta.n} minCohortSize={meta.minCohortSize} />;
  }

  return <>{children(data, meta)}</>;
}
