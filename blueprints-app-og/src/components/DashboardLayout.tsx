import { ReactNode, useEffect, useState } from "react";
import { AppSidebar } from "./AppSidebar";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { supabase } from "@/integrations/supabase/client";

interface DashboardLayoutProps {
  children: ReactNode;
}

export function DashboardLayout({ children }: DashboardLayoutProps) {
  const [userName, setUserName] = useState<string>("");

  useEffect(() => {
    fetchUserName();
  }, []);

  const fetchUserName = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      // Try to get name from user metadata, fallback to email
      const name = session.user.user_metadata?.full_name || 
                   session.user.user_metadata?.name ||
                   session.user.email?.split('@')[0] || 
                   "User";
      setUserName(name);
    }
  };

  return (
    <SidebarProvider>
      <div className="h-screen flex w-full bg-background overflow-hidden">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col overflow-hidden">
          <header className="shrink-0 z-10 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="flex h-16 items-center justify-between px-6">
              <SidebarTrigger />
              <div className="text-sm font-medium text-foreground">
                Hi {userName}!
              </div>
            </div>
          </header>
          
          <main className="flex-1 overflow-y-auto">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
