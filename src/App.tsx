import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Route, Routes } from "react-router-dom";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import { AuthProvider, useAuth } from "@/contexts/AuthContext";
import { SnapshotGate } from "@/components/SnapshotGate";
import Index from "./pages/Index";
import Snapshot from "./pages/Snapshot";
import Onboarding from "./pages/Onboarding";
import Auth from "./pages/Auth";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

function AppRoutes() {
  const { profile, isLoading, session } = useAuth();

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
        <Route path="/" element={<Index />} />
        <Route path="/snapshot" element={<Snapshot />} />
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
