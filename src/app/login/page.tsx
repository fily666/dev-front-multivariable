'use client';

import { Suspense, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { LinkticLogo } from '@/components/brand/Logo';
import { ApiError } from '@/lib/api';
import { login } from '@/lib/admin-client';

/**
 * `useSearchParams` obliga a un limite de Suspense para que Next pueda prerenderizar la
 * pagina: el parametro `next` solo se conoce en el navegador.
 */
export default function LoginPage() {
  return (
    <Suspense fallback={<LoginFallback />}>
      <LoginForm />
    </Suspense>
  );
}

function LoginFallback() {
  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center px-5 py-16">
      <p role="status" className="text-sm text-foreground-muted">
        Cargando…
      </p>
    </main>
  );
}

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [token, setToken] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [retryAfter, setRetryAfter] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);

  async function handleSubmit(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setRetryAfter(null);

    try {
      await login(token);
      // La cookie de sesión la puso el servidor; el token no se guarda en ninguna parte.
      const next = searchParams.get('next');
      router.push(next?.startsWith('/admin') ? next : '/admin');
    } catch (caught) {
      if (caught instanceof ApiError) {
        setError(caught.message);
        // El backend devuelve cuántos segundos hay que esperar tras agotar los intentos.
        const body = caught.body as { retryAfterSeconds?: number } | undefined;
        if (caught.status === 429 && body?.retryAfterSeconds) {
          setRetryAfter(body.retryAfterSeconds);
        }
      } else {
        setError('No pudimos conectar con el servidor. Verifique su conexión.');
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="mx-auto flex w-full max-w-sm flex-1 flex-col justify-center gap-7 px-5 py-16">
      <header className="flex flex-col gap-5">
        <LinkticLogo width={180} priority />
        <div className="flex flex-col gap-2">
          <h1 className="text-xl text-foreground">Panel de administración</h1>
          <p className="text-sm text-foreground-muted">
            Diagnóstico Organizacional LinkTIC. Ingrese el token de acceso.
          </p>
        </div>
      </header>

      <form onSubmit={handleSubmit} className="flex flex-col gap-4">
        <label className="flex flex-col gap-1.5">
          <span className="text-sm text-foreground">Token de acceso</span>
          <input
            type="password"
            value={token}
            onChange={(event) => setToken(event.target.value)}
            required
            autoComplete="current-password"
            autoFocus
            aria-invalid={error ? true : undefined}
            aria-describedby={error ? 'login-error' : undefined}
            className="rounded-lg border border-border-subtle bg-surface px-4 py-2.5 text-sm text-foreground"
          />
        </label>

        {error && (
          <div
            id="login-error"
            role="alert"
            className="flex flex-col gap-1 rounded-lg bg-danger-subtle px-4 py-3"
          >
            <p className="text-sm text-danger">{error}</p>
            {retryAfter !== null && (
              <p className="text-xs text-danger">
                Podrá intentar de nuevo en {Math.ceil(retryAfter / 60)} minutos.
              </p>
            )}
          </div>
        )}

        <button
          type="submit"
          disabled={busy || token.length === 0}
          className="rounded-lg bg-brand px-4 py-2.5 text-sm font-bold text-white hover:bg-brand-hover disabled:opacity-60"
        >
          {busy ? 'Verificando…' : 'Ingresar'}
        </button>
      </form>

      <p className="text-xs leading-relaxed text-foreground-muted">
        Este panel contiene percepciones del personal sobre las áreas de la organización. No
        comparta el token ni las capturas de los resultados fuera del comité que lidera el
        diagnóstico.
      </p>
    </main>
  );
}
