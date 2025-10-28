import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { PageTransition } from "@/components/PageTransition";
import Home from "./pages/Home";
import Grants from "./pages/Grants";
import Loans from "./pages/Loans";
import Dashboard from "./pages/Dashboard";
import ProgramDetail from "./pages/ProgramDetail";
import Auth from "./pages/Auth";
import Onboarding from "./pages/Onboarding";
import IdeaLab from "./pages/IdeaLab";
import Assistant from "./pages/Assistant";
import Saved from "./pages/Saved";
import Licensing from "./pages/Licensing";
import NotFound from "./pages/NotFound";
import { ProtectedRoute } from "@/components/ProtectedRoute";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <Toaster />
      <Sonner />
      <BrowserRouter>
        <PageTransition>
          <Routes>
            <Route path="/" element={<Home />} />
            <Route path="/grants" element={<Grants />} />
            <Route path="/loans" element={<Loans />} />
            <Route path="/idea-lab" element={<IdeaLab />} />
            <Route path="/assistant" element={
              <ProtectedRoute>
                <Assistant />
              </ProtectedRoute>
            } />
            <Route path="/saved" element={<Saved />} />
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
            <Route path="/auth" element={<Auth />} />
            <Route path="/onboarding" element={<Onboarding />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </PageTransition>
      </BrowserRouter>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
