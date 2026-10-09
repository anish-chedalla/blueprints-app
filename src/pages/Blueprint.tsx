import { useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { generateLicensingSteps } from "@/lib/licensing-rules";
import { PIPELINE_STAGES } from "@/lib/pipeline";
import { getJourneyStatus, markBlueprintViewed, type JourneyStatus } from "@/lib/journey";
import { FileText, Briefcase, MapPin, ArrowRight, CheckCircle2, Circle } from "lucide-react";

type Profile = Tables<"profiles">;
type SavedRow = Tables<"saved_opportunities">;

export default function Blueprint() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<Profile | null>(null);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [checklistCompleted, setChecklistCompleted] = useState<Set<string>>(new Set());
  const [journeyStatus, setJourneyStatus] = useState<JourneyStatus | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const userId = session.user.id;

      const [profileResult, savedResult, checklistResult, status] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", userId).maybeSingle(),
        supabase.from("saved_opportunities").select("*").eq("user_id", userId),
        supabase.from("licensing_checklist_state").select("step_key, completed").eq("user_id", userId),
        getJourneyStatus(userId, session.user.last_sign_in_at ?? null),
      ]);

      setProfile(profileResult.data || null);
      setSaved(savedResult.data || []);
      setChecklistCompleted(new Set((checklistResult.data || []).filter((row) => row.completed).map((row) => row.step_key)));
      setJourneyStatus(status);
      setLoading(false);
      void markBlueprintViewed(userId);
    };
    void load();
  }, [navigate]);

  const pipelineByStage = useMemo(() => {
    const map = new Map<string, SavedRow[]>();
    for (const stage of PIPELINE_STAGES) map.set(stage, []);
    for (const row of saved) {
      const stage = map.has(row.pipeline_status) ? row.pipeline_status : "saved";
      map.get(stage)!.push(row);
    }
    return map;
  }, [saved]);

  const licensingSteps = useMemo(() => {
    if (!profile) return [];
    return generateLicensingSteps({
      city: profile.city || "",
      county: profile.county || "",
      industry: profile.industry_tags?.[0] || "",
      businessType: profile.business_type || "",
    });
  }, [profile]);

  if (loading) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading your blueprint…</div></DashboardLayout>;
  }

  const licensingCompletedCount = licensingSteps.filter((step) => checklistCompleted.has(step.id)).length;

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-4xl px-4 py-12">
        <div className="mb-8">
          <h1 className="text-4xl font-bold">Your Business Blueprint</h1>
          <p className="mt-2 text-lg text-muted-foreground">A single view of your profile, funding pipeline, and compliance progress.</p>
        </div>

        {journeyStatus && !journeyStatus.isComplete && (
          <Alert className="mb-8">
            <AlertTitle>{journeyStatus.completedCount} of {journeyStatus.totalCount} journey steps complete</AlertTitle>
            <AlertDescription>
              Finish your setup journey for a complete picture. <Link to="/journey" className="font-medium text-primary hover:underline">Go to your journey<ArrowRight className="ml-1 inline h-3 w-3" /></Link>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-8">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><MapPin className="h-5 w-5" />Business profile</CardTitle>
              <CardDescription>Based on your onboarding and settings. <Link to="/onboarding?edit=1" className="text-primary hover:underline">Edit profile</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {profile ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  <Field label="Business name" value={profile.business_name} />
                  <Field label="Business type" value={profile.business_type} />
                  <Field label="Location" value={[profile.city, profile.county].filter(Boolean).join(", ") || null} />
                  <Field label="Employees" value={profile.employees?.toString() ?? null} />
                  <Field label="Annual revenue" value={profile.revenue_usd ? `$${profile.revenue_usd.toLocaleString()}` : null} />
                  <Field label="Years in business" value={profile.years_in_business?.toString() ?? null} />
                  {profile.industry_tags && profile.industry_tags.length > 0 && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium uppercase text-muted-foreground">Industries</p>
                      <div className="mt-1 flex flex-wrap gap-2">{profile.industry_tags.map((tag) => <Badge key={tag} variant="outline">{tag}</Badge>)}</div>
                    </div>
                  )}
                </div>
              ) : <p className="text-muted-foreground">Complete your profile to see it here.</p>}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><Briefcase className="h-5 w-5" />Funding pipeline</CardTitle>
              <CardDescription>{saved.length} saved opportunit{saved.length === 1 ? "y" : "ies"}. <Link to="/saved" className="text-primary hover:underline">Manage saved funding</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {saved.length === 0 ? (
                <p className="text-muted-foreground">No grants or loans saved yet. <Link to="/grants" className="text-primary hover:underline">Browse grants</Link></p>
              ) : (
                <div className="grid gap-4 sm:grid-cols-3">
                  {PIPELINE_STAGES.map((stage) => {
                    const rows = pipelineByStage.get(stage) || [];
                    if (rows.length === 0) return null;
                    return (
                      <div key={stage}>
                        <p className="mb-2 text-xs font-medium uppercase text-muted-foreground">{stage} ({rows.length})</p>
                        <div className="space-y-1">
                          {rows.map((row) => <p key={row.id} className="truncate text-sm" title={row.title}>{row.title}</p>)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2"><FileText className="h-5 w-5" />Compliance checklist</CardTitle>
              <CardDescription>{licensingSteps.length > 0 ? `${licensingCompletedCount} of ${licensingSteps.length} complete.` : "Generate your checklist to see it here."} <Link to="/licensing" className="text-primary hover:underline">Go to licensing</Link></CardDescription>
            </CardHeader>
            <CardContent>
              {licensingSteps.length === 0 ? (
                <p className="text-muted-foreground">Add your city, county, and industry in your profile, then generate a checklist on the Licensing page.</p>
              ) : (
                <div className="space-y-2">
                  {licensingSteps.map((step) => {
                    const completed = checklistCompleted.has(step.id);
                    return (
                      <div key={step.id} className="flex items-center gap-2">
                        {completed ? <CheckCircle2 className="h-4 w-4 shrink-0 text-success" /> : <Circle className="h-4 w-4 shrink-0 text-muted-foreground" />}
                        <span className={completed ? "text-sm line-through text-muted-foreground" : "text-sm"}>{step.title}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}

function Field({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <p className="text-xs font-medium uppercase text-muted-foreground">{label}</p>
      <p className="text-sm">{value || "—"}</p>
    </div>
  );
}
