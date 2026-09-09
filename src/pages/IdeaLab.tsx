import { DashboardLayout } from "@/components/DashboardLayout";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { Building2, CheckCircle2, MapPin, Search, ShieldCheck, Users } from "lucide-react";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

export default function IdeaLab() {
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      setProfile(data || null);
    };
    void load();
  }, []);

  const factors = [
    { icon: Building2, label: "Organization type", value: profile?.business_type || "Missing" },
    { icon: MapPin, label: "Location", value: [profile?.city, profile?.county && `${profile.county} County`, "Arizona"].filter(Boolean).join(", ") },
    { icon: Users, label: "Business size", value: profile?.employees === null || profile?.employees === undefined ? "Employee count missing" : `${profile.employees} employees` },
  ];

  return <DashboardLayout><main className="container mx-auto max-w-4xl px-4 py-10">
    <div className="mb-8 text-center"><ShieldCheck className="mx-auto mb-4 h-14 w-14 text-primary" /><Badge className="mb-3">Explainable matching</Badge><h1 className="text-4xl font-bold">Your grant match profile</h1><p className="mx-auto mt-3 max-w-2xl text-lg text-muted-foreground">Blueprints checks explicit eligibility evidence before ranking opportunities. It does not use a generic market-analysis chatbot to invent recommendations.</p></div>
    <div className="grid gap-5 md:grid-cols-3">{factors.map((factor) => <Card key={factor.label}><CardHeader><factor.icon className="h-6 w-6 text-primary" /><CardTitle className="text-base">{factor.label}</CardTitle></CardHeader><CardContent><p className="font-medium">{factor.value}</p></CardContent></Card>)}</div>
    <Card className="mt-6"><CardHeader><CardTitle>What the score checks</CardTitle></CardHeader><CardContent className="space-y-3">{["Applicant type conflicts", "Arizona, county, and city restrictions", "Employee and revenue limits", "Ownership demographics and industry overlap"].map((item) => <div key={item} className="flex items-center gap-2"><CheckCircle2 className="h-4 w-4 text-emerald-600" />{item}</div>)}<p className="pt-2 text-sm text-muted-foreground">A high score is a research aid, not a guarantee. Blueprints always links the official eligibility language for final confirmation.</p><div className="flex flex-wrap gap-3 pt-3"><Button asChild><Link to="/grants"><Search className="mr-2 h-4 w-4" />See ranked matches</Link></Button><Button asChild variant="outline"><Link to="/onboarding?edit=1">Update match profile</Link></Button></div></CardContent></Card>
  </main></DashboardLayout>;
}
