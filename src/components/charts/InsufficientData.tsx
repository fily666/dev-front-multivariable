import { Icon } from '@/components/ui/icons';

/**
 * Sustituto del dato cuando el corte no alcanza la cohorte mínima.
 *
 * No se muestra un gráfico vacío ni un 0: ambos se leerían como "el resultado es malo"
 * cuando lo que ocurre es que hay muy pocas respuestas para publicarlas sin permitir
 * deducir quién dijo qué.
 */
export function InsufficientData({ n, minCohortSize }: { n: number; minCohortSize: number }) {
  return (
    <div role="status" className="lk-tarjeta flex flex-col items-center gap-3 px-6 py-10 text-center">
      <span className="flex size-11 items-center justify-center rounded-full bg-brand-subtle text-brand">
        <Icon name="shield" size={22} />
      </span>
      <p className="max-w-md text-[15px] font-semibold text-foreground">
        Datos insuficientes para mostrar sin comprometer el anonimato
      </p>
      <p className="max-w-md text-sm text-foreground-muted">
        Este corte tiene {n} {n === 1 ? 'respuesta' : 'respuestas'}; se necesitan al menos{' '}
        {minCohortSize}. En cuanto se alcancen, el dato aparece aquí solo.
      </p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-xl border border-dashed border-border-strong bg-surface-sunken px-5 py-6 text-center text-sm text-foreground-muted">
      {message}
    </p>
  );
}
