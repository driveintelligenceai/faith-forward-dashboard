import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { ROLE_LABELS, ROLE_COLORS } from '@/types';
import type { UserRole } from '@/types';
import { Badge } from '@/components/ui/badge';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const { profile } = useAuth();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar — minimal, functional */}
          <header className="h-14 sm:h-16 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-9 w-9 rounded-lg" />
              {/* Mobile logo — visible when sidebar is hidden */}
              <img
                src={ironForumsLogo}
                alt="Iron Forums"
                className="h-7 w-auto sm:hidden"
              />
              <div className="h-5 w-px bg-border/60 hidden sm:block" />
              <span className="text-sm font-body font-medium text-muted-foreground/70 hidden sm:block tracking-wide">
                Iron Forums
              </span>
            </div>
            {/* Intentionally empty — role shown on dashboard welcome */}
            <div />
          </header>

          {/* Main content area — responsive padding */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-10 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
