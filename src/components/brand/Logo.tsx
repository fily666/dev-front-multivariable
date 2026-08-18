import Image from 'next/image';
import clsx from 'clsx';

/**
 * Logotipo corporativo, según el Manual de Marca LinkTIC V2.0 (GCM-MAN-004).
 *
 * Se sirven dos versiones y las alterna el tema del sistema: la primaria a color sobre
 * fondos claros, y la de una tinta en blanco sobre fondos oscuros. El manual autoriza
 * exactamente esas dos lecturas y prohíbe recolorear el logotipo, así que no hay filtros
 * CSS de por medio: cada archivo sale del PDF del manual.
 */

/**
 * Dimensiones reales de los archivos. Van a `next/image` tal cual, y el tamaño de
 * presentación se fija por CSS con la otra dimensión en `auto`.
 *
 * No se declara el par ya escalado a propósito. Tailwind deja `height: auto` en las
 * imágenes, así que el navegador recalcula el alto desde el ancho y la proporción del
 * archivo; un par redondeado a mano no coincide con ese cálculo y `next/image` avisa de que
 * la proporción quedó alterada. Fijar los dos lados en CSS callaría el aviso deformando el
 * logotipo, y eso es justo lo que el manual prohíbe.
 */
const LOGO = { width: 1200, height: 561 };
const ISOTIPO = { width: 481, height: 640 };

/** Mínimo del manual para web. Por debajo, el eslogan deja de ser legible. */
export const LOGO_MIN_WIDTH = 130;

interface LogoProps {
  /** Ancho de presentación en px. El manual fija 200 px en web y 130 px como mínimo. */
  width?: number;
  className?: string;
  /** El logotipo de la primera pantalla entra en el LCP y conviene precargarlo. */
  priority?: boolean;
}

export function LinkticLogo({ width = 200, className, priority }: LogoProps) {
  return (
    <>
      <Image
        src="/brand/linktic-logo.png"
        // El alt lleva el eslogan porque forma parte del logotipo que se está mostrando.
        alt="LinkTIC — evolucionamos contigo"
        {...LOGO}
        // Sin esto el navegador se traería el archivo a tamaño completo para una marca de
        // 200 px: `sizes` le dice cuál de las variantes optimizadas necesita.
        sizes={`${width}px`}
        style={{ width, height: 'auto' }}
        priority={priority}
        className={clsx(className, 'dark:hidden')}
      />
      <Image
        src="/brand/linktic-logo-blanco.png"
        alt="LinkTIC — evolucionamos contigo"
        {...LOGO}
        sizes={`${width}px`}
        style={{ width, height: 'auto' }}
        priority={priority}
        className={clsx(className, 'hidden dark:block')}
      />
    </>
  );
}

/**
 * Isotipo solo (el pinzón). Es la marca para espacios donde el logotipo completo caería
 * por debajo de su tamaño mínimo: barras compactas, iconos, avatares.
 */
export function LinkticIsotipo({
  height = 32,
  className,
  priority,
}: Omit<LogoProps, 'width'> & { height?: number }) {
  return (
    <>
      <Image
        src="/brand/linktic-isotipo.png"
        alt="LinkTIC"
        {...ISOTIPO}
        sizes={`${Math.round((height * ISOTIPO.width) / ISOTIPO.height)}px`}
        style={{ height, width: 'auto' }}
        priority={priority}
        className={clsx(className, 'dark:hidden')}
      />
      <Image
        src="/brand/linktic-isotipo-blanco.png"
        alt="LinkTIC"
        {...ISOTIPO}
        sizes={`${Math.round((height * ISOTIPO.width) / ISOTIPO.height)}px`}
        style={{ height, width: 'auto' }}
        priority={priority}
        className={clsx(className, 'hidden dark:block')}
      />
    </>
  );
}
