import { Link, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Menu, X } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useNavigate } from "react-router-dom";

export const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);

  // Check auth state
  useState(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  });

  const isActive = (path: string) => location.pathname === path;

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const navLinks = [
    { path: "/grants", label: "Grants" },
    { path: "/loans", label: "Loans" },
    { path: "/idea-lab", label: "Idea Lab" },
    { path: "/saved", label: "Saved" },
    { path: "/dashboard", label: "Dashboard" },
  ];

  return (
    <nav className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto px-4">
        <div className="flex h-16 items-center justify-between">
          <Link to={user ? "/dashboard" : "/"} className="flex items-center gap-2 group">
            <Building2 className="h-6 w-6 text-primary transition-all duration-300 group-hover:scale-110 group-hover:rotate-12" />
            <span className="text-xl font-bold tracking-tight transition-colors duration-200 group-hover:text-primary">Blueprints</span>
          </Link>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                className={`text-sm font-medium transition-all duration-200 hover:text-primary relative after:absolute after:bottom-0 after:left-0 after:h-0.5 after:w-0 after:bg-primary after:transition-all after:duration-200 hover:after:w-full ${
                  isActive(link.path) ? "text-primary after:w-full" : "text-muted-foreground"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <Button onClick={handleSignOut} variant="outline" size="sm" className="transition-all duration-200">
                Sign Out
              </Button>
            ) : (
              <Button asChild size="sm" className="transition-all duration-200">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <button
            onClick={() => setIsOpen(!isOpen)}
            className="md:hidden p-2 text-foreground hover:bg-muted rounded-lg"
          >
            {isOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden py-4 border-t space-y-2 animate-fade-in">
            {navLinks.map((link) => (
              <Link
                key={link.path}
                to={link.path}
                onClick={() => setIsOpen(false)}
                className={`block px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
                  isActive(link.path)
                    ? "bg-primary text-primary-foreground"
                    : "text-muted-foreground hover:bg-muted hover:translate-x-1"
                }`}
              >
                {link.label}
              </Link>
            ))}
            
            {user ? (
              <Button onClick={handleSignOut} variant="outline" size="sm" className="w-full transition-all duration-200">
                Sign Out
              </Button>
            ) : (
              <Button asChild size="sm" className="w-full transition-all duration-200">
                <Link to="/auth">Sign In</Link>
              </Button>
            )}
          </div>
        )}
      </div>
    </nav>
  );
};
