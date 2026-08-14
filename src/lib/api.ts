/**
 * Cliente HTTP hacia la API de NestJS.
 *
 * `credentials: 'include'` en todo: la sesión del admin viaja en una cookie httpOnly que
 * el navegador debe enviar. El front nunca habla directo con Supabase — toda la
 * validación y la regla de anonimato viven en el back y no deben poder eludirse.
 */

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';

export class ApiError extends Error {
  constructor(
    readonly status: number,
    message: string,
    readonly body?: unknown,
  ) {
    super(message);
    this.name = 'ApiError';
  }

  /** La sesión expiró o nunca existió: el llamador debe mandar a /login. */
  get isUnauthorized(): boolean {
    return this.status === 401;
  }

  /** Violaciones de las reglas del instrumento, con detalle por pregunta. */
  get isValidationError(): boolean {
    return this.status === 422;
  }
}

interface RequestOptions {
  method?: 'GET' | 'POST' | 'PATCH' | 'PUT' | 'DELETE';
  body?: unknown;
  signal?: AbortSignal;
  /** Query params; los `undefined` se omiten. */
  query?: Record<string, string | number | undefined>;
}

export async function apiFetch<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const url = new URL(`${BASE_URL}${path}`);
  for (const [key, value] of Object.entries(options.query ?? {})) {
    if (value !== undefined) url.searchParams.set(key, String(value));
  }

  const response = await fetch(url.toString(), {
    method: options.method ?? 'GET',
    credentials: 'include',
    headers: options.body ? { 'Content-Type': 'application/json' } : undefined,
    body: options.body ? JSON.stringify(options.body) : undefined,
    signal: options.signal,
    // Datos de encuesta y de panel: nunca se cachean.
    cache: 'no-store',
  });

  if (!response.ok) {
    const body = await response.json().catch(() => null);
    const message =
      (body as { message?: string } | null)?.message ??
      `La solicitud falló con estado ${response.status}`;
    throw new ApiError(response.status, message, body);
  }

  if (response.status === 204) return undefined as T;
  return (await response.json()) as T;
}
