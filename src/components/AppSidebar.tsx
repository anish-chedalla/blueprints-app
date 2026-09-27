import { Home, Award, DollarSign, Bookmark, Settings, LogOut, History } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  Sidebar,
  SidebarContent,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Grant Finder", url: "/grants", icon: Award },
  { title: "Saved Funding", url: "/saved", icon: Bookmark },
  { title: "Loan Programs", url: "/loans", icon: DollarSign },
  { title: "History", url: "/history", icon: History },
];

export function AppSidebar() {
  const navigate = useNavigate();

  const handleSignOut = async () => {
    const { error } = await supabase.auth.signOut();
    if (error) {
      toast.error("Failed to sign out");
    } else {
      toast.success("Signed out successfully");
      navigate("/auth");
    }
  };

  return (
      <Sidebar className="ml-2">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-4">
            <h2 className="text-xl font-bold text-foreground">
              Blueprints
            </h2>
          </div>
        </SidebarHeader>
        
        <SidebarContent>
          <SidebarMenu>
            {items.map((item) => (
              <SidebarMenuItem key={item.title}>
                <SidebarMenuButton asChild>
                  <NavLink
                    to={item.url}
                    className={({ isActive }) =>
                      isActive
                        ? "bg-accent/10 text-accent font-medium text-base"
                        : "text-muted-foreground hover:bg-muted/50 hover:text-foreground text-base"
                    }
                  >
                    <item.icon className="w-5 h-5" />
                    <span>{item.title}</span>
                  </NavLink>
                </SidebarMenuButton>
              </SidebarMenuItem>
            ))}
          </SidebarMenu>
        </SidebarContent>

        <SidebarFooter className="mt-auto border-t">
          <div className="p-2 space-y-2">
            <Button 
              variant="ghost" 
              className="w-full justify-start text-base"
              onClick={() => navigate("/settings")}
            >
              <Settings className="mr-2 h-5 w-5" />
              Settings
            </Button>
            <Button 
              variant="ghost" 
              className="w-full justify-start text-base text-destructive hover:text-destructive hover:bg-destructive/10"
              onClick={handleSignOut}
            >
              <LogOut className="mr-2 h-5 w-5" />
              Sign Out
            </Button>
          </div>
        </SidebarFooter>
      </Sidebar>
  );
}
