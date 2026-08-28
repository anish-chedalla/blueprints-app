import { DashboardLayout } from "@/components/DashboardLayout";
import { FederalGrantCard } from "@/components/FederalGrantCard";
import { FilterPanel } from "@/components/FilterPanel";
import { ProgramCard } from "@/components/ProgramCard";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import {
  FEDERAL_GRANT_AGENCIES,
  FEDERAL_GRANT_CATEGORIES,
  FEDERAL_GRANT_PAGE_SIZE,
  type FederalGrantSearchParams,
  searchFederalGrants,
} from "@/lib/grants-gov";
import { isProgramAvailable } from "@/lib/program-availability";
import { useQuery } from "@tanstack/react-query";
import { AlertCircle, Database, ExternalLink, RefreshCw, RotateCcw, Search } from "lucide-react";
import { FormEvent, useCallback, useEffect, useMemo, useState } from "react";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

type Program = Tables<"programs">;
type SyncScope = "arizona" | "national" | "both";

interface CuratedFilters {
  level: string[];
  city: string;
  county: string;
  industryTags: string[];
  demographics: string[];
  rolling: boolean | null;
  minAmount: string;
  maxAmount: string;
}

const EMPTY_CURATED_FILTERS: CuratedFilters = {
  level: [], city: "", county: "", industryTags: [], demographics: [],
  rolling: null, minAmount: "", maxAmount: "",
};

const QUICK_SEARCHES = ["Arizona", "technology", "rural business", "women-owned"];

export default function Grants() {
  const [programs, setPrograms] = useState<Program[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [curatedLoading, setCuratedLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [canSync, setCanSync] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
  const [curatedSearch, setCuratedSearch] = useState("");
  const [curatedFilters, setCuratedFilters] = useState<CuratedFilters>(EMPTY_CURATED_FILTERS);
  const [searchDraft, setSearchDraft] = useState("");
  const [submittedSearch, setSubmittedSearch] = useState("");
  const [page, setPage] = useState(0);
  const [federalFilters, setFederalFilters] = useState<{
    status: FederalGrantSearchParams["status"];
    eligibility: NonNullable<FederalGrantSearchParams["eligibility"]> | "all";
    category: string;
    agency: string;
    instrument: NonNullable<FederalGrantSearchParams["instrument"]>;
  }>({ status: "posted", eligibility: "23|99", category: "", agency: "", instrument: "G" });

  const federalSearchParams = useMemo<FederalGrantSearchParams>(() => ({
    keyword: submittedSearch,
    status: federalFilters.status,
    eligibility: federalFilters.eligibility === "all" ? undefined : federalFilters.eligibility,
    category: federalFilters.category || undefined,
    agency: federalFilters.agency || undefined,
    instrument: federalFilters.instrument,
    page,
    rows: FEDERAL_GRANT_PAGE_SIZE,
  }), [federalFilters, page, submittedSearch]);

  const federalQuery = useQuery({
    queryKey: ["grants-gov-search", federalSearchParams],
    queryFn: ({ signal }) => searchFederalGrants(federalSearchParams, signal),
    staleTime: 5 * 60 * 1000,
    retry: 1,
  });

  const fetchLastSyncTime = useCallback(async () => {
    const { data } = await supabase.from("sync_metadata").select("last_synced")
      .eq("sync_type", "grants").order("last_synced", { ascending: false }).limit(1).maybeSingle();
    if (data) setLastSynced(data.last_synced);
  }, []);

  const fetchFavorites = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      setCanSync(false);
      setFavorites(new Set());
      return;
    }
    setCanSync(session.user.app_metadata?.role === "admin");
    const { data } = await supabase.from("favorites").select("program_id").eq("user_id", session.user.id);
    if (data) setFavorites(new Set(data.map((favorite) => favorite.program_id)));
  }, []);

  const fetchPrograms = useCallback(async () => {
    setCuratedLoading(true);
    try {
      let query = supabase.from("programs").select("*").eq("type", "GRANT").order("created_at", { ascending: false });
      if (curatedSearch.trim()) {
        const safeSearch = curatedSearch.trim().replace(/[,%()]/g, " ");
        query = query.or(`name.ilike.%${safeSearch}%,sponsor.ilike.%${safeSearch}%,description.ilike.%${safeSearch}%`);
      }
      if (curatedFilters.level.length > 0) query = query.in("level", curatedFilters.level as Array<"LOCAL" | "STATE" | "NATIONAL">);
      if (curatedFilters.city) query = query.eq("city", curatedFilters.city);
      if (curatedFilters.county) query = query.eq("county", curatedFilters.county);
      if (curatedFilters.rolling !== null) query = query.eq("rolling", curatedFilters.rolling);
      if (curatedFilters.minAmount) query = query.gte("min_amount", Number(curatedFilters.minAmount));
      if (curatedFilters.maxAmount) query = query.lte("max_amount", Number(curatedFilters.maxAmount));

      const { data, error } = await query;
      if (error) throw error;
      let filtered = (data || []).filter((program) => isProgramAvailable(program));
      if (curatedFilters.industryTags.length > 0) {
        filtered = filtered.filter((program) => curatedFilters.industryTags.some((tag) => program.industry_tags?.includes(tag)));
      }
      if (curatedFilters.demographics.length > 0) {
        filtered = filtered.filter((program) => curatedFilters.demographics.some((demographic) => program.demographics?.includes(demographic)));
      }
      setPrograms(filtered);
    } catch (error) {
      console.error("Failed to fetch curated programs", error);
      toast.error("Failed to fetch curated Arizona programs");
    } finally {
      setCuratedLoading(false);
    }
  }, [curatedFilters, curatedSearch]);

  useEffect(() => { void fetchFavorites(); void fetchLastSyncTime(); }, [fetchFavorites, fetchLastSyncTime]);
  useEffect(() => { void fetchPrograms(); }, [fetchPrograms]);

  const handleSyncGrants = async (scope: SyncScope = "both") => {
    const scopeLabels: Record<SyncScope, string> = {
      arizona: "Arizona grants", national: "national grants", both: "Arizona and national grants",
    };
    setSyncing(true);
    try {
      toast.info(`Syncing ${scopeLabels[scope]}...`, { duration: 3000 });
      const { data, error } = await supabase.functions.invoke("sync-grants", { body: { scope } });
      if (error) throw error;
      if (!data?.success) throw new Error(data?.error || "Sync failed");
      toast.success(`Successfully synced ${data.recordsSynced} grants`);
      setLastSynced(data.lastSynced);
      await fetchPrograms();
    } catch (error) {
      console.error("Error syncing grants", error);
      toast.error("Failed to sync grant data");
    } finally {
      setSyncing(false);
    }
  };

  const submitFederalSearch = (event: FormEvent) => {
    event.preventDefault();
    setPage(0);
    setSubmittedSearch(searchDraft.trim());
  };

  const runQuickSearch = (query: string) => {
    setSearchDraft(query); setSubmittedSearch(query); setPage(0);
  };

  const updateFederalFilter = <Key extends keyof typeof federalFilters>(key: Key, value: (typeof federalFilters)[Key]) => {
    setFederalFilters((current) => ({ ...current, [key]: value }));
    setPage(0);
  };

  const resetFederalSearch = () => {
    setSearchDraft(""); setSubmittedSearch(""); setPage(0);
    setFederalFilters({ status: "posted", eligibility: "23|99", category: "", agency: "", instrument: "G" });
  };

  const totalPages = Math.max(1, Math.ceil((federalQuery.data?.hitCount ?? 0) / FEDERAL_GRANT_PAGE_SIZE));
  const firstResult = federalQuery.data && federalQuery.data.hitCount > 0 ? federalQuery.data.startRecord + 1 : 0;
  const lastResult = federalQuery.data
    ? Math.min(federalQuery.data.startRecord + federalQuery.data.opportunities.length, federalQuery.data.hitCount) : 0;

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <header className="mb-8">
          <h1 className="text-4xl font-bold">Grant Finder</h1>
          <p className="mt-2 max-w-3xl text-xl text-muted-foreground">
            Search the live federal funding catalog or browse programs curated for Arizona businesses.
          </p>
        </header>

        <Tabs defaultValue="federal" className="space-y-6">
          <TabsList className="grid h-auto w-full max-w-xl grid-cols-2">
            <TabsTrigger value="federal" className="gap-2 py-2.5"><Search className="h-4 w-4" />Live federal search</TabsTrigger>
            <TabsTrigger value="curated" className="gap-2 py-2.5"><Database className="h-4 w-4" />Curated Arizona list</TabsTrigger>
          </TabsList>

          <TabsContent value="federal" className="space-y-6">
            <section className="rounded-2xl border bg-card p-5 shadow-sm md:p-6">
              <form role="search" onSubmit={submitFederalSearch} className="space-y-5">
                <div>
                  <Label htmlFor="federal-grant-search" className="text-base font-semibold">Search official opportunities</Label>
                  <div className="mt-2 flex flex-col gap-2 sm:flex-row">
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
                      <Input id="federal-grant-search" placeholder="Try an industry, location, program, or opportunity number"
                        value={searchDraft} onChange={(event) => setSearchDraft(event.target.value)} className="pl-10" />
                    </div>
                    <Button type="submit" className="sm:w-28">Search</Button>
                  </div>
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <span className="text-muted-foreground">Popular:</span>
                    {QUICK_SEARCHES.map((query) => (
                      <Button key={query} type="button" variant="outline" size="sm" onClick={() => runQuickSearch(query)}>{query}</Button>
                    ))}
                  </div>
                </div>

                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-5">
                  <div className="space-y-2">
                    <Label>Applicant eligibility</Label>
                    <Select value={federalFilters.eligibility} onValueChange={(value) => updateFederalFilter("eligibility", value as typeof federalFilters.eligibility)}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="23|99">Small business + unrestricted</SelectItem>
                        <SelectItem value="23">Small businesses only</SelectItem>
                        <SelectItem value="22">Other for-profit businesses</SelectItem>
                        <SelectItem value="99">Unrestricted applicants</SelectItem>
                        <SelectItem value="all">All applicant types</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Funding category</Label>
                    <Select value={federalFilters.category || "all"} onValueChange={(value) => updateFederalFilter("category", value === "all" ? "" : value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="all">All categories</SelectItem>
                        {FEDERAL_GRANT_CATEGORIES.map((category) => <SelectItem key={category.value} value={category.value}>{category.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Federal agency</Label>
                    <Select value={federalFilters.agency || "all"} onValueChange={(value) => updateFederalFilter("agency", value === "all" ? "" : value)}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="all">All agencies</SelectItem>
                        {FEDERAL_GRANT_AGENCIES.map((agency) => <SelectItem key={agency.value} value={agency.value}>{agency.label}</SelectItem>)}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Opportunity status</Label>
                    <Select value={federalFilters.status} onValueChange={(value) => updateFederalFilter("status", value as FederalGrantSearchParams["status"])}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="posted">Open now</SelectItem>
                        <SelectItem value="forecasted">Forecasted</SelectItem>
                        <SelectItem value="posted|forecasted">Open + forecasted</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>Funding instrument</Label>
                    <Select value={federalFilters.instrument} onValueChange={(value) => updateFederalFilter("instrument", value as typeof federalFilters.instrument)}>
                      <SelectTrigger><SelectValue /></SelectTrigger><SelectContent>
                        <SelectItem value="G">Grants</SelectItem><SelectItem value="CA">Cooperative agreements</SelectItem><SelectItem value="G|CA">Both</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex items-center justify-between gap-4 border-t pt-4 text-xs text-muted-foreground">
                  <span>Live data from the official Grants.gov public API. No account or API key required.</span>
                  <Button type="button" variant="ghost" size="sm" onClick={resetFederalSearch}><RotateCcw className="mr-2 h-4 w-4" />Reset</Button>
                </div>
              </form>
            </section>

            {federalQuery.isError ? (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" /><AlertTitle>Federal grant search is temporarily unavailable</AlertTitle>
                <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
                  <span>Try again in a moment, or search directly on Grants.gov.</span>
                  <div className="flex gap-2">
                    <Button size="sm" variant="outline" onClick={() => federalQuery.refetch()}>Try again</Button>
                    <Button size="sm" variant="outline" asChild><a href="https://www.grants.gov/search-grants" target="_blank" rel="noreferrer">Grants.gov <ExternalLink className="ml-2 h-4 w-4" /></a></Button>
                  </div>
                </AlertDescription>
              </Alert>
            ) : (
              <section aria-live="polite" aria-busy={federalQuery.isFetching}>
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <div><h2 className="text-2xl font-semibold">Federal opportunities</h2>
                    {federalQuery.data && <p className="mt-1 text-sm text-muted-foreground">
                      {federalQuery.data.hitCount.toLocaleString()} matching opportunities{submittedSearch ? ` for “${submittedSearch}”` : ""}{federalQuery.isFetching ? " · updating…" : ""}
                    </p>}
                  </div>
                  {federalQuery.data && federalQuery.data.hitCount > 0 && <p className="text-sm text-muted-foreground">Showing {firstResult}–{lastResult}</p>}
                </div>

                {federalQuery.isLoading ? (
                  <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">{Array.from({ length: 6 }, (_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}</div>
                ) : federalQuery.data?.opportunities.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-12 text-center">
                    <h3 className="text-xl font-semibold">No opportunities match these filters</h3>
                    <p className="mt-2 text-muted-foreground">Try a broader keyword, applicant type, or funding category.</p>
                    <Button variant="outline" className="mt-5" onClick={resetFederalSearch}>Reset search</Button>
                  </div>
                ) : (
                  <div className={`grid gap-6 md:grid-cols-2 xl:grid-cols-3 ${federalQuery.isFetching ? "opacity-60" : ""}`}>
                    {federalQuery.data?.opportunities.map((opportunity) => <FederalGrantCard key={opportunity.id} opportunity={opportunity} />)}
                  </div>
                )}

                {federalQuery.data && federalQuery.data.hitCount > FEDERAL_GRANT_PAGE_SIZE && (
                  <nav className="mt-8 flex items-center justify-center gap-3" aria-label="Federal grant result pages">
                    <Button variant="outline" disabled={page === 0 || federalQuery.isFetching} onClick={() => setPage((current) => Math.max(0, current - 1))}>Previous</Button>
                    <span className="text-sm text-muted-foreground">Page {page + 1} of {totalPages}</span>
                    <Button variant="outline" disabled={page + 1 >= totalPages || federalQuery.isFetching} onClick={() => setPage((current) => current + 1)}>Next</Button>
                  </nav>
                )}
              </section>
            )}
            <p className="text-center text-xs text-muted-foreground">Blueprints uses the Grants.gov public API but is not endorsed or certified by the U.S. Department of Health and Human Services.</p>
          </TabsContent>

          <TabsContent value="curated" className="space-y-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div><h2 className="text-2xl font-semibold">Curated Arizona opportunities</h2>
                <p className="mt-1 text-muted-foreground">Local, state, and selected national programs stored in Blueprints.</p>
                {lastSynced && <p className="mt-2 text-xs text-muted-foreground">Last synced: {new Date(lastSynced).toLocaleString()}</p>}
              </div>
              {canSync && <DropdownMenu><DropdownMenuTrigger asChild>
                <Button disabled={syncing} className="gap-2"><RefreshCw className={`h-4 w-4 ${syncing ? "animate-spin" : ""}`} />{syncing ? "Syncing..." : "Sync grants"}</Button>
              </DropdownMenuTrigger><DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSyncGrants("arizona")}>Sync Arizona only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncGrants("national")}>Sync national only</DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncGrants("both")}>Sync both</DropdownMenuItem>
              </DropdownMenuContent></DropdownMenu>}
            </div>

            <div className="relative max-w-xl"><Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
              <Input aria-label="Search curated grants" placeholder="Search curated grants by name, sponsor, or description"
                value={curatedSearch} onChange={(event) => setCuratedSearch(event.target.value)} className="pl-10" />
            </div>

            <div className="grid gap-8 lg:grid-cols-[300px_1fr]">
              <aside className="h-fit space-y-4 lg:sticky lg:top-20"><FilterPanel filters={curatedFilters} onFilterChange={setCuratedFilters} type="GRANT" /></aside>
              <section>
                {curatedLoading ? (
                  <div className="grid gap-6 md:grid-cols-2">{Array.from({ length: 4 }, (_, index) => <Skeleton key={index} className="h-80 rounded-xl" />)}</div>
                ) : programs.length === 0 ? (
                  <div className="rounded-xl border border-dashed p-12 text-center"><h3 className="text-xl font-semibold">No curated grants found</h3><p className="mt-2 text-muted-foreground">Try adjusting the curated filters or search query.</p></div>
                ) : (<><p className="mb-4 text-sm text-muted-foreground">Found {programs.length} curated grant{programs.length === 1 ? "" : "s"}</p>
                  <div className="grid gap-6 md:grid-cols-2">{programs.map((program) => (
                    <ProgramCard key={program.id} program={{ ...program, rolling: Boolean(program.rolling), status: program.status ?? "OPEN" }}
                      isFavorite={favorites.has(program.id)} onFavoriteToggle={fetchFavorites} />
                  ))}</div></>)
                }
              </section>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
