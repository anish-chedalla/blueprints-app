import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getJourneyStatus, upsertProfileField, JOURNEY_STEPS, type JourneyStatus } from "@/lib/journey";
import { emptyProfileFormData, optionalNumber, type ProfileFormData } from "@/lib/profile-form";
import { BusinessInfoFields } from "@/components/profile/BusinessInfoFields";
import { LocationFields } from "@/components/profile/LocationFields";
import { IndustryDemographicsFields } from "@/components/profile/IndustryDemographicsFields";
import { ArrowRight, CheckCircle2, Circle, Compass } from "lucide-react";

type ProfileStepKey = "business" | "location" | "industry";
const PROFILE_STEP_KEYS: ProfileStepKey[] = ["business", "location", "industry"];

export default function Journey() {
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [status, setStatus] = useState<JourneyStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [formData, setFormData] = useState<ProfileFormData>(emptyProfileFormData);
  const [editingStep, setEditingStep] = useState<ProfileStepKey | null>(null);
  const [saving, setSaving] = useState(false);

  const refreshStatus = async (uid: string, lastSignInAt: string | null) => {
    const result = await getJourneyStatus(uid, lastSignInAt);
    setStatus(result);
    if (result.profile) {
      setFormData({
        businessName: result.profile.business_name || "",
        businessType: result.profile.business_type || "",
        city: result.profile.city || "",
        county: result.profile.county || "",
        employees: result.profile.employees?.toString() || "",
        revenue: result.profile.revenue_usd?.toString() || "",
        yearsInBusiness: result.profile.years_in_business?.toString() || "",
        industryTags: result.profile.industry_tags || [],
        demographics: result.profile.demographics || [],
      });
    }
    return result;
  };

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      const result = await refreshStatus(session.user.id, session.user.last_sign_in_at ?? null);
      const firstIncompleteProfileStep = PROFILE_STEP_KEYS.find((key) => !result.steps.find((step) => step.key === key)?.completed);
      setEditingStep(firstIncompleteProfileStep ?? null);
      setLoading(false);
    };
    void load();
  }, [navigate]);

  const saveProfileStep = async (key: ProfileStepKey) => {
    if (!userId) return;
    setSaving(true);
    const fieldsByStep: Record<ProfileStepKey, Record<string, unknown>> = {
      business: {
        business_name: formData.businessName,
        business_type: formData.businessType || null,
        employees: optionalNumber(formData.employees),
        revenue_usd: optionalNumber(formData.revenue),
        years_in_business: optionalNumber(formData.yearsInBusiness),
      },
      location: {
        city: formData.city || null,
        county: formData.county || null,
      },
      industry: {
        industry_tags: formData.industryTags,
        demographics: formData.demographics,
      },
    };
    const { error } = await upsertProfileField(userId, fieldsByStep[key]);
    setSaving(false);
    if (error) return;
    setEditingStep(null);
    const { data: { session } } = await supabase.auth.getSession();
    await refreshStatus(userId, session?.user.last_sign_in_at ?? null);
  };

  if (loading || !status) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading your journey…</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Compass className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Your setup journey</h1>
            <p className="text-muted-foreground">Everything here is optional and in any order — explore freely, and come back anytime to fill in the rest.</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{status.completedCount} of {status.totalCount} steps complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(status.completedCount / status.totalCount) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          {JOURNEY_STEPS.map((step, index) => {
            const stepStatus = status.steps.find((item) => item.key === step.key);
            const completed = Boolean(stepStatus?.completed);
            const isProfileStep = PROFILE_STEP_KEYS.includes(step.key as ProfileStepKey);

            if (isProfileStep) {
              const key = step.key as ProfileStepKey;
              const editing = editingStep === key;
              return (
                <Card key={step.key} className={completed ? "border-success/30 bg-success/5" : ""}>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3">
                        {completed ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <Circle className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
                        <div>
                          <CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle>
                          <CardDescription className="mt-1">{step.description}</CardDescription>
                        </div>
                      </div>
                      {!editing && (
                        <Button variant={completed ? "outline" : "default"} size="sm" className="shrink-0" onClick={() => setEditingStep(key)}>
                          {completed ? "Edit" : step.cta}
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  {editing && (
                    <CardContent className="space-y-4">
                      <ProfileStepFields stepKey={key} formData={formData} setFormData={setFormData} />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => saveProfileStep(key)} disabled={saving}>{saving ? "Saving…" : "Save"}</Button>
                        <Button size="sm" variant="outline" onClick={() => setEditingStep(null)}>Cancel</Button>
                      </div>
                    </CardContent>
                  )}
                </Card>
              );
            }

            // Funding/licensing/pipeline no longer repeat their explanation here —
            // it's shown as a goal popup on the destination page itself instead,
            // right where it's actually relevant. Blueprint has no such popup
            // (it's the finale, not a task), so it keeps its one-liner.
            const showDescription = step.key === "blueprint";
            return (
              <Card key={step.key} className={completed ? "border-success/30 bg-success/5" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {completed ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <Circle className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
                      <div>
                        <CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle>
                        {showDescription && <CardDescription className="mt-1">{step.description}</CardDescription>}
                      </div>
                    </div>
                    <Button asChild variant={completed ? "outline" : "default"} size="sm" className="shrink-0">
                      <Link to={step.href}>{completed ? "Review" : step.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {status.isComplete && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <h2 className="text-xl font-semibold">You're all set up!</h2>
                <p className="text-muted-foreground">Your blueprint is ready to view.</p>
              </div>
              <Button asChild size="lg"><Link to="/blueprint">View your Blueprint<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}

function ProfileStepFields({ stepKey, formData, setFormData }: { stepKey: ProfileStepKey; formData: ProfileFormData; setFormData: React.Dispatch<React.SetStateAction<ProfileFormData>> }) {
  if (stepKey === "business") return <BusinessInfoFields formData={formData} setFormData={setFormData} showHeading={false} />;
  if (stepKey === "location") return <LocationFields formData={formData} setFormData={setFormData} showHeading={false} />;
  return <IndustryDemographicsFields formData={formData} setFormData={setFormData} showHeading={false} />;
}
