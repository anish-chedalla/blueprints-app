import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import type { FederalGrantSearchHit } from "@/lib/grants-gov";
import { ArrowRight, Building2, CalendarDays, Hash } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface FederalGrantCardProps {
  opportunity: FederalGrantSearchHit;
}

function formatDate(value: string | null): string {
  if (!value) return "Not announced";
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
  }).format(new Date(`${value}T12:00:00Z`));
}

export function FederalGrantCard({ opportunity }: FederalGrantCardProps) {
  const navigate = useNavigate();

  return (
    <Card
      className="group flex h-full cursor-pointer flex-col border-border/60 transition-all hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg"
      onClick={() => navigate(`/federal-grant/${opportunity.id}`)}
    >
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <Badge>Official federal listing</Badge>
          <Badge variant="outline" className="capitalize">
            {opportunity.status || opportunity.documentType}
          </Badge>
        </div>
        <CardTitle className="text-xl leading-snug transition-colors group-hover:text-primary">
          {opportunity.title}
        </CardTitle>
        <CardDescription className="flex items-start gap-2 text-sm">
          <Building2 className="mt-0.5 h-4 w-4 shrink-0" />
          <span>{opportunity.agency}</span>
        </CardDescription>
      </CardHeader>

      <CardContent className="flex flex-1 flex-col gap-4">
        <dl className="space-y-2 text-sm">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Hash className="h-4 w-4 shrink-0" />
            <dt className="sr-only">Opportunity number</dt>
            <dd>{opportunity.number || `Opportunity ${opportunity.id}`}</dd>
          </div>
          <div className="flex items-center gap-2 text-muted-foreground">
            <CalendarDays className="h-4 w-4 shrink-0" />
            <dt className="sr-only">Closing date</dt>
            <dd>
              {opportunity.status === "forecasted"
                ? `Forecasted · closes ${formatDate(opportunity.closeDate)}`
                : `Closes ${formatDate(opportunity.closeDate)}`}
            </dd>
          </div>
        </dl>

        {opportunity.alnNumbers.length > 0 && (
          <div className="flex flex-wrap gap-2">
            {opportunity.alnNumbers.slice(0, 3).map((aln) => (
              <Badge key={aln} variant="secondary">ALN {aln}</Badge>
            ))}
          </div>
        )}

        <Button variant="outline" className="mt-auto w-full group-hover:bg-primary group-hover:text-primary-foreground">
          View eligibility and award details
          <ArrowRight className="ml-2 h-4 w-4 transition-transform group-hover:translate-x-1" />
        </Button>
      </CardContent>
    </Card>
  );
}
