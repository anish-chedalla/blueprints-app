import { DashboardLayout } from "@/components/DashboardLayout";
import { ProgramCard } from "@/components/ProgramCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { savedRowToOpportunity } from "@/lib/opportunities";
import type { User } from "@supabase/supabase-js";
import { BellRing, Bookmark, CalendarClock, ExternalLink, Search, Trash2 } from "lucide-react";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { toast } from "sonner";

type SavedRow = Tables<"saved_opportunities">;
type ReminderRow = Tables<"opportunity_reminders">;
type SearchRow = Tables<"saved_searches">;
const PIPELINE = ["saved", "researching", "applying", "submitted", "awarded", "declined"];

export default function Saved() {
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [saved, setSaved] = useState<SavedRow[]>([]);
  const [reminders, setReminders] = useState<ReminderRow[]>([]);
  const [searches, setSearches] = useState<SearchRow[]>([]);
  const [loans, setLoans] = useState<Tables<"programs">[]>([]);
  const [loanFavoriteIds, setLoanFavoriteIds] = useState<Set<string>>(new Set());
  const [reminderDrafts, setReminderDrafts] = useState<Record<string, string>>({});
  const [emailReminderIds, setEmailReminderIds] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async (activeUser: User) => {
    setLoading(true);
    try {
      const [savedResult, reminderResult, searchResult, favoriteResult] = await Promise.all([
        supabase.from("saved_opportunities").select("*").eq("user_id", activeUser.id).order("updated_at", { ascending: false }),
        supabase.from("opportunity_reminders").select("*").eq("user_id", activeUser.id).is("dismissed_at", null).order("remind_at"),
        supabase.from("saved_searches").select("*").eq("user_id", activeUser.id).order("created_at", { ascending: false }),
        supabase.from("favorites").select("program_id").eq("user_id", activeUser.id),
      ]);
      if (savedResult.error) throw savedResult.error;
      if (reminderResult.error) throw reminderResult.error;
      if (searchResult.error) throw searchResult.error;
      setSaved(savedResult.data || []);
      setReminders(reminderResult.data || []);
      setSearches(searchResult.data || []);
      const ids = (favoriteResult.data || []).map((item) => item.program_id);
      setLoanFavoriteIds(new Set(ids));
      if (ids.length) {
        const { data } = await supabase.from("programs").select("*").in("id", ids).eq("type", "LOAN");
        setLoans(data || []);
      } else setLoans([]);
    } catch (error) {
      console.error(error);
      toast.error("Could not load your funding pipeline. Apply the latest database migration if this is a new deployment.");
    } finally { setLoading(false); }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUser(session.user);
      await loadData(session.user);
    };
    void initialize();
  }, [loadData, navigate]);

  const dueReminders = useMemo(() => reminders.filter((item) => new Date(item.remind_at).getTime() <= Date.now()), [reminders]);
  const remindersBySavedId = useMemo(() => new Map(reminders.map((item) => [item.saved_opportunity_id, item])), [reminders]);

  const updateStatus = async (id: string, pipelineStatus: string) => {
    const { error } = await supabase.from("saved_opportunities").update({ pipeline_status: pipelineStatus }).eq("id", id);
    if (error) toast.error("Could not update pipeline status");
    else setSaved((items) => items.map((item) => item.id === id ? { ...item, pipeline_status: pipelineStatus } : item));
  };
  const removeSaved = async (id: string) => {
    const { error } = await supabase.from("saved_opportunities").delete().eq("id", id);
    if (error) toast.error("Could not remove opportunity");
    else setSaved((items) => items.filter((item) => item.id !== id));
  };
  const createReminder = async (savedId: string) => {
    if (!user || !reminderDrafts[savedId]) return;
    const { error } = await supabase.from("opportunity_reminders").insert({
      user_id: user.id,
      saved_opportunity_id: savedId,
      remind_at: new Date(reminderDrafts[savedId]).toISOString(),
      delivery_channels: emailReminderIds.has(savedId) ? ["in_app", "email"] : ["in_app"],
    });
    if (error) toast.error("Could not set reminder");
    else { toast.success("Reminder scheduled"); setReminderDrafts((current) => ({ ...current, [savedId]: "" })); await loadData(user); }
  };
  const dismissReminder = async (id: string) => {
    const { error } = await supabase.from("opportunity_reminders").update({ dismissed_at: new Date().toISOString() }).eq("id", id);
    if (!error) setReminders((items) => items.filter((item) => item.id !== id));
  };
  const deleteSearch = async (id: string) => {
    const { error } = await supabase.from("saved_searches").delete().eq("id", id);
    if (!error) setSearches((items) => items.filter((item) => item.id !== id));
  };
  const toggleSearchEmail = async (search: SearchRow) => {
    const { error } = await supabase.from("saved_searches").update({ email_enabled: !search.email_enabled }).eq("id", search.id);
    if (error) toast.error("Could not change alert setting");
    else setSearches((items) => items.map((item) => item.id === search.id ? { ...item, email_enabled: !item.email_enabled } : item));
  };

  if (loading) return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading your funding pipeline…</div></DashboardLayout>;

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8">
        <header className="mb-8"><div className="flex items-center gap-3"><Bookmark className="h-8 w-8 text-primary" /><h1 className="text-4xl font-bold">Funding pipeline</h1></div><p className="mt-2 text-lg text-muted-foreground">Track live federal and reviewed funder opportunities from discovery through decision.</p></header>
        {dueReminders.length > 0 && <Alert className="mb-6 border-amber-300 bg-amber-50"><BellRing className="h-4 w-4" /><AlertTitle>{dueReminders.length} reminder{dueReminders.length === 1 ? " is" : "s are"} due</AlertTitle><AlertDescription>Open the Alerts tab to review or dismiss them.</AlertDescription></Alert>}
        <Tabs defaultValue="pipeline" className="space-y-6">
          <TabsList><TabsTrigger value="pipeline">Pipeline ({saved.length})</TabsTrigger><TabsTrigger value="alerts">Alerts ({searches.length + reminders.length})</TabsTrigger><TabsTrigger value="loans">Saved loans ({loans.length})</TabsTrigger></TabsList>
          <TabsContent value="pipeline">
            {saved.length === 0 ? <EmptyState /> : <div className="grid gap-5 lg:grid-cols-2">{saved.map((row) => {
              const opportunity = savedRowToOpportunity(row);
              const reminder = remindersBySavedId.get(row.id);
              const detailUrl = opportunity.source === "grants.gov" ? `/federal-grant/${opportunity.externalId}` : `/program/${opportunity.programId}`;
              return <Card key={row.id}><CardHeader><div className="flex items-start justify-between gap-3"><div><div className="mb-2 flex gap-2"><Badge>{opportunity.sourceName}</Badge>{reminder && <Badge variant="outline"><CalendarClock className="mr-1 h-3 w-3" />Reminder set</Badge>}</div><CardTitle>{row.title}</CardTitle><p className="mt-1 text-sm text-muted-foreground">{row.sponsor}</p></div><Button size="icon" variant="ghost" onClick={() => removeSaved(row.id)} aria-label="Remove"><Trash2 className="h-4 w-4" /></Button></div></CardHeader><CardContent className="space-y-4">
                <div className="flex flex-wrap items-center gap-3"><Select value={row.pipeline_status} onValueChange={(value) => updateStatus(row.id, value)}><SelectTrigger className="w-44"><SelectValue /></SelectTrigger><SelectContent>{PIPELINE.map((status) => <SelectItem key={status} value={status}><span className="capitalize">{status}</span></SelectItem>)}</SelectContent></Select>{row.deadline && <span className="text-sm text-muted-foreground">Deadline {new Date(`${row.deadline}T12:00:00`).toLocaleDateString()}</span>}</div>
                <div className="space-y-2"><div className="flex flex-col gap-2 sm:flex-row"><Input type="datetime-local" value={reminderDrafts[row.id] || ""} onChange={(event) => setReminderDrafts((current) => ({ ...current, [row.id]: event.target.value }))} min={new Date().toISOString().slice(0, 16)} /><Button variant="outline" disabled={!reminderDrafts[row.id]} onClick={() => createReminder(row.id)}><BellRing className="mr-2 h-4 w-4" />Remind me</Button></div><label className="flex items-center gap-2 text-xs text-muted-foreground"><Checkbox checked={emailReminderIds.has(row.id)} onCheckedChange={(checked) => setEmailReminderIds((current) => { const next = new Set(current); if (checked === true) next.add(row.id); else next.delete(row.id); return next; })} />Also email this reminder (requires configured email delivery)</label></div>
                <div className="flex gap-2"><Button asChild variant="outline"><Link to={detailUrl}>Review details</Link></Button><Button asChild><a href={row.official_url} target="_blank" rel="noreferrer">Official source <ExternalLink className="ml-2 h-4 w-4" /></a></Button></div>
              </CardContent></Card>;
            })}</div>}
          </TabsContent>
          <TabsContent value="alerts" className="space-y-6">
            <section><h2 className="mb-3 text-xl font-semibold">Opportunity reminders</h2>{reminders.length === 0 ? <p className="text-muted-foreground">No reminders scheduled.</p> : <div className="space-y-3">{reminders.map((reminder) => { const item = saved.find((row) => row.id === reminder.saved_opportunity_id); const due = new Date(reminder.remind_at).getTime() <= Date.now(); return <Card key={reminder.id} className={due ? "border-amber-300 bg-amber-50" : ""}><CardContent className="flex flex-wrap items-center justify-between gap-3 pt-6"><div><p className="font-medium">{item?.title || "Saved opportunity"}</p><p className="text-sm text-muted-foreground">{due ? "Due" : "Scheduled"} {new Date(reminder.remind_at).toLocaleString()}</p></div><Button size="sm" variant="outline" onClick={() => dismissReminder(reminder.id)}>Dismiss</Button></CardContent></Card>; })}</div>}</section>
            <section><h2 className="mb-3 text-xl font-semibold">Saved searches</h2>{searches.length === 0 ? <p className="text-muted-foreground">Save a search from Grant Finder to monitor it.</p> : <div className="space-y-3">{searches.map((search) => <Card key={search.id}><CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6"><div><p className="font-medium">{search.name}</p><p className="text-sm text-muted-foreground">{search.email_enabled ? "Email alerts enabled" : "Saved without email"}{search.last_checked_at ? ` · last checked ${new Date(search.last_checked_at).toLocaleString()}` : ""}</p></div><div className="flex gap-2"><Button size="sm" variant="outline" onClick={() => toggleSearchEmail(search)}>{search.email_enabled ? "Mute email" : "Enable email"}</Button><Button size="icon" variant="ghost" onClick={() => deleteSearch(search.id)}><Trash2 className="h-4 w-4" /></Button></div></CardContent></Card>)}</div>}</section>
          </TabsContent>
          <TabsContent value="loans">{loans.length === 0 ? <p className="py-10 text-center text-muted-foreground">No saved loans.</p> : <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">{loans.map((loan) => <ProgramCard key={loan.id} program={{ ...loan, status: loan.status || "OPEN", rolling: Boolean(loan.rolling), min_amount: loan.min_amount ?? undefined, max_amount: loan.max_amount ?? undefined, deadline: loan.deadline ?? undefined, city: loan.city ?? undefined, county: loan.county ?? undefined }} isFavorite={loanFavoriteIds.has(loan.id)} onFavoriteToggle={() => user && loadData(user)} />)}</div>}</TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}

function EmptyState() {
  return <div className="rounded-xl border border-dashed py-16 text-center"><Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h2 className="text-xl font-semibold">Your pipeline is empty</h2><p className="mt-2 text-muted-foreground">Search official sources and save the opportunities worth pursuing.</p><Button asChild className="mt-5"><Link to="/grants">Find grants</Link></Button></div>;
}
