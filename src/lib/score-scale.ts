import type { ThresholdBand } from './admin.types';

/** Resuelve la banda de un índice 0-100 usando los umbrales que envió la API. */
export function classify(
  value: number | null,
  bands: ThresholdBand[],
): ThresholdBand | null {
  if (value === null) return null;
  return bands.find((band) => value >= band.minValue && value <= band.maxValue) ?? null;
}

/**
 * Tinta legible sobre un relleno de color.
 *
 * Los colores de estado son de luminancia muy distinta: el ámbar de "Aceptable" necesita
 * texto oscuro y el rojo de "Crítico" texto blanco. Elegir uno fijo dejaría una de las dos
 * bandas ilegible dentro de su propia celda.
 */
export function inkOn(hex: string): string {
  return relativeLuminance(hex) > 0.45 ? '#16191d' : '#ffffff';
}

/** Relleno tenue para fondos de celda, manteniendo el texto en tinta normal. */
export function tintOf(hex: string, alpha = 0.16): string {
  const { r, g, b } = parseHex(hex);
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

function parseHex(hex: string): { r: number; g: number; b: number } {
  const clean = hex.replace('#', '');
  const full =
    clean.length === 3
      ? clean
          .split('')
          .map((char) => char + char)
          .join('')
      : clean;
  return {
    r: parseInt(full.slice(0, 2), 16),
    g: parseInt(full.slice(2, 4), 16),
    b: parseInt(full.slice(4, 6), 16),
  };
}

function relativeLuminance(hex: string): number {
  const { r, g, b } = parseHex(hex);
  const channel = (value: number) => {
    const scaled = value / 255;
    return scaled <= 0.03928 ? scaled / 12.92 : ((scaled + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(r) + 0.7152 * channel(g) + 0.0722 * channel(b);
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
