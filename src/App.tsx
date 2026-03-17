import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes, useLocation } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SnapshotGate } from "@/components/SnapshotGate";
import Hub from "./pages/Hub";
import Snapshot from "./pages/Snapshot";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";
import { DashboardLayout } from "./components/layout/DashboardLayout";

function ComingSoon({ title }: { title: string }) {
  return (
    <DashboardLayout>
      <div className="flex flex-col items-center justify-center py-20 text-center space-y-3">
        <h1 className="text-2xl font-heading font-bold text-primary">{title}</h1>
        <p className="text-base font-body text-muted-foreground">Coming soon — this feature is under development.</p>
      </div>
    </DashboardLayout>
  );
}
const queryClient = new QueryClient();

function AppRoutes() {
  const { profile, isLoading, session } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  // If no real session and using demo profile, show auth page
  // For now, demo users bypass auth. Real auth users go through the full flow.
  const isDemo = profile?.user_id === 'demo';

  // If onboarding not completed (real user), show onboarding
  if (profile && !isDemo && !profile.onboarding_completed) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // Demo users also see onboarding check
  if (profile && isDemo && !profile.onboarding_completed) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // Login route should be outside the SnapshotGate
  if (location.pathname === '/login') {
    return (
      <Routes>
        <Route path="/login" element={<Auth />} />
      </Routes>
    );
  }

  return (
    <SnapshotGate>
      <Routes>
        <Route path="/" element={<Snapshot />} />
        <Route path="/hub" element={<Hub />} />
        <Route path="/community" element={<ComingSoon title="Community" />} />
        <Route path="/leadership" element={<ComingSoon title="Leadership" />} />
        <Route path="/events" element={<ComingSoon title="Events" />} />
        <Route path="*" element={<NotFound />} />
      </Routes>
    </SnapshotGate>
  );
}

// Iron Forums App
const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <TooltipProvider>
        <Toaster />
        <Sonner />
        <BrowserRouter>
          <AppRoutes />
        </BrowserRouter>
      </TooltipProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
