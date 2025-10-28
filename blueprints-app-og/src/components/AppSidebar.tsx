import { Home, Award, DollarSign, Lightbulb, FileText, Bookmark, Rocket, Settings, LogOut } from "lucide-react";
import { NavLink, useNavigate } from "react-router-dom";
import { useState } from "react";
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
import { ProfileSettingsDialog } from "./ProfileSettingsDialog";
import { toast } from "sonner";
import blueprintsLogo from "@/assets/blueprints-logo.png";

const items = [
  { title: "Dashboard", url: "/dashboard", icon: Home },
  { title: "Grants", url: "/grants", icon: Award },
  { title: "Loans", url: "/loans", icon: DollarSign },
  { title: "Idea Lab", url: "/idea-lab", icon: Lightbulb },
  { title: "Launch Companion", url: "/assistant", icon: Rocket },
  { title: "Licensing", url: "/licensing", icon: FileText },
  { title: "Saved", url: "/saved", icon: Bookmark },
];

export function AppSidebar() {
  const navigate = useNavigate();
  const [profileDialogOpen, setProfileDialogOpen] = useState(false);

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
    <>
      <ProfileSettingsDialog open={profileDialogOpen} onOpenChange={setProfileDialogOpen} />
      <Sidebar className="ml-2">
        <SidebarHeader>
          <div className="flex items-center gap-3 px-4 py-4">
            <h2 className="font-bold text-xl bg-gradient-to-r from-black via-blue-100 to-blue-400 bg-clip-text text-transparent">
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
                        ? "text-foreground bg-transparent hover:bg-muted/50 text-base" 
                        : "text-foreground bg-transparent hover:bg-muted/50 text-base"
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
              onClick={() => setProfileDialogOpen(true)}
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
    </>
  );
}
