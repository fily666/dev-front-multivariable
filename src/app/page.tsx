import { SurveyWizard } from '@/components/survey/SurveyWizard';

/** El home ES la encuesta: nadie debe tener que buscar un enlace para responderla. */
export default function HomePage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col gap-8 px-5 py-10 sm:px-8 sm:py-14">
      <SurveyWizard />

      <footer className="border-t border-border-subtle pt-6 text-xs leading-relaxed text-foreground-muted">
        La información recopilada será utilizada exclusivamente con fines de mejora
        organizacional y fortalecimiento institucional.
      </footer>
    </main>
  );
}
