import type { NextConfig } from "next";

/**
 * Origen de la API de NestJS, SIN el prefijo `/api/v1` (lo agrega el rewrite).
 *
 * Sin prefijo `NEXT_PUBLIC_` a propósito: se resuelve en el servidor de Next y nunca llega
 * al bundle del navegador.
 *
 * Aun así es variable de BUILD, no de runtime: `next build` serializa el `destination` ya
 * resuelto en `.next/routes-manifest.json`, y `next start` lee de ahí sin volver a mirar el
 * entorno. Cambiarla en Vercel exige redesplegar.
 */
const API_ORIGIN = process.env.API_ORIGIN ?? 'http://localhost:3001';

const nextConfig: NextConfig = {
  /**
   * El navegador habla siempre con el dominio del front; Next reenvía a la API.
   *
   * No es una comodidad, es lo que hace viable la sesión: front y back viven en
   * subdominios distintos de `vercel.app`, que está en la Public Suffix List, así que para
   * el navegador son SITIOS distintos. Llamando al back directo, su cookie de sesión sería
   * de tercera parte: `proxy.ts` no podría leerla nunca (solo ve cookies del propio host) y
   * /admin/* quedaría en bucle hacia /login aun con un login exitoso.
   *
   * Pasando por aquí la cookie queda first-party en el dominio del front, y de paso
   * desaparecen la necesidad de CORS y la de `SameSite=None` en el backend.
   */
  async rewrites() {
    return [
      { source: '/api/v1/:path*', destination: `${API_ORIGIN}/api/v1/:path*` },
    ];
  },
};

export default nextConfig;
