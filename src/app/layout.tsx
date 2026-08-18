import type { Metadata } from 'next';
import { Montserrat } from 'next/font/google';
import './globals.css';
import { Providers } from './providers';

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
    <html lang="es-CO" className={`${montserrat.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
