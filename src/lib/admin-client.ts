import { apiFetch } from './api';
import type {
  AdminFilters,
  AreaDetailPayload,
  ComponentsPayload,
  Envelope,
  IndicatorsPayload,
  IndicesByAreaPayload,
  NpsPayload,
  OverviewPayload,
  QualitativePayload,
  RelationshipPayload,
  ResponsesPayload,
} from './admin.types';

/** Los filtros vacíos se omiten para no enviar query params sin valor. */
function toQuery(filters: AdminFilters = {}): Record<string, string | undefined> {
  return {
    campaignId: filters.campaignId || undefined,
    ownArea: filters.ownArea || undefined,
    frecuencia: filters.frecuencia || undefined,
    tipoInteraccion: filters.tipoInteraccion || undefined,
    from: filters.from || undefined,
    to: filters.to || undefined,
  };
}

export const login = (token: string) =>
  apiFetch<{ authenticated: true; expiresIn: string }>('/auth/login', {
    method: 'POST',
    body: { token },
  });

export const logout = () => apiFetch<{ authenticated: false }>('/auth/logout', { method: 'POST' });

export const whoAmI = () => apiFetch<{ authenticated: true; role: 'admin' }>('/auth/me');

export const getOverview = (filters?: AdminFilters) =>
  apiFetch<Envelope<OverviewPayload>>('/admin/overview', { query: toQuery(filters) });

export const getIndicators = (filters?: AdminFilters) =>
  apiFetch<Envelope<IndicatorsPayload>>('/admin/indicators', { query: toQuery(filters) });

export const getComponents = (filters?: AdminFilters) =>
  apiFetch<Envelope<ComponentsPayload>>('/admin/components', { query: toQuery(filters) });

export const getRelationshipMap = (filters?: AdminFilters) =>
  apiFetch<Envelope<RelationshipPayload>>('/admin/relationship-map', { query: toQuery(filters) });

export const getNps = (filters?: AdminFilters) =>
  apiFetch<Envelope<NpsPayload>>('/admin/nps', { query: toQuery(filters) });

export const getQualitative = (filters?: AdminFilters) =>
  apiFetch<Envelope<QualitativePayload>>('/admin/qualitative', { query: toQuery(filters) });

export const getAreaDetail = (code: string, filters?: AdminFilters) =>
  apiFetch<Envelope<AreaDetailPayload>>(`/admin/areas/${code}`, { query: toQuery(filters) });

export const getIndicesByArea = (filters?: AdminFilters) =>
  apiFetch<Envelope<IndicesByAreaPayload>>('/admin/indices-by-area', { query: toQuery(filters) });

export const getResponses = (page: number, pageSize: number, filters?: AdminFilters) =>
  apiFetch<Envelope<ResponsesPayload>>('/admin/responses', {
    query: { ...toQuery(filters), page, pageSize },
  });

export const updateTheme = (answerId: string, theme: string | null) =>
  apiFetch<{ id: string; theme: string | null }>(
    `/admin/qualitative/answers/${answerId}/theme`,
    { method: 'PATCH', body: { theme } },
  );

/** URL de descarga. Es una navegación directa para que el navegador reciba el archivo. */
export function exportUrl(format: 'csv' | 'xlsx', campaignId?: string): string {
  const base = process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3001/api/v1';
  const url = new URL(`${base}/admin/export`);
  url.searchParams.set('format', format);
  if (campaignId) url.searchParams.set('campaignId', campaignId);
  return url.toString();
}
