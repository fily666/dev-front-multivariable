'use client';

interface ProgressBarProps {
  current: number;
  total: number;
  /** Minutos restantes estimados con el ritmo real del encuestado. */
  remainingMinutes: number | null;
}

export function ProgressBar({ current, total, remainingMinutes }: ProgressBarProps) {
  const percent = total === 0 ? 0 : Math.round((current / total) * 100);

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-baseline justify-between text-xs text-foreground-muted">
        <span>
          Paso {current} de {total}
        </span>
        <span>
          {percent}%
          {remainingMinutes !== null && remainingMinutes > 0 && (
            <> · ≈ {remainingMinutes} min restantes</>
          )}
        </span>
      </div>

      <div
        role="progressbar"
        aria-valuenow={percent}
        aria-valuemin={0}
        aria-valuemax={100}
        aria-label="Avance de la encuesta"
        className="h-1.5 w-full overflow-hidden rounded-full bg-surface-muted"
      >
        <div
          className="h-full rounded-full bg-brand transition-[width] duration-300"
          style={{ width: `${percent}%` }}
        />
      </div>
    </div>
  );
}
