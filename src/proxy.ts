import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

const COOKIE_NAME = process.env.NEXT_PUBLIC_COOKIE_NAME ?? 'linktic_admin_session';

/**
 * Chequeo optimista de sesión sobre /admin/*.
 *
 * Solo verifica que la cookie EXISTA. No valida la firma del JWT a propósito: hacerlo
 * obligaría a compartir JWT_SECRET con el proyecto de frontend, y los secretos viven solo
 * en el backend. La autoridad real es el AdminGuard de la API, que valida el token en cada
 * llamada; esto solo evita que el usuario vea un panel vacío antes del primer 401.
 *
 * La propia documentación de Next lo plantea así: el proxy no es una solución de
 * autorización, es un atajo para el caso feliz.
 */
export function proxy(request: NextRequest) {
  if (request.cookies.get(COOKIE_NAME)) return NextResponse.next();

  const loginUrl = new URL('/login', request.url);
  loginUrl.searchParams.set('next', request.nextUrl.pathname);
  return NextResponse.redirect(loginUrl);
}

export const config = { matcher: '/admin/:path*' };
