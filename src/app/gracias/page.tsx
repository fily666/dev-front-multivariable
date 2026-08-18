import Link from 'next/link';
import { LinkticLogo } from '@/components/brand/Logo';

export const metadata = { title: 'Gracias · Diagnóstico Organizacional LinkTIC' };

export default function GraciasPage() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center gap-6 px-5 py-16 sm:px-8">
      <LinkticLogo width={180} priority />

      <h1 className="text-2xl text-foreground sm:text-3xl">
        Gracias por su participación
      </h1>

      {/* Texto de cierre literal del instrumento. */}
      <p className="text-sm leading-relaxed text-foreground-muted">
        Su experiencia es fundamental para comprender cómo trabajamos como organización. La
        información recopilada permitirá identificar oportunidades de mejora, fortalecer la
        colaboración entre áreas y orientar decisiones estratégicas que contribuyan a una
        LinkTIC más ágil, integrada y centrada en la generación de valor.
      </p>

      <div className="rounded-lg bg-brand-subtle px-4 py-3">
        <p className="text-sm text-foreground">
          Sus respuestas quedaron registradas. Ya puede cerrar esta ventana.
        </p>
      </div>

      <Link
        href="/"
        className="self-start text-sm font-medium text-brand hover:underline"
      >
        Volver al inicio
      </Link>
    </main>
  );
}
