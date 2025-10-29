import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";
import { Building2, MapPin, Users, Briefcase, Award } from "lucide-react";

const INDUSTRIES = ["technology", "retail", "services", "food service", "sustainability", "biotech", "manufacturing", "healthcare"];
const DEMOGRAPHICS = ["women_owned", "veteran_owned", "minority_owned"];
const BUSINESS_TYPES = ["LLC", "Sole Proprietor", "Corporation", "Partnership", "Nonprofit"];

export default function Onboarding() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState({
    businessName: "",
    businessType: "",
    city: "",
    county: "",
    employees: "",
    industryTags: [] as string[],
    demographics: [] as string[],
  });

  useEffect(() => {
    const checkExistingProfile = async () => {
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

      if (profile?.business_name) {
        navigate("/dashboard");
      }
    };
    checkExistingProfile();
  }, [navigate]);

  const toggleTag = (tag: string, field: "industryTags" | "demographics") => {
    setFormData(prev => ({
      ...prev,
      [field]: prev[field].includes(tag) ? prev[field].filter(t => t !== tag) : [...prev[field], tag]
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in first");
      navigate("/auth");
      return;
    }

    try {
      const profileData: any = {
        user_id: session.user.id,
        business_name: formData.businessName,
        city: formData.city || null,
        county: formData.county || null,
        employees: parseInt(formData.employees) || null,
        industry_tags: formData.industryTags,
        demographics: formData.demographics,
      };

      const { error } = await supabase.from("profiles").upsert(profileData);

      if (error) throw error;
      toast.success("Profile saved successfully!");
      navigate("/dashboard");
    } catch (error) {
      toast.error("Failed to save profile");
    }
  };

  const totalSteps = 3;

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Building2 className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Business Information</h3>
                <p className="text-sm text-muted-foreground">Tell us about your business</p>
              </div>
            </div>
            <div>
              <Label htmlFor="businessName">Business Name *</Label>
              <Input id="businessName" value={formData.businessName} onChange={(e) => setFormData({...formData, businessName: e.target.value})} placeholder="Enter your business name" required />
            </div>
            <div>
              <Label htmlFor="businessType">Business Type *</Label>
              <Select value={formData.businessType} onValueChange={(value) => setFormData({...formData, businessType: value})}>
                <SelectTrigger>
                  <SelectValue placeholder="Select business type" />
                </SelectTrigger>
                <SelectContent>
                  {BUSINESS_TYPES.map((type) => (
                    <SelectItem key={type} value={type}>{type}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label htmlFor="employees">Number of Employees</Label>
              <Input id="employees" type="number" value={formData.employees} onChange={(e) => setFormData({...formData, employees: e.target.value})} placeholder="e.g., 5" />
            </div>
          </div>
        );
      case 2:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <MapPin className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Location</h3>
                <p className="text-sm text-muted-foreground">Where is your business located?</p>
              </div>
            </div>
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="city">City</Label>
                <Input id="city" value={formData.city} onChange={(e) => setFormData({...formData, city: e.target.value})} placeholder="e.g., Phoenix" />
              </div>
              <div>
                <Label htmlFor="county">County</Label>
                <Input id="county" value={formData.county} onChange={(e) => setFormData({...formData, county: e.target.value})} placeholder="e.g., Maricopa" />
              </div>
            </div>
          </div>
        );
      case 3:
        return (
          <div className="space-y-6 animate-fade-in">
            <div className="flex items-center gap-3 mb-6">
              <Briefcase className="h-8 w-8 text-primary" />
              <div>
                <h3 className="text-lg font-semibold">Industry & Demographics</h3>
                <p className="text-sm text-muted-foreground">Help us personalize your experience</p>
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Users className="h-4 w-4" />
                Industries (select all that apply)
              </Label>
              <div className="flex flex-wrap gap-2">
                {INDUSTRIES.map(tag => (
                  <Badge key={tag} variant={formData.industryTags.includes(tag) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleTag(tag, "industryTags")}>{tag}</Badge>
                ))}
              </div>
            </div>
            <div>
              <Label className="flex items-center gap-2 mb-3">
                <Award className="h-4 w-4" />
                Business Demographics (optional)
              </Label>
              <div className="flex flex-wrap gap-2">
                {DEMOGRAPHICS.map(tag => (
                  <Badge key={tag} variant={formData.demographics.includes(tag) ? "default" : "outline"} className="cursor-pointer capitalize" onClick={() => toggleTag(tag, "demographics")}>{tag.replace(/_/g, "-")}</Badge>
                ))}
              </div>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--gradient-hero)" }}>
      <div className="w-full max-w-2xl animate-scale-in">
        <Card className="border-2">
          <CardHeader>
            <div className="flex items-center justify-between mb-2">
              <CardTitle className="text-2xl">Complete Your Profile</CardTitle>
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
                  <Button type="button" onClick={() => setStep(step + 1)} className="w-full" disabled={step === 1 && (!formData.businessName || !formData.businessType)}>
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
  );
}
