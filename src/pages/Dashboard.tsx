import { Card, CardHeader, CardTitle } from "@/components/ui/card";
import { Award, DollarSign, BookmarkCheck, TrendingUp, Lightbulb, ArrowRight, Layers, History } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Link, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { DashboardLayout } from "@/components/DashboardLayout";
import { VERIFIED_LOAN_FALLBACK } from "@/data/verified-loans";
import { searchFederalGrants } from "@/lib/grants-gov";
import { isProgramAvailable } from "@/lib/program-availability";
import { latestUniqueViews, loadViewHistory, recordHistoryRevisit, type ViewHistoryItem } from "@/lib/view-history";
import blueprintBg from "@/assets/blueprint-bg.jpg";

const LIVE_GRANT_QUERY = {
  status: "posted" as const,
  eligibility: "22|23|99",
  instrument: "G" as const,
  page: 0,
  rows: 1,
};

export default function Dashboard() {
  const [recentGrants, setRecentGrants] = useState<ViewHistoryItem[]>([]);
  const [recentLoans, setRecentLoans] = useState<ViewHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [grantsCount, setGrantsCount] = useState(0);
  const [loansCount, setLoansCount] = useState(0);
  const [savedCount, setSavedCount] = useState(0);
  const [newThisWeekCount, setNewThisWeekCount] = useState(0);
  const [federalConnected, setFederalConnected] = useState(true);
  const navigate = useNavigate();

  const fetchDashboardData = useCallback(async (userId: string) => {
    setLoading(true);
    try {
      const [catalogResult, savedResult, history, federalActive, federalNew] = await Promise.all([
        supabase.from("programs").select("*").not("source_id", "is", null),
        supabase.from("saved_opportunities").select("*", { count: "exact", head: true }).eq("user_id", userId),
        loadViewHistory(userId),
        searchFederalGrants(LIVE_GRANT_QUERY).catch(() => null),
        searchFederalGrants({ ...LIVE_GRANT_QUERY, dateRange: "7" }).catch(() => null),
      ]);
      if (catalogResult.error) throw catalogResult.error;
      if (savedResult.error) throw savedResult.error;

      const catalog = (catalogResult.data || []).filter((program) => isProgramAvailable(program));
      const curatedGrants = catalog.filter((program) => program.type === "GRANT" && program.source_kind !== "api" && !program.source_id?.startsWith("grants-gov:"));
      const databaseLoans = catalog.filter((program) => program.type === "LOAN" && program.source_url && program.last_verified_at);
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newlyCataloged = [...curatedGrants, ...databaseLoans].filter((program) => new Date(program.created_at).getTime() >= oneWeekAgo).length;

      setGrantsCount((federalActive?.hitCount || 0) + curatedGrants.length);
      setFederalConnected(Boolean(federalActive && federalNew));
      setLoansCount(databaseLoans.length || VERIFIED_LOAN_FALLBACK.filter((program) => isProgramAvailable(program)).length);
      setSavedCount(savedResult.count || 0);
      setNewThisWeekCount((federalNew?.hitCount || 0) + newlyCataloged);
      setRecentGrants(latestUniqueViews(history, "GRANT"));
      setRecentLoans(latestUniqueViews(history, "LOAN"));
    } catch (error) {
      console.error(error);
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      await fetchDashboardData(session.user.id);
    };
    void initialize();
  }, [fetchDashboardData, navigate]);

  const openRecent = (item: ViewHistoryItem) => {
    void recordHistoryRevisit(item);
    if (item.internal_url) navigate(item.internal_url);
    else window.open(item.official_url, "_blank", "noopener,noreferrer");
  };

  if (loading) return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading your dashboard…</div></DashboardLayout>;

  const stats = [
    { label: "Active grants", value: grantsCount, detail: federalConnected ? "Live federal + current catalog" : "Catalog only · federal unavailable", icon: Award },
    { label: "Loan programs", value: loansCount, detail: "Verified catalog", icon: DollarSign },
    { label: "Saved items", value: savedCount, detail: "Grants and loans", icon: BookmarkCheck },
    { label: "New this week", value: newThisWeekCount, detail: federalConnected ? "Posted or cataloged in 7 days" : "Cataloged in 7 days · federal unavailable", icon: TrendingUp },
  ];

  return <DashboardLayout><div className="relative min-h-full">
    <div className="absolute inset-0 opacity-30" style={{ backgroundImage: `url(${blueprintBg})`, backgroundSize: "cover", backgroundPosition: "center" }} />
    <div className="relative z-10 space-y-8 p-8">
      <section className="max-w-4xl">
        <div className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary/30 bg-primary/10 px-4 py-1.5"><Layers className="h-4 w-4 text-primary" /><span className="text-xs font-medium uppercase tracking-wide text-primary">Arizona Grant Discovery</span></div>
        <h1 className="mb-4 text-5xl font-bold">Your Blueprint for Success</h1>
        <p className="mb-8 max-w-2xl text-xl text-muted-foreground">Search official funding sources, understand eligibility, and return to opportunities you have actually reviewed.</p>
        <div className="flex flex-wrap gap-3"><Button size="lg" asChild><Link to="/grants">Explore Grants<ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button size="lg" variant="outline" asChild><Link to="/settings?tab=business"><Lightbulb className="mr-2 h-4 w-4" />Review Match Profile</Link></Button></div>
      </section>

      <section className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4" aria-label="Funding summary">
        {stats.map(({ label, value, detail, icon: Icon }) => <Card key={label} className="border-border/50 bg-card/60 backdrop-blur-sm"><CardHeader className="space-y-4"><div className="flex h-12 w-12 items-center justify-center rounded-lg border bg-background/50"><Icon className="h-6 w-6 text-primary" /></div><div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">{label}</p><p className="text-4xl font-bold">{value.toLocaleString()}</p><p className="text-sm text-muted-foreground">{detail}</p></div></CardHeader></Card>)}
      </section>

      <section className="grid gap-8 lg:grid-cols-2">
        <RecentViews title="Recently viewed grants" items={recentGrants} icon={Award} empty="Open a grant to see it here." onOpen={openRecent} />
        <RecentViews title="Recently viewed loans" items={recentLoans} icon={DollarSign} empty="Open a loan to see it here." onOpen={openRecent} />
      </section>
      <div className="flex justify-end"><Button asChild variant="outline"><Link to="/history"><History className="mr-2 h-4 w-4" />View complete history</Link></Button></div>
    </div>
  </div></DashboardLayout>;
}

function RecentViews({ title, items, icon: Icon, empty, onOpen }: { title: string; items: ViewHistoryItem[]; icon: typeof Award; empty: string; onOpen: (item: ViewHistoryItem) => void }) {
  return <div className="space-y-4"><div className="flex items-center gap-3"><div className="flex h-10 w-10 items-center justify-center rounded-lg border bg-background/50"><Icon className="h-5 w-5 text-primary" /></div><h2 className="text-2xl font-bold">{title}</h2></div><div className="space-y-4">{items.length === 0 ? <Card className="bg-card/60"><CardHeader><p className="text-muted-foreground">{empty}</p></CardHeader></Card> : items.map((item) => <Card key={item.id} className="cursor-pointer bg-card/60 transition hover:border-primary/50" onClick={() => onOpen(item)}><CardHeader><CardTitle className="text-lg">{item.title}</CardTitle><p className="text-sm text-muted-foreground">{item.sponsor} · viewed {new Date(item.viewed_at).toLocaleString()}</p></CardHeader></Card>)}</div></div>;
}
