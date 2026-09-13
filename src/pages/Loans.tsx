import { DashboardLayout } from "@/components/DashboardLayout";
import { FilterPanel, type ProgramFilters } from "@/components/FilterPanel";
import { ProgramCard } from "@/components/ProgramCard";
import { Input } from "@/components/ui/input";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { ExternalLink, Search, ShieldCheck } from "lucide-react";
import { useCallback, useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import { toast } from "sonner";
import { isProgramAvailable } from "@/lib/program-availability";
import { matchingProfileIndustries } from "@/lib/grant-taxonomy";
import { curatedProgramToOpportunity } from "@/lib/opportunities";
import { VERIFIED_LOAN_FALLBACK } from "@/data/verified-loans";

const normalize = (value: string) => value.trim().toLowerCase();

export default function Loans() {
  const [programs, setPrograms] = useState<Tables<"programs">[]>([]);
  const [savedKeys, setSavedKeys] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [usingFallback, setUsingFallback] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState<ProgramFilters>({
    level: [] as string[],
    city: "",
    county: "",
    industryTags: [] as string[],
    demographics: [] as string[],
    rolling: null as boolean | null,
    minAmount: "",
    maxAmount: "",
  });

  const fetchPrograms = useCallback(async () => {
    setLoading(true);
    try {
      const query = supabase
        .from("programs")
        .select("*")
        .eq("type", "LOAN")
        .not("source_id", "is", null)
        .order("created_at", { ascending: false });

      const { data, error } = await query;

      if (error) throw error;

      const search = normalize(searchQuery);
      const desiredMinimum = filters.minAmount ? Number(filters.minAmount) : null;
      const desiredMaximum = filters.maxAmount ? Number(filters.maxAmount) : null;
      const verifiedRows = (data || []).filter((program) => Boolean(
        program.source_id && program.source_url && program.last_verified_at,
      ));
      const candidates = verifiedRows.length > 0 ? verifiedRows : VERIFIED_LOAN_FALLBACK;
      setUsingFallback(verifiedRows.length === 0);
      let filtered = candidates
        .filter((program) => isProgramAvailable(program))
        .filter((program) => !search || [
          program.name,
          program.sponsor,
          program.description,
          program.eligibility_notes || "",
          ...(program.industry_tags || []),
          ...(program.use_cases || []),
        ].join(" ").toLowerCase().includes(search))
        .filter((program) => filters.level.length === 0 || filters.level.includes(program.level))
        .filter((program) => !filters.city || !program.city || normalize(program.city) === normalize(filters.city))
        .filter((program) => !filters.county || !program.county || normalize(program.county) === normalize(filters.county))
        .filter((program) => filters.rolling === null || program.rolling === filters.rolling)
        .filter((program) => desiredMinimum === null || program.max_amount === null || program.max_amount >= desiredMinimum)
        .filter((program) => desiredMaximum === null || program.min_amount === null || program.min_amount <= desiredMaximum);
      if (filters.industryTags.length > 0) {
        filtered = filtered.filter((program) => (
          matchingProfileIndustries(curatedProgramToOpportunity(program), filters.industryTags).length > 0
        ));
      }
      if (filters.demographics.length > 0) {
        filtered = filtered.filter(p => 
          filters.demographics.some(demo => p.demographics?.includes(demo))
        );
      }

      setPrograms(filtered);
    } catch {
      toast.error("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  }, [filters, searchQuery]);

  const fetchSaved = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("saved_opportunities")
      .select("source,external_id")
      .eq("user_id", session.user.id);

    if (data) {
      setSavedKeys(new Set(data.map((item) => `${item.source}:${item.external_id}`)));
    }
  }, []);

  useEffect(() => {
    void fetchPrograms();
    void fetchSaved();
  }, [fetchPrograms, fetchSaved]);

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Loan Finder</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Compare verified government and nonprofit lending programs available to Arizona businesses
          </p>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search loans by name, sponsor, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Alert className="mt-5 max-w-4xl">
            <ShieldCheck className="h-4 w-4" />
            <AlertTitle>Official links, not lender endorsements</AlertTitle>
            <AlertDescription>
              Every listed program has a stable official source and verification date. Terms and approval come from participating lenders; Blueprints does not make loans. For more Arizona options, use the <a className="underline" href="https://azcdfi.org/azcdfi-lending/" target="_blank" rel="noreferrer">Arizona CDFI Network directory <ExternalLink className="inline h-3 w-3" /></a>.
            </AlertDescription>
          </Alert>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <aside className="lg:sticky lg:top-20 h-fit">
            <FilterPanel filters={filters} onFilterChange={setFilters} type="LOAN" />
          </aside>

          <main>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading loans...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl font-semibold mb-2">No loans found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Found {programs.length} loan{programs.length !== 1 ? "s" : ""}{usingFallback ? " · official-link catalog" : " · database catalog"}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isFavorite={savedKeys.has(`blueprints:${program.source_id || program.id}`)}
                      onFavoriteToggle={fetchSaved}
                      externalOnly={program.id.startsWith("catalog:")}
                    />
                  ))}
                </div>
              </>
            )}
          </main>
        </div>
      </div>
    </DashboardLayout>
  );
}
