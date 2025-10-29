import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Heart, ExternalLink, Calendar, DollarSign, MapPin } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

interface ProgramCardProps {
  program: {
    id: string;
    type: "GRANT" | "LOAN";
    level: "LOCAL" | "STATE" | "NATIONAL";
    name: string;
    sponsor: string;
    description: string;
    min_amount?: number;
    max_amount?: number;
    deadline?: string;
    rolling: boolean;
    status: string;
    city?: string;
    county?: string;
  };
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
}

export const ProgramCard = ({ program, isFavorite = false, onFavoriteToggle }: ProgramCardProps) => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleFavorite = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to save programs");
      navigate("/auth");
      return;
    }

    setLoading(true);
    try {
      if (isFavorite) {
        const { error } = await supabase
          .from("favorites")
          .delete()
          .eq("user_id", session.user.id)
          .eq("program_id", program.id);

        if (error) throw error;
        toast.success("Removed from favorites");
      } else {
        const { error } = await supabase
          .from("favorites")
          .insert({ user_id: session.user.id, program_id: program.id });

        if (error) throw error;
        toast.success("Added to favorites");
      }
      onFavoriteToggle?.();
    } catch (error) {
      toast.error("Failed to update favorites");
    } finally {
      setLoading(false);
    }
  };

  const formatAmount = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
  };

  const getLevelColor = (level: string) => {
    switch (level) {
      case "LOCAL": return "bg-accent/20 text-accent-foreground";
      case "STATE": return "bg-primary/20 text-primary";
      case "NATIONAL": return "bg-secondary text-secondary-foreground";
      default: return "bg-muted";
    }
  };

  return (
    <Card 
      className="hover-lift transition-all duration-300 cursor-pointer group border-border/50 hover:border-primary/30"
      onClick={() => navigate(`/program/${program.id}`)}
    >
      <CardHeader>
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-2 flex-1">
            <div className="flex items-center gap-2 flex-wrap">
              <Badge className={`${getLevelColor(program.level)} transition-all duration-200`}>
                {program.level}
              </Badge>
              <Badge variant="outline" className="transition-all duration-200">
                {program.type}
              </Badge>
            </div>
            <CardTitle className="text-xl group-hover:text-primary transition-colors duration-200">
              {program.name}
            </CardTitle>
            <CardDescription className="text-sm">
              by {program.sponsor}
            </CardDescription>
          </div>
          <Button
            size="icon"
            variant="ghost"
            onClick={handleFavorite}
            disabled={loading}
            className="shrink-0 hover:scale-110 transition-transform duration-200"
          >
            <Heart
              className={`h-5 w-5 transition-all duration-200 ${
                isFavorite ? "fill-red-500 text-red-500 scale-110" : "text-muted-foreground hover:text-red-500"
              }`}
            />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        <p className="text-sm text-muted-foreground line-clamp-2">
          {program.description}
        </p>

        <div className="space-y-2 text-sm">
          {(program.city || program.county) && (
            <div className="flex items-center gap-2 text-muted-foreground transition-colors duration-200 group-hover:text-foreground">
              <MapPin className="h-4 w-4" />
              <span>{[program.city, program.county].filter(Boolean).join(", ")}</span>
            </div>
          )}
          
          {formatAmount(program.min_amount, program.max_amount) && (
            <div className="flex items-center gap-2 text-foreground font-medium">
              <DollarSign className="h-4 w-4 text-primary" />
              <span>{formatAmount(program.min_amount, program.max_amount)}</span>
            </div>
          )}

          {program.rolling ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span className="text-accent font-medium">Rolling Application</span>
            </div>
          ) : program.deadline ? (
            <div className="flex items-center gap-2 text-muted-foreground">
              <Calendar className="h-4 w-4" />
              <span>Deadline: {new Date(program.deadline).toLocaleDateString()}</span>
            </div>
          ) : null}
        </div>

        <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
          <span>View Details</span>
          <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
        </Button>
      </CardContent>
    </Card>
  );
};
