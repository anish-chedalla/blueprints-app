import { useState, useEffect } from "react";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { supabase } from "@/integrations/supabase/client";
import { FileText, ExternalLink, RotateCcw, CheckCircle2 } from "lucide-react";

const BUSINESS_TYPES = ["LLC", "Sole Proprietor", "Corporation", "Partnership", "Nonprofit"];
const INDUSTRIES = ["technology", "retail", "services", "food service", "sustainability", "biotech", "manufacturing", "healthcare"];

interface LicensingStep {
  id: string;
  title: string;
  description: string;
  url: string;
  completed: boolean;
}

export default function Licensing() {
  const [city, setCity] = useState("");
  const [county, setCounty] = useState("");
  const [industry, setIndustry] = useState("");
  const [businessType, setBusinessType] = useState("");
  const [steps, setSteps] = useState<LicensingStep[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProfileData();
  }, []);

  const loadProfileData = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data: profile } = await supabase
      .from("profiles")
      .select("city, county, industry_tags")
      .eq("user_id", session.user.id)
      .single();

    if (profile) {
      setCity(profile.city || "");
      setCounty(profile.county || "");
      if (profile.industry_tags && profile.industry_tags.length > 0) {
        setIndustry(profile.industry_tags[0]);
      }
    }
  };

  const generateSteps = () => {
    setLoading(true);
    
    const generatedSteps: LicensingStep[] = [];

    // State-level requirements
    generatedSteps.push({
      id: "state-tpt",
      title: "Register for Arizona Transaction Privilege Tax License",
      description: "Required for all businesses making retail sales in Arizona.",
      url: "https://azdor.gov/transaction-privilege-tax",
      completed: false,
    });

    // City-specific requirements
    if (city.toLowerCase() === "phoenix") {
      generatedSteps.push({
        id: "city-license",
        title: "Apply for Phoenix Business License",
        description: "All businesses operating within Phoenix city limits must obtain a city business license.",
        url: "https://www.phoenix.gov/pdd/business-license",
        completed: false,
      });
    } else if (city) {
      generatedSteps.push({
        id: "city-license",
        title: `Apply for ${city} Business License`,
        description: `Contact ${city} city hall for specific business license requirements.`,
        url: "https://az.gov/licensing",
        completed: false,
      });
    }

    // County-specific requirements
    if (county.toLowerCase() === "maricopa" && industry === "food service") {
      generatedSteps.push({
        id: "health-permit",
        title: "Get Maricopa County Health Permit",
        description: "Required for all food service establishments in Maricopa County.",
        url: "https://www.maricopa.gov/1858/Food-Establishment-Licensing",
        completed: false,
      });
    }

    // Industry-specific requirements
    if (industry === "food service") {
      generatedSteps.push({
        id: "food-handler",
        title: "Food Handler Certification",
        description: "All food service employees must obtain Arizona Food Handler certification.",
        url: "https://www.azdhs.gov/preparedness/epidemiology-disease-control/food-safety-environmental-services/index.php#food-safety-home",
        completed: false,
      });
    }

    if (industry === "healthcare") {
      generatedSteps.push({
        id: "healthcare-license",
        title: "Professional Healthcare License",
        description: "Healthcare professionals must be licensed through the Arizona Department of Health Services.",
        url: "https://www.azdhs.gov/licensing/index.php",
        completed: false,
      });
    }

    if (industry === "retail" || industry === "food service") {
      generatedSteps.push({
        id: "sales-tax",
        title: "Sales Tax Permit",
        description: "Register to collect and remit sales tax on taxable goods and services.",
        url: "https://azdor.gov/licensing",
        completed: false,
      });
    }

    // Business structure requirements
    if (businessType === "LLC" || businessType === "Corporation") {
      generatedSteps.push({
        id: "acc-registration",
        title: "Register with Arizona Corporation Commission",
        description: "All LLCs and corporations must be registered with the ACC.",
        url: "https://azcc.gov/corporations",
        completed: false,
      });
    }

    // General requirements
    generatedSteps.push({
      id: "ein",
      title: "Obtain Federal Employer Identification Number (EIN)",
      description: "Required for most businesses, especially those with employees.",
      url: "https://www.irs.gov/businesses/small-businesses-self-employed/apply-for-an-employer-identification-number-ein-online",
      completed: false,
    });

    setSteps(generatedSteps);
    setLoading(false);
  };

  const toggleStep = (id: string) => {
    setSteps(steps.map(step => 
      step.id === id ? { ...step, completed: !step.completed } : step
    ));
  };

  const handleReset = () => {
    setSteps([]);
    loadProfileData();
  };

  const completedCount = steps.filter(s => s.completed).length;

  return (
    <DashboardLayout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-4 py-12">
          <div className="max-w-4xl mx-auto animate-fade-in">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-bold mb-3">Arizona Business Licensing</h1>
              <p className="text-muted-foreground text-lg">Find the licenses and permits you need to operate legally</p>
            </div>

            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Your Business Information
                </CardTitle>
                <CardDescription>Tell us about your business to get personalized requirements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid md:grid-cols-2 gap-4 mb-4">
                  <div>
                    <Label htmlFor="city">City</Label>
                    <Input id="city" value={city} onChange={(e) => setCity(e.target.value)} placeholder="e.g., Phoenix" />
                  </div>
                  <div>
                    <Label htmlFor="county">County</Label>
                    <Input id="county" value={county} onChange={(e) => setCounty(e.target.value)} placeholder="e.g., Maricopa" />
                  </div>
                </div>
                <div className="grid md:grid-cols-2 gap-4 mb-6">
                  <div>
                    <Label htmlFor="industry">Industry</Label>
                    <Select value={industry} onValueChange={setIndustry}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        {INDUSTRIES.map((ind) => (
                          <SelectItem key={ind} value={ind} className="capitalize">{ind}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="businessType">Business Type</Label>
                    <Select value={businessType} onValueChange={setBusinessType}>
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
                </div>
                <div className="flex gap-3">
                  <Button onClick={generateSteps} disabled={loading || !city || !industry} className="flex-1">
                    {loading ? "Generating..." : "Generate Checklist"}
                  </Button>
                  {steps.length > 0 && (
                    <Button variant="outline" onClick={handleReset}>
                      <RotateCcw className="h-4 w-4 mr-2" />
                      Start Over
                    </Button>
                  )}
                </div>
              </CardContent>
            </Card>

            {steps.length > 0 ? (
              <div className="animate-fade-in">
                <Card>
                    <CardHeader>
                      <div className="flex items-center justify-between">
                        <CardTitle className="flex items-center gap-2">
                          <CheckCircle2 className="h-5 w-5 text-primary" />
                          Your Licensing Checklist
                        </CardTitle>
                        <span className="text-sm text-muted-foreground">
                          {completedCount} of {steps.length} completed
                        </span>
                      </div>
                      <div className="w-full bg-secondary h-2 rounded-full overflow-hidden mt-3">
                        <div 
                          className="h-full bg-primary transition-all duration-300" 
                          style={{ width: `${(completedCount / steps.length) * 100}%` }}
                        />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        {steps.map((step, index) => (
                          <div
                            key={step.id}
                            className="animate-fade-in"
                            style={{ animationDelay: `${index * 50}ms` }}
                          >
                            <Card className={step.completed ? "bg-muted/50" : ""}>
                              <CardContent className="p-4">
                                <div className="flex items-start gap-4">
                                  <Checkbox
                                    checked={step.completed}
                                    onCheckedChange={() => toggleStep(step.id)}
                                    className="mt-1"
                                  />
                                  <div className="flex-1">
                                    <h3 className={`font-semibold mb-1 ${step.completed ? "line-through text-muted-foreground" : ""}`}>
                                      {step.title}
                                    </h3>
                                    <p className="text-sm text-muted-foreground mb-2">{step.description}</p>
                                    <a 
                                      href={step.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer" 
                                      className="text-sm text-primary hover:underline inline-flex items-center gap-1"
                                    >
                                      Learn more <ExternalLink className="h-3 w-3" />
                                    </a>
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                !loading && (
                  <div className="text-center py-12 animate-fade-in">
                    <FileText className="h-16 w-16 text-muted-foreground mx-auto mb-4 opacity-50" />
                    <h3 className="text-xl font-semibold mb-2">No checklist generated yet</h3>
                    <p className="text-muted-foreground">Fill out the form above and click "Generate Checklist" to get started</p>
                  </div>
                )
              )}
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
