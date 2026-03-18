import { SidebarProvider, SidebarTrigger } from '@/components/ui/sidebar';
import { AppSidebar } from './AppSidebar';
import { Button } from '@/components/ui/button';
import { Pencil } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import ironForumsLogo from '@/assets/iron-forums-logo.svg';

interface DashboardLayoutProps {
  children: React.ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const navigate = useNavigate();

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full bg-background">
        <AppSidebar />
        <div className="flex-1 flex flex-col min-w-0">
          {/* Top bar */}
          <header className="h-14 sm:h-16 flex items-center justify-between border-b border-border/60 bg-card/80 backdrop-blur-sm px-4 sm:px-6 lg:px-8 shrink-0 sticky top-0 z-10">
            <div className="flex items-center gap-3">
              <SidebarTrigger className="h-10 w-10 rounded-lg" />
              <img
                src={ironForumsLogo}
                alt="Iron Forums"
                className="h-10 w-auto sm:hidden"
              />
              <div className="h-5 w-px bg-border/60 hidden sm:block" />
              <span className="text-base font-heading font-bold text-primary/80 hidden sm:block tracking-wide">
                Iron Forums
              </span>
            </div>

            <Button
              size="sm"
              className="font-body text-xs sm:text-sm gap-1.5 bg-secondary hover:bg-secondary/90 text-secondary-foreground"
              onClick={() => navigate('/?mode=score')}
            >
              <Pencil className="h-4 w-4" />
              <span className="hidden sm:inline">Update Snapshot</span>
              <span className="sm:hidden">Snapshot</span>
            </Button>
          </header>

          {/* Main content area */}
          <main className="flex-1 overflow-auto">
            <div className="px-4 py-4 sm:px-6 sm:py-5 lg:px-8 lg:py-6 max-w-7xl mx-auto w-full">
              {children}
            </div>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
