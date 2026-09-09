import { DashboardLayout } from "@/components/DashboardLayout";
import { OpportunityCard } from "@/components/OpportunityCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { evaluateEligibility } from "@/lib/eligibility";
import { FEDERAL_GRANT_AGENCIES, FEDERAL_GRANT_CATEGORIES, FEDERAL_GRANT_PAGE_SIZE, searchFederalGrants, type FederalGrantSearchParams } from "@/lib/grants-gov";
import { isProgramAvailable } from "@/lib/program-availability";
import { curatedProgramToOpportunity, federalHitToOpportunity, opportunityKey, serializeOpportunity, type Opportunity } from "@/lib/opportunities";
import { useQuery } from "@tanstack/react-query";
import type { User } from "@supabase/supabase-js";
import { AlertCircle, BellRing, Database, ExternalLink, RotateCcw, Search, ShieldCheck } from "lucide-react";
import { FormEvent, useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { toast } from "sonner";

type SourceFilter = "all" | "federal" | "reviewed";
type SortMode = "match" | "deadline" | "newest";
const QUICK_SEARCHES = ["technology", "rural business", "export", "women-owned"];

export default function Grants() {
  const navigate = useNavigate();
  const location = useLocation();
  const [urlParams, setUrlParams] = useSearchParams();
  const initialSearch = urlParams.get("search") || "";
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<Tables<"profiles"> | null>(null);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [savingKey, setSavingKey] = useState<string | null>(null);
  const [searchDraft, setSearchDraft] = useState(initialSearch);
  const [submittedSearch, setSubmittedSearch] = useState(initialSearch);
  const [sourceFilter, setSourceFilter] = useState<SourceFilter>("all");
  const [sortMode, setSortMode] = useState<SortMode>("match");
  const [page, setPage] = useState(0);
  const [emailAlert, setEmailAlert] = useState(false);
  const [federalFilters, setFederalFilters] = useState({
    status: "posted" as FederalGrantSearchParams["status"],
    eligibility: "23|99" as NonNullable<FederalGrantSearchParams["eligibility"]> | "all",
    category: "",
    agency: "",
  });

  useEffect(() => {
    let active = true;
    const loadAccount = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!active) return;
      setUser(session?.user || null);
      if (!session) { setProfile(null); setSavedKeys(new Set()); return; }
      const [profileResult, savedResult] = await Promise.all([
        supabase.from("profiles").select("*").eq("user_id", session.user.id).maybeSingle(),
        supabase.from("saved_opportunities").select("source, external_id").eq("user_id", session.user.id),
      ]);
      if (!active) return;
      setProfile(profileResult.data || null);
      setSavedKeys(new Set((savedResult.data || []).map((row) => opportunityKey(row.source, row.external_id))));
    };
    void loadAccount();
    const { data: { subscription } } = supabase.auth.onAuthStateChange(() => void loadAccount());
    return () => { active = false; subscription.unsubscribe(); };
  }, []);

  const federalParams = useMemo<FederalGrantSearchParams>(() => ({
    keyword: submittedSearch,
    status: federalFilters.status,
    eligibility: federalFilters.eligibility === "all" ? undefined : federalFilters.eligibility,
    category: federalFilters.category || undefined,
    agency: federalFilters.agency || undefined,
    instrument: "G",
    page,
    rows: FEDERAL_GRANT_PAGE_SIZE,
  }), [federalFilters, page, submittedSearch]);

  const federalQuery = useQuery({
    queryKey: ["unified-grants-gov", federalParams],
    queryFn: ({ signal }) => searchFederalGrants(federalParams, signal),
    enabled: sourceFilter !== "reviewed",
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });
  const curatedQuery = useQuery({
    queryKey: ["unified-curated-grants"],
    queryFn: async () => {
      const { data, error } = await supabase.from("programs").select("*").eq("type", "GRANT").not("source_id", "is", null);
      if (error) throw error;
      return data;
    },
    enabled: sourceFilter !== "federal",
    staleTime: 5 * 60 * 1000,
  });
  const sourcesQuery = useQuery({
    queryKey: ["grant-source-registry"],
    queryFn: async () => {
      const { data, error } = await supabase.from("grant_sources").select("*").order("automated", { ascending: false }).order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });

  const opportunities = useMemo(() => {
    const query = submittedSearch.trim().toLowerCase();
    const curated = sourceFilter === "federal" || page > 0 ? [] : (curatedQuery.data || [])
      .filter((program) => isProgramAvailable(program))
      .map(curatedProgramToOpportunity)
      .filter((item) => !query || [item.title, item.sponsor, item.description, ...item.industryTags].join(" ").toLowerCase().includes(query));
    const federal = sourceFilter === "reviewed" ? [] : (federalQuery.data?.opportunities || []).map(federalHitToOpportunity);
    return [...curated, ...federal].sort((left, right) => {
      if (sortMode === "match") return evaluateEligibility(profile, right).score - evaluateEligibility(profile, left).score;
      const leftDate = left.deadline ? new Date(left.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      const rightDate = right.deadline ? new Date(right.deadline).getTime() : Number.MAX_SAFE_INTEGER;
      return sortMode === "deadline" ? leftDate - rightDate : rightDate - leftDate;
    });
  }, [curatedQuery.data, federalQuery.data, page, profile, sortMode, sourceFilter, submittedSearch]);

  const loading = (sourceFilter !== "reviewed" && federalQuery.isLoading) || (sourceFilter !== "federal" && curatedQuery.isLoading);
  const federalTotalPages = Math.max(1, Math.ceil((federalQuery.data?.hitCount || 0) / FEDERAL_GRANT_PAGE_SIZE));

  const submitSearch = (event: FormEvent) => {
    event.preventDefault();
    const next = searchDraft.trim();
    setSubmittedSearch(next); setPage(0); setUrlParams(next ? { search: next } : {});
  };
  const resetSearch = () => {
    setSearchDraft(""); setSubmittedSearch(""); setSourceFilter("all"); setPage(0);
    setFederalFilters({ status: "posted", eligibility: "23|99", category: "", agency: "" });
    setUrlParams({});
  };

  const toggleSaved = async (opportunity: Opportunity) => {
    if (!user) {
      navigate("/auth", { state: { from: `${location.pathname}${location.search}` } });
      toast.error("Sign in to save and track opportunities"); return;
    }
    setSavingKey(opportunity.key);
    try {
      if (savedKeys.has(opportunity.key)) {
        const { error } = await supabase.from("saved_opportunities").delete().eq("user_id", user.id).eq("source", opportunity.source).eq("external_id", opportunity.externalId);
        if (error) throw error;
        setSavedKeys((current) => { const next = new Set(current); next.delete(opportunity.key); return next; });
        toast.success("Removed from your funding pipeline");
      } else {
        const { error } = await supabase.from("saved_opportunities").upsert({ ...serializeOpportunity(opportunity), user_id: user.id }, { onConflict: "user_id,source,external_id" });
        if (error) throw error;
        setSavedKeys((current) => new Set(current).add(opportunity.key));
        toast.success("Saved to your funding pipeline");
      }
    } catch (error) { console.error(error); toast.error("Could not update this opportunity"); }
    finally { setSavingKey(null); }
  };

  const saveCurrentSearch = async () => {
    if (!user) { navigate("/auth", { state: { from: `${location.pathname}${location.search}` } }); toast.error("Sign in to save this search"); return; }
    const { error } = await supabase.from("saved_searches").insert({
      user_id: user.id,
      name: submittedSearch || `${sourceFilter === "all" ? "All" : sourceFilter} grant search`,
      email_enabled: emailAlert,
      criteria: { keyword: submittedSearch, source: sourceFilter, ...federalFilters },
      last_result_ids: opportunities.map((item) => item.key).slice(0, 100),
      last_checked_at: new Date().toISOString(),
    });
    if (error) toast.error("Could not save this search");
    else toast.success(emailAlert ? "Search saved with email alerts" : "Search saved");
  };

  return (
    <DashboardLayout>
      <main className="container mx-auto px-4 py-8">
        <header className="mb-7 max-w-4xl"><Badge className="mb-3">Arizona-first · official-source search</Badge><h1 className="text-4xl font-bold">Find grants your business can actually pursue</h1><p className="mt-3 text-lg text-muted-foreground">One search combines live federal opportunities with reviewed funder records, including Arizona programs, then explains the evidence behind each match.</p></header>
        <Tabs defaultValue="search" className="space-y-6">
          <TabsList><TabsTrigger value="search">Unified search</TabsTrigger><TabsTrigger value="sources">Coverage & sources</TabsTrigger></TabsList>
          <TabsContent value="search" className="space-y-6">
            <Card><CardContent className="pt-6"><form onSubmit={submitSearch} className="space-y-5">
              <div className="flex flex-col gap-2 sm:flex-row"><div className="relative flex-1"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" /><Input value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="pl-10" placeholder="Describe your business, project, or funding need" /></div><Button type="submit" className="sm:w-28">Search</Button><Button type="button" variant="outline" onClick={saveCurrentSearch}><BellRing className="mr-2 h-4 w-4" />Save search</Button></div>
              <div className="flex flex-wrap gap-2">{QUICK_SEARCHES.map((query) => <Button key={query} type="button" size="sm" variant="secondary" onClick={() => { setSearchDraft(query); setSubmittedSearch(query); setPage(0); setUrlParams({ search: query }); }}>{query}</Button>)}</div>
              <div className="grid gap-4 border-t pt-5 md:grid-cols-2 lg:grid-cols-5">
                <div className="space-y-2"><Label>Sources</Label><Select value={sourceFilter} onValueChange={(value) => { setSourceFilter(value as SourceFilter); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">Federal + reviewed</SelectItem><SelectItem value="federal">Live federal only</SelectItem><SelectItem value="reviewed">Reviewed sources only</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Applicant</Label><Select value={federalFilters.eligibility} onValueChange={(value) => { setFederalFilters((current) => ({ ...current, eligibility: value as typeof federalFilters.eligibility })); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="23|99">Small business + unrestricted</SelectItem><SelectItem value="23">Small businesses</SelectItem><SelectItem value="22">Other for-profit</SelectItem><SelectItem value="99">Unrestricted</SelectItem><SelectItem value="all">All applicants</SelectItem></SelectContent></Select></div>
                <div className="space-y-2"><Label>Category</Label><Select value={federalFilters.category || "all"} onValueChange={(value) => { setFederalFilters((current) => ({ ...current, category: value === "all" ? "" : value })); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All categories</SelectItem>{FEDERAL_GRANT_CATEGORIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Agency</Label><Select value={federalFilters.agency || "all"} onValueChange={(value) => { setFederalFilters((current) => ({ ...current, agency: value === "all" ? "" : value })); setPage(0); }}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="all">All agencies</SelectItem>{FEDERAL_GRANT_AGENCIES.map((item) => <SelectItem key={item.value} value={item.value}>{item.label}</SelectItem>)}</SelectContent></Select></div>
                <div className="space-y-2"><Label>Sort</Label><Select value={sortMode} onValueChange={(value) => setSortMode(value as SortMode)}><SelectTrigger><SelectValue /></SelectTrigger><SelectContent><SelectItem value="match">Best profile match</SelectItem><SelectItem value="deadline">Deadline soonest</SelectItem><SelectItem value="newest">Newest deadline</SelectItem></SelectContent></Select></div>
              </div>
              <div className="flex flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm"><label className="flex items-center gap-2 text-muted-foreground"><Checkbox checked={emailAlert} onCheckedChange={(checked) => setEmailAlert(checked === true)} />Email me when this saved search finds something new</label><Button type="button" variant="ghost" size="sm" onClick={resetSearch}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button></div>
            </form></CardContent></Card>

            {!profile && <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Your results are not personalized yet</AlertTitle><AlertDescription className="flex flex-wrap items-center justify-between gap-3"><span>Complete a business profile to see explainable fit scores and likely eligibility conflicts.</span><Button size="sm" onClick={() => navigate(user ? "/onboarding" : "/auth")}>Build my match profile</Button></AlertDescription></Alert>}
            {federalQuery.isError && sourceFilter !== "reviewed" && <Alert variant="destructive"><AlertCircle className="h-4 w-4" /><AlertTitle>Federal search is temporarily unavailable</AlertTitle><AlertDescription>Reviewed funder-source results are still shown. You can also search directly on <a className="underline" href="https://www.grants.gov/search-grants" target="_blank" rel="noreferrer">Grants.gov</a>.</AlertDescription></Alert>}

            <section aria-live="polite" aria-busy={loading}><div className="mb-4 flex flex-wrap items-end justify-between gap-3"><div><h2 className="text-2xl font-semibold">Funding opportunities</h2><p className="text-sm text-muted-foreground">{opportunities.length} shown{federalQuery.data ? ` · ${federalQuery.data.hitCount.toLocaleString()} federal matches available` : ""}</p></div>{profile && <p className="text-sm text-muted-foreground"><ShieldCheck className="mr-1 inline h-4 w-4" />Scores explain fit; always confirm final eligibility with the funder.</p>}</div>
              {loading ? <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-96 rounded-xl" />)}</div> : opportunities.length === 0 ? <div className="rounded-xl border border-dashed p-12 text-center"><h3 className="text-xl font-semibold">No opportunities match</h3><p className="mt-2 text-muted-foreground">Try a broader phrase or reset the source filters.</p><Button className="mt-5" variant="outline" onClick={resetSearch}>Reset search</Button></div> : <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{opportunities.map((opportunity) => <OpportunityCard key={opportunity.key} opportunity={opportunity} eligibility={evaluateEligibility(profile, opportunity)} saved={savedKeys.has(opportunity.key)} saving={savingKey === opportunity.key} onSaveToggle={toggleSaved} />)}</div>}
              {sourceFilter !== "reviewed" && federalQuery.data && federalQuery.data.hitCount > FEDERAL_GRANT_PAGE_SIZE && <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Federal result pages"><Button variant="outline" disabled={page === 0 || federalQuery.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button><span className="text-sm text-muted-foreground">Federal page {page + 1} of {federalTotalPages}</span><Button variant="outline" disabled={page + 1 >= federalTotalPages || federalQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next</Button></nav>}
            </section>
          </TabsContent>

          <TabsContent value="sources" className="space-y-5"><div><h2 className="text-2xl font-semibold">Coverage registry</h2><p className="mt-1 text-muted-foreground">A transparent list of what Blueprints searches live and what it reviews from official Arizona pages. “Reviewed” does not mean automated.</p></div>
            {sourcesQuery.isError ? <Alert><AlertCircle className="h-4 w-4" /><AlertTitle>Source registry requires the latest database migration</AlertTitle><AlertDescription>Apply the 20260908010000 migration to publish the coverage registry.</AlertDescription></Alert> : <div className="grid gap-4 md:grid-cols-2">{(sourcesQuery.data || []).map((source) => <Card key={source.id}><CardHeader><div className="flex items-start justify-between gap-3"><CardTitle className="text-lg">{source.name}</CardTitle><Badge variant={source.automated ? "default" : "secondary"}>{source.automated ? "Live API" : "Official-page review"}</Badge></div></CardHeader><CardContent className="space-y-3 text-sm"><p>{source.coverage}</p><p className="text-muted-foreground">{source.notes}</p><div className="flex items-center justify-between text-xs text-muted-foreground"><span>{source.update_frequency}</span>{source.last_checked_at && <span>Checked {new Date(source.last_checked_at).toLocaleDateString()}</span>}</div><Button asChild size="sm" variant="outline"><a href={source.homepage_url} target="_blank" rel="noreferrer">Open source <ExternalLink className="ml-2 h-4 w-4" /></a></Button></CardContent></Card>)}</div>}
            <Alert><Database className="h-4 w-4" /><AlertTitle>Current automation boundary</AlertTitle><AlertDescription>Grants.gov is queried live. Other agency and funder pages are reviewed and normalized into the database; they are not represented as live APIs. The shared opportunity model lets future adapters reuse the same result cards, eligibility checks, saves, and pipeline.</AlertDescription></Alert>
          </TabsContent>
        </Tabs>
      </main>
    </DashboardLayout>
  );
}
