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
import ComingSoon from "./pages/ComingSoon";
import { DashboardLayout } from "./components/layout/DashboardLayout";
const queryClient = new QueryClient();

function AppRoutes() {
  const { profile, isLoading, isDemo } = useAuth();
  const location = useLocation();

  if (isLoading) return null;

  // No profile at all → show Auth page (login / create account / demo)
  if (!profile) {
    return (
      <Routes>
        <Route path="*" element={<Auth />} />
      </Routes>
    );
  }

  // Onboarding not completed → force onboarding (skip for demo users)
  if (!isDemo && !profile.onboarding_completed) {
    return (
      <Routes>
        <Route path="*" element={<Onboarding />} />
      </Routes>
    );
  }

  // Login route accessible even when authenticated (for switching accounts)
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
