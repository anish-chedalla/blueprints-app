import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate, useSearchParams } from "react-router-dom";
import type { TablesInsert } from "@/integrations/supabase/types";
import { AuthHeader } from "@/components/AuthHeader";
import { BusinessInfoFields } from "@/components/profile/BusinessInfoFields";
import { LocationFields } from "@/components/profile/LocationFields";
import { IndustryDemographicsFields } from "@/components/profile/IndustryDemographicsFields";
import { emptyProfileFormData, optionalNumber } from "@/lib/profile-form";

// This page is reached only via /onboarding?edit=1 (Settings, Blueprint, Idea Lab
// "edit profile" links). First-run profile setup now happens inline on the
// /journey page, so any other visit to this route just forwards there.
export default function Onboarding() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editMode = searchParams.get("edit") === "1";
  const [step, setStep] = useState(1);
  const justAdvancedAt = useRef(0);
  const [formData, setFormData] = useState(emptyProfileFormData);

  useEffect(() => {
    if (!editMode) {
      navigate("/journey", { replace: true });
      return;
    }

    const loadExistingProfile = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("*")
        .eq("user_id", session.user.id)
        .single();

      if (profile) {
        setFormData({
          businessName: profile.business_name || "",
          businessType: profile.business_type || "",
          city: profile.city || "",
          county: profile.county || "",
          employees: profile.employees?.toString() || "",
          revenue: profile.revenue_usd?.toString() || "",
          yearsInBusiness: profile.years_in_business?.toString() || "",
          industryTags: profile.industry_tags || [],
          demographics: profile.demographics || [],
        });
      }
    };
    loadExistingProfile();
  }, [editMode, navigate]);

  if (!editMode) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    // The "Next" button on the second-to-last step and the "Complete Setup" submit
    // button occupy the same screen position across the re-render, so a reflexive
    // double-click meant for "Next" can land its second click on "Complete Setup"
    // before the final step is ever visible. Ignore submits that land immediately
    // after advancing to the final step so that stray click can't skip it.
    if (Date.now() - justAdvancedAt.current < 400) return;
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    try {
      const profileData: TablesInsert<"profiles"> = {
        user_id: session.user.id,
        business_name: formData.businessName,
        city: formData.city || null,
        county: formData.county || null,
        employees: optionalNumber(formData.employees),
        revenue_usd: optionalNumber(formData.revenue),
        business_type: formData.businessType || null,
        years_in_business: optionalNumber(formData.yearsInBusiness),
        industry_tags: formData.industryTags,
        demographics: formData.demographics,
      };

      const { error } = await supabase.from("profiles").upsert(profileData);

      if (error) throw error;
      toast.success("Profile saved successfully!");
      navigate("/grants");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const totalSteps = 3;

  const renderStep = () => {
    switch (step) {
      case 1:
        return <BusinessInfoFields formData={formData} setFormData={setFormData} />;
      case 2:
        return <LocationFields formData={formData} setFormData={setFormData} />;
      case 3:
        return <IndustryDemographicsFields formData={formData} setFormData={setFormData} />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto w-full max-w-6xl px-5 py-5 sm:px-8">
        <AuthHeader backTo="/settings" backLabel="Back to settings" />
      </div>
      <div className="flex items-center justify-center p-4">
      <div className="w-full max-w-2xl animate-scale-in">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl">Update Match Profile</CardTitle>
              <span className="text-sm text-muted-foreground">Step {step} of {totalSteps}</span>
            </div>
            <div className="w-full bg-secondary h-2 rounded-full overflow-hidden">
              <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(step / totalSteps) * 100}%` }} />
            </div>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {renderStep()}
              <div className="flex gap-3 pt-4">
                {step > 1 && (
                  <Button type="button" variant="outline" onClick={() => setStep(step - 1)} className="w-full">
                    Previous
                  </Button>
                )}
                {step < totalSteps ? (
                  <Button type="button" onClick={() => { if (step + 1 === totalSteps) justAdvancedAt.current = Date.now(); setStep(step + 1); }} className="w-full" disabled={step === 1 && (!formData.businessName || !formData.businessType)}>
                    Next
                  </Button>
                ) : (
                  <Button type="submit" className="w-full">
                    Complete Setup
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
      </div>
    </div>
  );
}
