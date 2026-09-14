import type { Insight, Tone } from '@/lib/insights';

/**
 * La lectura de un bloque: qué dice el dato que está al lado.
 *
 * Es la pieza que convierte el panel en una presentación. Un gráfico contesta «cuánto»;
 * esta banda contesta «y entonces qué», que es la pregunta que alguien de gerencia trae
 * cuando abre el panel.
 *
 * El tono NUNCA va solo: lleva icono y frase. Las cuatro bandas del semáforo están muy
 * juntas en el espacio de color —naranja y ámbar se separan ΔE 5,5 con deuteranopia—, así
 * que el color es refuerzo, no el mensaje.
 */

const TONE_CLASS: Record<Tone, string> = {
  good: 'border-tone-good/35 bg-tone-good-subtle text-tone-good',
  neutral: 'border-tone-neutral/35 bg-tone-neutral-subtle text-tone-neutral',
  warn: 'border-tone-warn/35 bg-tone-warn-subtle text-tone-warn',
  bad: 'border-tone-bad/35 bg-tone-bad-subtle text-tone-bad',
};

/** Etiqueta para lectores de pantalla: el color no llega por audio. */
const TONE_LABEL: Record<Tone, string> = {
  good: 'Favorable',
  neutral: 'Neutro',
  warn: 'Atención',
  bad: 'Crítico',
};

const TONE_PATH: Record<Tone, string> = {
  good: 'M20 6 9 17l-5-5',
  neutral: 'M12 16v-4M12 8h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
  warn: 'M12 9v4M12 17h.01M10.3 3.9 1.8 18a2 2 0 0 0 1.7 3h17a2 2 0 0 0 1.7-3L13.7 3.9a2 2 0 0 0-3.4 0Z',
  bad: 'M12 8v4M12 16h.01M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18Z',
};

export function Readout({ insight, compact }: { insight: Insight; compact?: boolean }) {
  return (
    <div
      className={[
        'flex items-start gap-3 rounded-lg border',
        compact ? 'px-3.5 py-2.5' : 'px-4 py-3.5',
        TONE_CLASS[insight.tone],
      ].join(' ')}
    >
      <svg
        width={compact ? 15 : 17}
        height={compact ? 15 : 17}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.2}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-px shrink-0"
      >
        <path d={TONE_PATH[insight.tone]} />
      </svg>

      <div className="flex min-w-0 flex-col gap-1">
        <p className={compact ? 'text-[13px] font-semibold' : 'text-sm font-semibold'}>
          <span className="sr-only">{TONE_LABEL[insight.tone]}: </span>
          {insight.headline}
        </p>
        {insight.detail && (
          <p className="text-xs leading-relaxed text-foreground-muted">{insight.detail}</p>
        )}
      </div>
    </div>
  );
}

/**
 * Variante de una línea, para meter una conclusión dentro de una tarjeta estrecha.
 * Sin fondo: en una rejilla de tarjetas, cuatro planos de color compiten entre sí.
 */
export function ReadoutLine({ insight }: { insight: Insight }) {
  return (
    <p
      className={[
        'flex items-start gap-2 text-xs leading-relaxed',
        {
          good: 'text-tone-good',
          neutral: 'text-foreground-muted',
          warn: 'text-tone-warn',
          bad: 'text-tone-bad',
        }[insight.tone],
      ].join(' ')}
    >
      <svg
        width={13}
        height={13}
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth={2.4}
        strokeLinecap="round"
        strokeLinejoin="round"
        aria-hidden="true"
        className="mt-0.5 shrink-0"
      >
        <path d={TONE_PATH[insight.tone]} />
      </svg>
      <span>
        <span className="sr-only">{TONE_LABEL[insight.tone]}: </span>
        {insight.headline}
      </span>
    </p>
  );
}
