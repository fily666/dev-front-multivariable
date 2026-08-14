/**
 * Sustituto del dato cuando el corte no alcanza la cohorte mínima.
 *
 * No se muestra un gráfico vacío ni un 0: ambos se leerían como "el resultado es malo"
 * cuando lo que ocurre es que hay muy pocas respuestas para publicarlas sin permitir
 * deducir quién dijo qué.
 */
export function InsufficientData({ n, minCohortSize }: { n: number; minCohortSize: number }) {
  return (
    <div
      role="status"
      className="flex flex-col gap-1.5 rounded-lg border border-dashed border-border-strong bg-surface-muted px-5 py-8 text-center"
    >
      <p className="text-sm font-medium text-foreground">
        Datos insuficientes para mostrar sin comprometer el anonimato
      </p>
      <p className="text-xs text-foreground-muted">
        Este corte tiene {n} {n === 1 ? 'respuesta' : 'respuestas'}; se necesitan al menos{' '}
        {minCohortSize}.
      </p>
    </div>
  );
}

export function EmptyState({ message }: { message: string }) {
  return (
    <p className="rounded-lg border border-dashed border-border-subtle px-5 py-6 text-center text-sm text-foreground-muted">
      {message}
    </p>
  );
}
