import { SurveyWizard } from '@/components/survey/SurveyWizard';
import { ThemeToggle } from '@/components/theme/ThemeToggle';

/** El home ES la encuesta: nadie debe tener que buscar un enlace para responderla. */
export default function HomePage() {
  return (
    /*
     * La encuesta se responde sobre todo desde un PC, así que en pantalla grande la columna
     * se ensancha: lo que en 672 px son cuatro scrolls de opciones de dos palabras, aquí
     * cabe en uno. El ancho extra es para las LISTAS, no para el texto — los párrafos
     * siguen acotados a su medida de lectura allí donde se pintan.
     */
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14 lg:max-w-5xl">
      {/* La encuesta se responde en una sola columna y sin barra, así que el interruptor
          es todo el chrome que hay: una fila propia arriba a la derecha. */}
      <div className="-mb-4 flex justify-end">
        <ThemeToggle />
      </div>

      <SurveyWizard />

      <footer className="border-t border-border-subtle pt-6 text-xs leading-relaxed text-foreground-muted">
        La información recopilada será utilizada exclusivamente con fines de mejora
        organizacional y fortalecimiento institucional.
      </footer>
    </main>
  );
}
