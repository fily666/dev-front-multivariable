import { AdminNav } from '@/components/charts/AdminNav';

export const metadata = { title: 'Panel · Diagnóstico Organizacional LinkTIC' };

/**
 * El acceso ya lo filtró `src/proxy.ts` (presencia de cookie) y lo valida el AdminGuard de
 * la API en cada llamada. Aquí solo va el chrome del panel.
 */
export default function AdminLayout({ children }: LayoutProps<'/admin'>) {
  return (
    <div className="flex min-h-full flex-1 flex-col bg-background">
      <AdminNav />
      <main className="mx-auto flex w-full max-w-6xl flex-1 flex-col gap-6 px-5 py-7 sm:px-8">
        {children}
      </main>
    </div>
  );
}
