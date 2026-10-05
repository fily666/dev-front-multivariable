import { AdminShell } from '@/components/shell/AdminShell';

export const metadata = { title: 'Panel · Diagnóstico Organizacional LinkTIC' };

/**
 * El acceso ya lo filtró `src/proxy.ts` (presencia de cookie) y lo valida el AdminGuard de
 * la API en cada llamada. Aquí solo va el chrome del panel.
 */
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return <AdminShell>{children}</AdminShell>;
}
