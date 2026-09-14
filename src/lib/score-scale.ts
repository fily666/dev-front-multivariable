import type { ThresholdBand } from './admin.types';

/** Resuelve la banda de un índice 0-100 usando los umbrales que envió la API. */
export function classify(
  value: number | null,
  bands: ThresholdBand[],
): ThresholdBand | null {
  if (value === null) return null;
  return bands.find((band) => value >= band.minValue && value <= band.maxValue) ?? null;
}

/** Formatea un índice para tarjetas (entero) o tablas (un decimal). */
export function formatIndex(value: number | null, decimals = 0): string {
  if (value === null) return '—';
  return value.toFixed(decimals);
}

/** El NPS lleva signo explícito: un +12 y un −12 son lecturas opuestas. */
export function formatNps(value: number | null): string {
  if (value === null) return '—';
  const rounded = Math.round(value);
  return rounded > 0 ? `+${rounded}` : String(rounded);
}

export function formatShare(value: number | null): string {
  return value === null ? '—' : `${value.toFixed(1)}%`;
}

export function formatDuration(seconds: number | null): string {
  if (seconds === null) return '—';
  const minutes = Math.floor(seconds / 60);
  const rest = seconds % 60;
  return minutes === 0 ? `${rest} s` : `${minutes} min ${String(rest).padStart(2, '0')} s`;
}

/**
 * Relleno de una celda de matriz: un velo del color de banda, no el color a plena carga.
 *
 * La intensidad sube con la severidad, así que la cuadrícula se lee por manchas antes de
 * leer un solo número. El texto se queda en tinta normal —no hay que calcular contraste
 * contra cada relleno— y el número sigue siendo el dato: el color solo lo acompaña, que es
 * lo que corresponde cuando las cuatro bandas no se distinguen entre sí por color a secas.
 */
export function heatFill(
  band: ThresholdBand | null,
  bands: ThresholdBand[],
): { backgroundColor: string } {
  if (!band) return { backgroundColor: 'var(--surface-muted)' };
  const index = bands.findIndex((entry) => entry.label === band.label);
  const step = Math.min(Math.max(index, 0), 3) + 1;
  return {
    backgroundColor: `color-mix(in srgb, ${band.color} var(--heat-${step}), transparent)`,
  };
}
