import { Link } from "react-router-dom";
import { ArrowLeft } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import blueprintsIcon from "@/assets/blueprints-icon.png";

interface AuthHeaderProps {
  backTo?: string;
  backLabel?: string;
}

export function AuthHeader({ backTo = "/", backLabel = "Back to home" }: AuthHeaderProps) {
  return (
    <header className="flex items-center justify-between">
      <Link to="/" className="group flex items-center gap-2.5 rounded-lg py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
        <img
          src={blueprintsIcon}
          alt=""
          className="h-8 w-8 rounded-md transition-transform duration-300 group-hover:scale-110"
        />
        <span className="text-lg font-semibold tracking-tight">Blueprints</span>
      </Link>
      <div className="flex items-center gap-1">
        <ThemeToggle />
        <Button asChild variant="ghost" className="text-muted-foreground hover:text-foreground">
          <Link to={backTo}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {backLabel}
          </Link>
        </Button>
      </div>
    </header>
  );
}
