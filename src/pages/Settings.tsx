import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { appUrl } from "@/lib/github-pages";
import { PROFILE_BUSINESS_TYPES, PROFILE_DEMOGRAPHICS, PROFILE_INDUSTRIES } from "@/lib/profile-options";
import { clearViewHistory, isViewHistoryEnabled, setViewHistoryEnabled } from "@/lib/view-history";
import type { User } from "@supabase/supabase-js";
import { Bell, Building2, KeyRound, Loader2, Lock, Settings as SettingsIcon, UserRound } from "lucide-react";
import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

const optionalNumber = (value: string) => value.trim() === "" ? null : Number(value);

type BusinessForm = {
  businessName: string; businessType: string; city: string; county: string;
  employees: string; revenue: string; yearsInBusiness: string;
  industryTags: string[]; demographics: string[];
};

const emptyBusiness: BusinessForm = { businessName: "", businessType: "", city: "", county: "", employees: "", revenue: "", yearsInBusiness: "", industryTags: [], demographics: [] };

export default function Settings() {
  const navigate = useNavigate();
  const [params, setParams] = useSearchParams();
  const tab = ["account", "business", "alerts", "privacy"].includes(params.get("tab") || "") ? params.get("tab")! : "account";
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [displayName, setDisplayName] = useState("");
  const [business, setBusiness] = useState<BusinessForm>(emptyBusiness);
  const [historyEnabled, setHistoryEnabled] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle();
      setUser(session.user);
      setProfile(data || null);
      setDisplayName(session.user.user_metadata?.full_name || session.user.user_metadata?.name || "");
      setHistoryEnabled(isViewHistoryEnabled(session.user.id, session.user.user_metadata?.view_history_enabled));
      if (data) setBusiness({
        businessName: data.business_name || "", businessType: data.business_type || "", city: data.city || "", county: data.county || "",
        employees: data.employees?.toString() || "", revenue: data.revenue_usd?.toString() || "", yearsInBusiness: data.years_in_business?.toString() || "",
        industryTags: data.industry_tags || [], demographics: data.demographics || [],
      });
      setLoading(false);
    };
    void initialize();
  }, [navigate]);

  const saveAccount = async () => {
    setSaving(true);
    const { error } = await supabase.auth.updateUser({ data: { full_name: displayName.trim() } });
    setSaving(false);
    if (error) toast.error("Could not update account settings"); else toast.success("Account settings updated");
  };
  const sendPasswordReset = async () => {
    if (!user?.email) return;
    const { error } = await supabase.auth.resetPasswordForEmail(user.email, { redirectTo: appUrl("reset-password") });
    if (error) toast.error("Could not send the reset link"); else toast.success("Password reset link sent");
  };
  const saveBusiness = async () => {
    if (!user) return;
    setSaving(true);
    const { data, error } = await supabase.from("profiles").upsert({
      user_id: user.id, business_name: business.businessName, business_type: business.businessType || null,
      city: business.city || null, county: business.county || null, employees: optionalNumber(business.employees),
      revenue_usd: optionalNumber(business.revenue), years_in_business: optionalNumber(business.yearsInBusiness),
      industry_tags: business.industryTags, demographics: business.demographics,
    }, { onConflict: "user_id" }).select("*").single();
    setSaving(false);
    if (error) toast.error("Could not update your business profile"); else { setProfile(data); toast.success("Business profile updated"); }
  };
  const toggleTag = (tag: string, field: "industryTags" | "demographics") => setBusiness((current) => ({ ...current, [field]: current[field].includes(tag) ? current[field].filter((item) => item !== tag) : [...current[field], tag] }));
  const updateEmailAlerts = async (enabled: boolean) => {
    if (!user) return;
    setProfile((current) => current ? { ...current, email_alerts_enabled: enabled } : current);
    const { error } = await supabase.from("profiles").upsert({ user_id: user.id, email_alerts_enabled: enabled }, { onConflict: "user_id" });
    if (error) toast.error("Could not update alert preferences"); else toast.success("Alert preference updated");
  };
  const updateHistory = async (enabled: boolean) => {
    if (!user) return;
    setViewHistoryEnabled(user.id, enabled); setHistoryEnabled(enabled);
    const { error } = await supabase.auth.updateUser({ data: { view_history_enabled: enabled } });
    if (error) toast.error("Could not sync the history preference"); else toast.success(enabled ? "Viewing history enabled" : "Viewing history paused");
  };
  const clearHistory = async () => {
    if (!user) return;
    await clearViewHistory(user.id); toast.success("Viewing history cleared");
  };

  if (loading) return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading settings…</div></DashboardLayout>;

  return <DashboardLayout><main className="container mx-auto max-w-5xl px-4 py-8">
    <header className="mb-8"><div className="flex items-center gap-3"><SettingsIcon className="h-8 w-8 text-primary" /><h1 className="text-4xl font-bold">Settings</h1></div><p className="mt-2 text-lg text-muted-foreground">Manage your account, match profile, alerts, and privacy.</p></header>
    <Tabs value={tab} onValueChange={(value) => setParams({ tab: value })} className="space-y-6"><TabsList className="h-auto flex-wrap"><TabsTrigger value="account">Account</TabsTrigger><TabsTrigger value="business">Business profile</TabsTrigger><TabsTrigger value="alerts">Alerts</TabsTrigger><TabsTrigger value="privacy">Privacy & history</TabsTrigger></TabsList>
      <TabsContent value="account"><Card><CardHeader><CardTitle className="flex items-center gap-2"><UserRound className="h-5 w-5" />Account</CardTitle><CardDescription>Your personal sign-in and display information.</CardDescription></CardHeader><CardContent className="max-w-xl space-y-5"><div className="space-y-2"><Label htmlFor="display-name">Display name</Label><Input id="display-name" value={displayName} onChange={(event) => setDisplayName(event.target.value)} placeholder="How Blueprints should address you" /></div><div className="space-y-2"><Label htmlFor="account-email">Email address</Label><Input id="account-email" value={user?.email || ""} disabled /><p className="text-xs text-muted-foreground">Your email is managed by your sign-in provider.</p></div><div className="flex flex-wrap gap-3"><Button onClick={() => void saveAccount()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save account</Button><Button variant="outline" onClick={() => void sendPasswordReset()}><KeyRound className="mr-2 h-4 w-4" />Send password reset</Button></div></CardContent></Card></TabsContent>

      <TabsContent value="business"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" />Business match profile</CardTitle><CardDescription>These facts power explainable eligibility and fit scoring. They are never sent to grant providers.</CardDescription></CardHeader><CardContent className="space-y-6"><div className="grid gap-4 md:grid-cols-2"><Field label="Business name"><Input value={business.businessName} onChange={(event) => setBusiness({ ...business, businessName: event.target.value })} /></Field><Field label="Business type"><Select value={business.businessType} onValueChange={(value) => setBusiness({ ...business, businessType: value })}><SelectTrigger><SelectValue placeholder="Select business type" /></SelectTrigger><SelectContent>{PROFILE_BUSINESS_TYPES.map((type) => <SelectItem key={type} value={type}>{type}</SelectItem>)}</SelectContent></Select></Field><Field label="City"><Input value={business.city} onChange={(event) => setBusiness({ ...business, city: event.target.value })} /></Field><Field label="County"><Input value={business.county} onChange={(event) => setBusiness({ ...business, county: event.target.value })} /></Field><Field label="Employees"><Input type="number" min="0" value={business.employees} onChange={(event) => setBusiness({ ...business, employees: event.target.value })} /></Field><Field label="Annual revenue"><Input type="number" min="0" value={business.revenue} onChange={(event) => setBusiness({ ...business, revenue: event.target.value })} /></Field><Field label="Years in business"><Input type="number" min="0" value={business.yearsInBusiness} onChange={(event) => setBusiness({ ...business, yearsInBusiness: event.target.value })} /></Field></div><div><Label className="mb-3 block">Industries</Label><div className="flex flex-wrap gap-2">{PROFILE_INDUSTRIES.map(({ value, label }) => <Badge key={value} variant={business.industryTags.includes(value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(value, "industryTags")}>{label}</Badge>)}</div></div><div><Label className="mb-3 block">Business demographics</Label><div className="flex flex-wrap gap-2">{PROFILE_DEMOGRAPHICS.map(({ value, label }) => <Badge key={value} variant={business.demographics.includes(value) ? "default" : "outline"} className="cursor-pointer" onClick={() => toggleTag(value, "demographics")}>{label}</Badge>)}</div></div><Button onClick={() => void saveBusiness()} disabled={saving}>{saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}Save business profile</Button></CardContent></Card></TabsContent>

      <TabsContent value="alerts"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Bell className="h-5 w-5" />Alert preferences</CardTitle><CardDescription>Control account-level notification preferences. Individual saved-search alerts remain configurable under Saved Funding.</CardDescription></CardHeader><CardContent><div className="flex max-w-2xl items-center justify-between gap-6 rounded-xl border p-4"><div><Label htmlFor="email-alerts">Allow email funding alerts</Label><p className="mt-1 text-sm text-muted-foreground">Email is sent only for searches or reminders you explicitly enable. Delivery also requires the deployment's mail service to be configured.</p></div><Switch id="email-alerts" checked={profile?.email_alerts_enabled || false} onCheckedChange={(checked) => void updateEmailAlerts(checked)} /></div></CardContent></Card></TabsContent>

      <TabsContent value="privacy"><Card><CardHeader><CardTitle className="flex items-center gap-2"><Lock className="h-5 w-5" />Privacy & history</CardTitle><CardDescription>Viewing history is private to your account and powers dashboard recents.</CardDescription></CardHeader><CardContent className="space-y-5"><div className="flex max-w-2xl items-center justify-between gap-6 rounded-xl border p-4"><div><Label htmlFor="history-enabled">Save viewing history</Label><p className="mt-1 text-sm text-muted-foreground">Pause this to stop recording grants and loans you open. Saved items are separate.</p></div><Switch id="history-enabled" checked={historyEnabled} onCheckedChange={updateHistory} /></div><AlertDialog><AlertDialogTrigger asChild><Button variant="destructive">Clear viewing history</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear all viewing history?</AlertDialogTitle><AlertDialogDescription>This removes synced and local viewing history. Your saved grants, loans, searches, and reminders stay intact.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void clearHistory()}>Clear history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog></CardContent></Card></TabsContent>
    </Tabs>
  </main></DashboardLayout>;
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div className="space-y-2"><Label>{label}</Label>{children}</div>;
}
