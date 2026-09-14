import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';
import { THEME_INIT_SCRIPT } from '@/components/theme/theme';

/**
 * Tipografía corporativa del Manual de Marca: Light y Regular para textos de contenido,
 * Bold para subtítulos y Black para títulos. Medium queda para etiquetas de interfaz.
 */
const montserrat = Montserrat({
  variable: '--font-montserrat',
  subsets: ['latin'],
  weight: ['300', '400', '500', '700', '900'],
});

export const metadata: Metadata = {
  title: 'Diagnóstico Organizacional LinkTIC',
  description:
    'Instrumento interno de percepción organizacional. La información recopilada será ' +
    'utilizada exclusivamente con fines de mejora organizacional y fortalecimiento institucional.',
  robots: { index: false, follow: false },
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
  return (
    /*
     * `suppressHydrationWarning` porque el script de abajo le pone `data-theme` al <html>
     * antes de que React hidrate, y ese atributo no puede venir del servidor: depende de lo
     * que haya en el navegador de cada persona. Solo silencia este nodo, no el árbol.
     */
    <html
      lang="es-CO"
      className={`${montserrat.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <head>
        {/*
         * Bloqueante y en el <head> a propósito: fija el tema antes del primer pintado. Si
         * fuese un efecto de React, la página saldría en claro y saltaría a oscuro a la
         * vista del usuario.
         */}
        <script dangerouslySetInnerHTML={{ __html: THEME_INIT_SCRIPT }} />
      </head>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
