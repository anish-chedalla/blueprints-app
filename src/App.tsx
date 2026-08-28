import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { lazy, Suspense } from "react";
import { Loader2 } from "lucide-react";
import { PageTransition } from "@/components/PageTransition";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { ConfigurationError } from "@/components/ConfigurationError";
import { missingSupabaseVariables } from "@/integrations/supabase/client";

const Home = lazy(() => import("./pages/Home"));
const Grants = lazy(() => import("./pages/Grants"));
const Loans = lazy(() => import("./pages/Loans"));
const Dashboard = lazy(() => import("./pages/Dashboard"));
const ProgramDetail = lazy(() => import("./pages/ProgramDetail"));
const FederalGrantDetail = lazy(() => import("./pages/FederalGrantDetail"));
const Auth = lazy(() => import("./pages/Auth"));
const Onboarding = lazy(() => import("./pages/Onboarding"));
const IdeaLab = lazy(() => import("./pages/IdeaLab"));
const Assistant = lazy(() => import("./pages/Assistant"));
const Saved = lazy(() => import("./pages/Saved"));
const Licensing = lazy(() => import("./pages/Licensing"));
const NotFound = lazy(() => import("./pages/NotFound"));

const queryClient = new QueryClient();

const App = () => missingSupabaseVariables.length > 0 ? (
  <ConfigurationError variables={missingSupabaseVariables} />
) : (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter basename="/blueprints-app">
        <Suspense fallback={
          <div className="min-h-screen flex items-center justify-center" role="status" aria-label="Loading page">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        }>
          <PageTransition>
            <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/idea-lab" element={
              <ProtectedRoute>
                <IdeaLab />
              </ProtectedRoute>
            } />
            <Route path="/assistant" element={
              <ProtectedRoute>
                <Assistant />
              </ProtectedRoute>
            } />
            <Route path="/saved" element={
              <ProtectedRoute>
                <Saved />
              </ProtectedRoute>
            } />
            <Route path="/licensing" element={
              <ProtectedRoute>
                <Licensing />
              </ProtectedRoute>
            } />
            <Route path="/dashboard" element={
              <ProtectedRoute>
                <Dashboard />
              </ProtectedRoute>
            } />
            <Route path="/program/:id" element={<ProgramDetail />} />
            <Route path="/federal-grant/:id" element={<FederalGrantDetail />} />
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
            </Routes>
          </PageTransition>
        </Suspense>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
