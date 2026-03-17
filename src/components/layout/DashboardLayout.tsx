import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import { Badge } from '@/components/ui/badge';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { user } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          <header className="h-16 flex items-center justify-between border-b bg-card px-5 sm:px-8 shrink-0">
            <div className="flex items-center gap-4">
              <SidebarTrigger className="h-10 w-10" />
              <div className="h-6 w-px bg-border hidden sm:block" />
              <span className="text-base font-body font-semibold text-muted-foreground hidden sm:block">
                Iron Forums Dashboard
              </span>
            </div>
            {user && (
              <Badge className={`${ROLE_COLORS[user.role]} font-body text-sm font-semibold border-0 px-3 py-1`}>
                {ROLE_LABELS[user.role]}
              </Badge>
            )}
          </header>
          <main className="flex-1 overflow-auto">
            <div className="p-5 sm:p-8 lg:p-10 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
