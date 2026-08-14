import type { ThresholdBand } from '@/lib/admin.types';

/**
 * Etiqueta de banda semafórica.
 *
 * El punto de color va SIEMPRE con su texto. Las cuatro bandas están cerca entre sí en el
 * espacio de color (ámbar y naranja se separan ΔE 13.6 con visión normal), así que el
 * color por sí solo no basta para distinguirlas: la etiqueta es la que carga el significado.
 */
export function BandChip({ band }: { band: ThresholdBand | null }) {
  if (!band) {
    return <span className="text-xs text-foreground-muted">Sin dato</span>;
  }

  return (
    <span className="inline-flex items-center gap-1.5 text-xs font-medium text-foreground">
      <span
        aria-hidden
        className="h-2.5 w-2.5 shrink-0 rounded-full ring-1 ring-black/10"
        style={{ backgroundColor: band.color }}
      />
      {band.label}
    </span>
  );
}
