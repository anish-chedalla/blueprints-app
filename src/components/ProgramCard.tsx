import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Bookmark, BookmarkCheck, ExternalLink, Calendar, DollarSign, MapPin } from "lucide-react";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { curatedProgramToOpportunity, serializeOpportunity } from "@/lib/opportunities";
import { recordOpportunityView } from "@/lib/view-history";

interface ProgramCardProps {
  program: {
    id: string;
    type: "GRANT" | "LOAN";
    level: "LOCAL" | "STATE" | "NATIONAL";
    name: string;
    sponsor: string;
    description: string;
    min_amount?: number | null;
    max_amount?: number | null;
    deadline?: string | null;
    rolling: boolean | null;
    status: string;
    city?: string | null;
    county?: string | null;
    url: string;
    source_id?: string | null;
    source_url?: string | null;
    last_verified_at?: string | null;
  };
  isFavorite?: boolean;
  onFavoriteToggle?: () => void;
  externalOnly?: boolean;
}

export const ProgramCard = ({ program, isFavorite = false, onFavoriteToggle, externalOnly = false }: ProgramCardProps) => {
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
          .from("saved_opportunities")
          .delete()
          .eq("user_id", session.user.id)
          .eq("source", "blueprints")
          .eq("external_id", program.source_id || program.id);

        if (error) throw error;
        toast.success("Removed from saved funding");
      } else {
        const opportunity = curatedProgramToOpportunity(program as Parameters<typeof curatedProgramToOpportunity>[0]);
        const { error } = await supabase
          .from("saved_opportunities")
          .upsert({ ...serializeOpportunity(opportunity), user_id: session.user.id }, { onConflict: "user_id,source,external_id" });

        if (error) throw error;
        toast.success("Saved to your funding list");
      }
      onFavoriteToggle?.();
    } catch (error) {
      toast.error("Failed to update saved funding");
    } finally {
      setLoading(false);
    }
  };
  const opportunity = curatedProgramToOpportunity(program as Parameters<typeof curatedProgramToOpportunity>[0]);
  const openDetails = () => {
    void recordOpportunityView(opportunity);
    navigate(`/program/${program.id}`);
  };

  const formatAmount = (min?: number | null, max?: number | null) => {
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
      className={`hover-lift transition-all duration-300 group border-border/50 hover:border-primary/30 ${externalOnly ? "" : "cursor-pointer"}`}
      onClick={externalOnly ? undefined : openDetails}
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
          {!externalOnly && <Button
            size="icon"
            variant="ghost"
            onClick={handleFavorite}
            disabled={loading}
            className="shrink-0 hover:scale-110 transition-transform duration-200"
          >
            {isFavorite ? <BookmarkCheck
              className={`h-5 w-5 transition-all duration-200 ${
                "text-primary scale-110"
              }`}
            /> : <Bookmark className="h-5 w-5 text-muted-foreground hover:text-primary" />}
          </Button>}
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

          {program.last_verified_at && (
            <p className="text-xs text-muted-foreground">
              Official source checked {new Date(program.last_verified_at).toLocaleDateString()}
            </p>
          )}
        </div>

        {externalOnly ? (
          <Button asChild variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <a href={program.source_url || program.url} target="_blank" rel="noopener noreferrer" onClick={() => void recordOpportunityView(opportunity)}>
              <span>Open official program</span>
              <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
            </a>
          </Button>
        ) : (
          <Button variant="outline" size="sm" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-all duration-300">
            <span>View Details</span>
            <ExternalLink className="h-4 w-4 ml-2 group-hover:translate-x-1 transition-transform duration-200" />
          </Button>
        )}
      </CardContent>
    </Card>
  );
};
