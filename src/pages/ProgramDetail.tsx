import { Navbar } from "@/components/Navbar";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Calendar as CalendarIcon, DollarSign, ExternalLink, Heart, MapPin, Bell } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { evaluateEligibility } from "@/lib/eligibility";
import { curatedProgramToOpportunity, serializeOpportunity } from "@/lib/opportunities";

type Program = Tables<"programs">;

export default function ProgramDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [program, setProgram] = useState<Program | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [isFavorite, setIsFavorite] = useState(false);
  const [loading, setLoading] = useState(true);
  const [reminderDate, setReminderDate] = useState<Date>();

  const fetchProgram = useCallback(async () => {
    try {
      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setProgram(data);
      const { data: { session } } = await supabase.auth.getSession();
      if (session) {
        const { data: profileData } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
        setProfile(profileData || null);
      }
    } catch {
      toast.error("Failed to load program");
      navigate("/");
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  const checkFavorite = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase.from("saved_opportunities").select("id")
      .eq("user_id", session.user.id).eq("program_id", id).maybeSingle();

    setIsFavorite(!!data);
  }, [id]);

  useEffect(() => {
    if (id) {
      void fetchProgram();
      void checkFavorite();
    }
  }, [checkFavorite, fetchProgram, id]);

  const handleFavorite = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to save programs");
      navigate("/auth");
      return;
    }

    try {
      if (!program) return;
      if (isFavorite) {
        const { error } = await supabase.from("saved_opportunities").delete()
          .eq("user_id", session.user.id).eq("program_id", id);

        if (error) throw error;
        toast.success("Removed from favorites");
        setIsFavorite(false);
      } else {
        const { error } = await supabase.from("saved_opportunities").insert({
          ...serializeOpportunity(curatedProgramToOpportunity(program)), user_id: session.user.id,
        });

        if (error) throw error;
        toast.success("Added to favorites");
        setIsFavorite(true);
      }
    } catch {
      toast.error("Failed to update favorites");
    }
  };

  const handleSetReminder = async () => {
    if (!reminderDate) {
      toast.error("Please select a date");
      return;
    }

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to set reminders");
      navigate("/auth");
      return;
    }

    try {
      if (!program) return;
      const serialized = serializeOpportunity(curatedProgramToOpportunity(program));
      const { data: savedRow, error: saveError } = await supabase.from("saved_opportunities").upsert({
        ...serialized, user_id: session.user.id,
      }, { onConflict: "user_id,source,external_id" }).select("id").single();
      if (saveError) throw saveError;
      const { error } = await supabase.from("opportunity_reminders").insert({
        user_id: session.user.id,
        saved_opportunity_id: savedRow.id,
        remind_at: reminderDate.toISOString(),
        delivery_channels: ["in_app"],
      });

      if (error) throw error;
      toast.success("Reminder set successfully");
      setReminderDate(undefined);
    } catch {
      toast.error("Failed to set reminder");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <p className="text-center text-muted-foreground">Loading program...</p>
        </div>
      </div>
    );
  }

  if (!program) return null;

  const opportunity = curatedProgramToOpportunity(program);
  const eligibility = evaluateEligibility(profile, opportunity);

  const formatAmount = (min?: number, max?: number) => {
    if (!min && !max) return null;
    const format = (n: number) => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(n);
    if (min && max) return `${format(min)} - ${format(max)}`;
    if (min) return `From ${format(min)}`;
    if (max) return `Up to ${format(max)}`;
  };

  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <Button variant="ghost" onClick={() => navigate(-1)} className="mb-4">
          ← Back
        </Button>

        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-2 flex-1">
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge className={
                    program.level === "LOCAL" ? "bg-accent/20 text-accent-foreground" :
                    program.level === "STATE" ? "bg-primary/20 text-primary" :
                    "bg-secondary text-secondary-foreground"
                  }>
                    {program.level}
                  </Badge>
                  <Badge variant="outline">{program.type}</Badge>
                  <Badge variant="secondary">{program.status}</Badge>
                </div>
                <CardTitle className="text-3xl">{program.name}</CardTitle>
                <CardDescription className="text-lg">by {program.sponsor}</CardDescription>
              </div>
              
              <Button
                size="icon"
                variant={isFavorite ? "default" : "outline"}
                onClick={handleFavorite}
              >
                <Heart className={`h-5 w-5 ${isFavorite ? "fill-current" : ""}`} />
              </Button>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-lg mb-2">Overview</h3>
                <p className="text-muted-foreground">{program.description}</p>
              </div>

              <div className="grid md:grid-cols-2 gap-4">
                {(program.city || program.county) && (
                  <div className="flex items-start gap-2">
                    <MapPin className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Location</div>
                      <div className="text-sm text-muted-foreground">
                        {[program.city, program.county, program.state].filter(Boolean).join(", ")}
                      </div>
                    </div>
                  </div>
                )}

                {formatAmount(program.min_amount, program.max_amount) && (
                  <div className="flex items-start gap-2">
                    <DollarSign className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Amount</div>
                      <div className="text-sm text-muted-foreground">
                        {formatAmount(program.min_amount, program.max_amount)}
                      </div>
                    </div>
                  </div>
                )}

                {(program.rolling || program.deadline) && (
                  <div className="flex items-start gap-2">
                    <CalendarIcon className="h-5 w-5 text-muted-foreground mt-0.5" />
                    <div>
                      <div className="font-medium">Deadline</div>
                      <div className="text-sm text-muted-foreground">
                        {program.rolling ? "Rolling application" : new Date(program.deadline).toLocaleDateString()}
                      </div>
                    </div>
                  </div>
                )}
              </div>

              {program.industry_tags && program.industry_tags.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Industries</div>
                  <div className="flex flex-wrap gap-2">
                    {program.industry_tags.map((tag: string) => (
                      <Badge key={tag} variant="secondary">{tag}</Badge>
                    ))}
                  </div>
                </div>
              )}

              {program.use_cases && program.use_cases.length > 0 && (
                <div>
                  <div className="font-medium mb-2">Use Cases</div>
                  <div className="flex flex-wrap gap-2">
                    {program.use_cases.map((useCase: string) => (
                      <Badge key={useCase} variant="secondary">{useCase}</Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="rounded-xl border bg-muted/30 p-4">
                <div className="mb-2 flex flex-wrap items-center gap-2">
                  <div className="font-medium">Your eligibility check</div>
                  <Badge variant={eligibility.verdict === "unlikely" ? "destructive" : "secondary"} className="capitalize">
                    {eligibility.verdict.replace("-", " ")}{eligibility.verdict !== "profile-needed" ? ` · ${eligibility.score}% fit` : ""}
                  </Badge>
                </div>
                {eligibility.reasons.map((reason) => <p key={reason} className="text-sm text-emerald-700">✓ {reason}</p>)}
                {eligibility.cautions.map((reason) => <p key={reason} className="text-sm text-amber-700">! {reason}</p>)}
                {eligibility.missing.map((reason) => <p key={reason} className="text-sm text-muted-foreground">? {reason}</p>)}
                <p className="mt-3 text-xs text-muted-foreground">Pre-screen only. Confirm all requirements with the funder.</p>
              </div>

              <div className="rounded-xl border p-4 text-sm">
                <div className="font-medium">Source & freshness</div>
                <p className="mt-1 text-muted-foreground">{opportunity.sourceName} · {opportunity.verificationMethod}</p>
                {opportunity.lastVerifiedAt && <p className="text-muted-foreground">Last checked {new Date(opportunity.lastVerifiedAt).toLocaleDateString()}</p>}
              </div>

              {program.interest_min !== null && program.interest_max !== null && (
                <div>
                  <div className="font-medium mb-2">Interest Rate</div>
                  <div className="text-sm text-muted-foreground">
                    {program.interest_min}% - {program.interest_max}%
                  </div>
                </div>
              )}
            </div>

            <div className="flex flex-wrap gap-4 pt-4">
              <Button asChild className="flex-1">
                <a href={program.url} target="_blank" rel="noopener noreferrer">
                  <ExternalLink className="h-4 w-4 mr-2" />
                  View official source
                </a>
              </Button>

              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline">
                    <Bell className="h-4 w-4 mr-2" />
                    Set Reminder
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Set Reminder</DialogTitle>
                    <DialogDescription>
                      Choose when you'd like to be reminded about this program
                    </DialogDescription>
                  </DialogHeader>
                  <div className="flex justify-center py-4">
                    <Calendar
                      mode="single"
                      selected={reminderDate}
                      onSelect={setReminderDate}
                      disabled={(date) => date < new Date()}
                      className="rounded-md border"
                    />
                  </div>
                  <DialogFooter>
                    <Button onClick={handleSetReminder} disabled={!reminderDate}>
                      Set Reminder
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
