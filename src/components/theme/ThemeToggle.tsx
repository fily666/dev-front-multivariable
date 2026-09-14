'use client';

import { useSyncExternalStore } from 'react';
import clsx from 'clsx';
import { applyTheme, readServerTheme, readTheme, subscribeToTheme } from './theme';

/**
 * Interruptor de claro / oscuro.
 *
 * Qué icono y qué etiqueta se ven NO dependen de React sino de la variante `dark:`, es
 * decir del mismo atributo que pinta el resto de la interfaz. Así el botón sale ya correcto
 * en la primera pintura, donde el servidor todavía no sabe qué tema eligió este navegador,
 * y no hay ni parpadeo ni desajuste de hidratación. Lo único que sí necesita saberlo en
 * JavaScript es el `aria-pressed`, y por eso el tema se lee con `useSyncExternalStore`:
 * durante la hidratación vale «claro» y React lo corrige en cuanto puede mirar el DOM.
 *
 * Se muestra el icono del destino, no el del estado actual: en claro se ve la luna porque
 * pulsar lleva a oscuro. Es la convención de la mayoría de interfaces con este control, y
 * el texto para lector de pantalla lo dice sin ambigüedad de todos modos.
 */
export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribeToTheme, readTheme, readServerTheme);

  function toggle() {
    applyTheme(theme === 'dark' ? 'light' : 'dark');
  }

  return (
    <button
      type="button"
      onClick={toggle}
      data-theme-toggle=""
      aria-pressed={theme === 'dark'}
      className={clsx(
        className,
        'inline-flex size-9 shrink-0 cursor-pointer items-center justify-center rounded-lg',
        'border border-border-subtle bg-surface text-foreground-muted',
        'hover:border-border-strong hover:text-foreground',
      )}
    >
      <MoonIcon className="dark:hidden" />
      <SunIcon className="hidden dark:block" />

      {/* Dos textos y no uno interpolado: el visible es el que lee el lector de pantalla. */}
      <span className="sr-only dark:hidden">Activar el modo oscuro</span>
      <span className="sr-only hidden dark:block">Activar el modo claro</span>
    </button>
  );
}

/* Trazo y no relleno, para que acompañen al peso de la tipografía de interfaz. */

function MoonIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={clsx(className, 'size-[18px]')}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M20.5 14.3A8.6 8.6 0 0 1 9.7 3.5a8.6 8.6 0 1 0 10.8 10.8Z" />
    </svg>
  );
}

function SunIcon({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      aria-hidden="true"
      focusable="false"
      className={clsx(className, 'size-[18px]')}
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2M12 19.5v2M4.2 4.2l1.4 1.4M18.4 18.4l1.4 1.4M2.5 12h2M19.5 12h2M4.2 19.8l1.4-1.4M18.4 5.6l1.4-1.4" />
    </svg>
  );
}
