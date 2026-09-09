import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { EligibilityResult } from "@/lib/eligibility";
import type { Opportunity } from "@/lib/opportunities";
import { Bookmark, BookmarkCheck, CalendarDays, CheckCircle2, CircleHelp, ExternalLink, MapPin, ShieldCheck, TriangleAlert } from "lucide-react";
import { useNavigate } from "react-router-dom";

interface OpportunityCardProps {
  opportunity: Opportunity;
  eligibility: EligibilityResult;
  saved: boolean;
  saving?: boolean;
  onSaveToggle: (opportunity: Opportunity) => void;
}

const verdictStyles: Record<EligibilityResult["verdict"], { label: string; className: string; icon: typeof CheckCircle2 }> = {
  likely: { label: "Likely match", className: "border-emerald-300 bg-emerald-50 text-emerald-800", icon: CheckCircle2 },
  possible: { label: "Needs review", className: "border-amber-300 bg-amber-50 text-amber-800", icon: CircleHelp },
  unlikely: { label: "Likely ineligible", className: "border-rose-300 bg-rose-50 text-rose-800", icon: TriangleAlert },
  "profile-needed": { label: "Add profile for match", className: "border-slate-300 bg-slate-50 text-slate-700", icon: CircleHelp },
};

function displayDate(value: string | null) {
  if (!value) return "No deadline published";
  const normalized = value.length === 10 ? `${value}T12:00:00Z` : value;
  return new Intl.DateTimeFormat("en-US", { month: "short", day: "numeric", year: "numeric" }).format(new Date(normalized));
}

function displayMoney(min: number | null, max: number | null) {
  const money = (value: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(value);
  if (min !== null && max !== null) return `${money(min)}–${money(max)}`;
  if (max !== null) return `Up to ${money(max)}`;
  if (min !== null) return `From ${money(min)}`;
  return null;
}

export function OpportunityCard({ opportunity, eligibility, saved, saving, onSaveToggle }: OpportunityCardProps) {
  const navigate = useNavigate();
  const verdict = verdictStyles[eligibility.verdict];
  const VerdictIcon = verdict.icon;
  const location = [opportunity.city, opportunity.county ? `${opportunity.county} County` : null, opportunity.state].filter(Boolean).join(", ");
  const amount = displayMoney(opportunity.minAmount, opportunity.maxAmount);
  const internalUrl = opportunity.source === "grants.gov"
    ? `/federal-grant/${opportunity.externalId}`
    : `/program/${opportunity.programId}`;

  return (
    <Card className="flex h-full flex-col border-border/70 transition hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-lg">
      <CardHeader className="space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{opportunity.sourceName}</Badge>
            <Badge variant="outline" className="capitalize">{opportunity.status}</Badge>
          </div>
          <Button
            size="icon"
            variant={saved ? "default" : "ghost"}
            disabled={saving}
            aria-label={saved ? "Remove saved opportunity" : "Save opportunity"}
            onClick={() => onSaveToggle(opportunity)}
          >
            {saved ? <BookmarkCheck className="h-4 w-4" /> : <Bookmark className="h-4 w-4" />}
          </Button>
        </div>
        <CardTitle className="text-xl leading-snug">{opportunity.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{opportunity.sponsor}</p>
      </CardHeader>
      <CardContent className="flex flex-1 flex-col gap-4">
        <button
          type="button"
          className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-left text-sm font-medium ${verdict.className}`}
          title={[...eligibility.reasons, ...eligibility.cautions, ...eligibility.missing].join(" • ")}
          onClick={() => navigate(internalUrl)}
        >
          <VerdictIcon className="h-4 w-4 shrink-0" />
          <span>{verdict.label}{eligibility.verdict !== "profile-needed" ? ` · ${eligibility.score}% fit` : ""}</span>
        </button>

        <p className="line-clamp-3 text-sm leading-6 text-muted-foreground">{opportunity.description}</p>

        <dl className="space-y-2 text-sm">
          <div className="flex items-center gap-2"><CalendarDays className="h-4 w-4 text-primary" /><span>{opportunity.status === "forecasted" && opportunity.opensAt ? `Opens ${displayDate(opportunity.opensAt)}` : `Deadline ${displayDate(opportunity.deadline)}`}</span></div>
          {location && <div className="flex items-center gap-2"><MapPin className="h-4 w-4 text-primary" /><span>{location}</span></div>}
          {amount && <div className="font-medium">{amount}</div>}
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <ShieldCheck className="h-3.5 w-3.5" />
            <span>{opportunity.verificationMethod}{opportunity.lastVerifiedAt ? ` · checked ${displayDate(opportunity.lastVerifiedAt)}` : ""}</span>
          </div>
        </dl>

        <div className="mt-auto grid grid-cols-2 gap-2 pt-2">
          <Button variant="outline" onClick={() => navigate(internalUrl)}>Eligibility details</Button>
          <Button asChild>
            <a href={opportunity.officialUrl} target="_blank" rel="noreferrer">
              Official source <ExternalLink className="ml-2 h-4 w-4" />
            </a>
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
