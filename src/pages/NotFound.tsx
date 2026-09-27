import { useLocation } from "react-router-dom";
import { Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { AuthHeader } from "@/components/AuthHeader";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <AuthHeader />
      </div>
      <div className="grid min-h-[calc(100vh-6rem)] place-items-center px-5">
        <div className="text-center">
          <p className="text-sm font-semibold text-accent">404</p>
          <h1 className="mt-2 text-3xl font-semibold tracking-tight">Page not found</h1>
          <p className="mt-2 text-muted-foreground">The page you're looking for doesn't exist or has moved.</p>
          <Button asChild className="mt-6">
            <Link to="/">Return to home</Link>
          </Button>
        </div>
      </div>
    </main>
  );
};

export default NotFound;
