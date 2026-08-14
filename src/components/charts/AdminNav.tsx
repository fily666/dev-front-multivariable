'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { logout } from '@/lib/admin-client';

const LINKS = [
  { href: '/admin', label: 'Resumen' },
  { href: '/admin/componentes', label: 'Componentes' },
  { href: '/admin/mapa', label: 'Mapa de relacionamiento' },
  { href: '/admin/cualitativo', label: 'Cualitativo' },
  { href: '/admin/respuestas', label: 'Respuestas' },
];

export function AdminNav() {
  const pathname = usePathname();
  const router = useRouter();

  async function handleLogout() {
    try {
      await logout();
    } finally {
      router.push('/login');
    }
  }

  return (
    <header className="border-b border-border-subtle bg-surface">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-3 px-5 py-4 sm:px-8">
        <div className="flex items-center justify-between gap-4">
          <p className="text-sm font-semibold text-foreground">
            Diagnóstico Organizacional LinkTIC
          </p>
          <button
            type="button"
            onClick={() => void handleLogout()}
            className="text-xs font-medium text-foreground-muted hover:text-foreground"
          >
            Cerrar sesión
          </button>
        </div>

        <nav aria-label="Secciones del panel">
          <ul className="-mb-px flex gap-1 overflow-x-auto">
            {LINKS.map((link) => {
              // El resumen solo se marca activo en su ruta exacta; las demás aceptan subrutas.
              const active =
                link.href === '/admin'
                  ? pathname === '/admin'
                  : pathname.startsWith(link.href);

              return (
                <li key={link.href}>
                  <Link
                    href={link.href}
                    aria-current={active ? 'page' : undefined}
                    className={[
                      'inline-block whitespace-nowrap border-b-2 px-3 py-2 text-sm',
                      active
                        ? 'border-brand font-medium text-brand'
                        : 'border-transparent text-foreground-muted hover:text-foreground',
                    ].join(' ')}
                  >
                    {link.label}
                  </Link>
                </li>
              );
            })}
          </ul>
        </nav>
      </div>
    </header>
  );
}
