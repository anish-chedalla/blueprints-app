import { DashboardLayout } from "@/components/DashboardLayout";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { clearViewHistory, loadViewHistory, recordHistoryRevisit, type ViewHistoryItem } from "@/lib/view-history";
import { Clock3, ExternalLink, History as HistoryIcon, Search, Trash2 } from "lucide-react";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";

type HistoryFilter = "all" | "GRANT" | "LOAN";

export default function History() {
  const navigate = useNavigate();
  const [items, setItems] = useState<ViewHistoryItem[]>([]);
  const [filter, setFilter] = useState<HistoryFilter>("all");
  const [query, setQuery] = useState("");
  const [userId, setUserId] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initialize = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      setUserId(session.user.id);
      setItems(await loadViewHistory(session.user.id));
      setLoading(false);
    };
    void initialize();
  }, [navigate]);

  const visible = useMemo(() => {
    const normalized = query.trim().toLowerCase();
    return items.filter((item) => filter === "all" || item.funding_type === filter)
      .filter((item) => !normalized || `${item.title} ${item.sponsor} ${item.source}`.toLowerCase().includes(normalized));
  }, [filter, items, query]);

  const openItem = (item: ViewHistoryItem) => {
    void recordHistoryRevisit(item);
    if (item.internal_url) navigate(item.internal_url);
    else window.open(item.official_url, "_blank", "noopener,noreferrer");
  };
  const clearAll = async () => {
    await clearViewHistory(userId);
    setItems([]);
    toast.success("Viewing history cleared");
  };

  return <DashboardLayout><main className="container mx-auto px-4 py-8">
    <header className="mb-8 flex flex-wrap items-end justify-between gap-4"><div><div className="flex items-center gap-3"><HistoryIcon className="h-8 w-8 text-primary" /><h1 className="text-4xl font-bold">Viewing history</h1></div><p className="mt-2 text-lg text-muted-foreground">The grants and loans you opened, newest first.</p></div>
      <AlertDialog><AlertDialogTrigger asChild><Button variant="outline" disabled={items.length === 0}><Trash2 className="mr-2 h-4 w-4" />Clear history</Button></AlertDialogTrigger><AlertDialogContent><AlertDialogHeader><AlertDialogTitle>Clear all viewing history?</AlertDialogTitle><AlertDialogDescription>This permanently removes your synced and locally stored opportunity history. Saved grants and loans are not affected.</AlertDialogDescription></AlertDialogHeader><AlertDialogFooter><AlertDialogCancel>Cancel</AlertDialogCancel><AlertDialogAction onClick={() => void clearAll()}>Clear history</AlertDialogAction></AlertDialogFooter></AlertDialogContent></AlertDialog>
    </header>

    <div className="mb-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between"><Tabs value={filter} onValueChange={(value) => setFilter(value as HistoryFilter)}><TabsList><TabsTrigger value="all">All ({items.length})</TabsTrigger><TabsTrigger value="GRANT">Grants</TabsTrigger><TabsTrigger value="LOAN">Loans</TabsTrigger></TabsList></Tabs><div className="relative w-full sm:max-w-sm"><Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" /><Input className="pl-9" value={query} onChange={(event) => setQuery(event.target.value)} placeholder="Search your history" /></div></div>

    {loading ? <p className="py-12 text-center text-muted-foreground">Loading history…</p> : visible.length === 0 ? <div className="rounded-xl border border-dashed py-16 text-center"><Clock3 className="mx-auto mb-4 h-12 w-12 text-muted-foreground" /><h2 className="text-xl font-semibold">No viewed opportunities here</h2><p className="mt-2 text-muted-foreground">Open a grant or loan and it will appear here.</p><Button className="mt-5" onClick={() => navigate("/grants")}>Explore grants</Button></div> : <div className="space-y-3">{visible.map((item) => <Card key={item.id} className="transition hover:border-primary/40"><CardContent className="flex flex-col gap-4 pt-6 sm:flex-row sm:items-center sm:justify-between"><div><div className="mb-2 flex flex-wrap gap-2"><Badge>{item.funding_type === "LOAN" ? "Loan" : "Grant"}</Badge><Badge variant="outline">{item.source === "grants.gov" ? "Grants.gov" : "Verified catalog"}</Badge></div><h2 className="font-semibold">{item.title}</h2><p className="text-sm text-muted-foreground">{item.sponsor} · {new Date(item.viewed_at).toLocaleString()}</p></div><div className="flex gap-2"><Button variant="outline" onClick={() => openItem(item)}>Open again</Button><Button asChild size="icon" variant="ghost"><a href={item.official_url} target="_blank" rel="noreferrer" onClick={() => void recordHistoryRevisit(item)} aria-label={`Open official source for ${item.title}`}><ExternalLink className="h-4 w-4" /></a></Button></div></CardContent></Card>)}</div>}
  </main></DashboardLayout>;
}
