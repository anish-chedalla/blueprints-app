import { DashboardLayout } from "@/components/DashboardLayout";
import { FilterPanel } from "@/components/FilterPanel";
import { ProgramCard } from "@/components/ProgramCard";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

export default function Loans() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filters, setFilters] = useState({
    level: [] as string[],
    city: "",
    county: "",
    industryTags: [] as string[],
    demographics: [] as string[],
    rolling: null as boolean | null,
    minAmount: "",
    maxAmount: "",
  });

  useEffect(() => {
    fetchPrograms();
    fetchFavorites();
  }, [filters, searchQuery]);

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("programs")
        .select("*")
        .eq("type", "LOAN")
        .order("created_at", { ascending: false });

      if (searchQuery) {
        query = query.or(`name.ilike.%${searchQuery}%,sponsor.ilike.%${searchQuery}%,description.ilike.%${searchQuery}%`);
      }

      if (filters.level.length > 0) {
        query = query.in("level", filters.level as ("LOCAL" | "STATE" | "NATIONAL")[]);
      }

      if (filters.city) {
        query = query.eq("city", filters.city);
      }

      if (filters.county) {
        query = query.eq("county", filters.county);
      }

      if (filters.rolling !== null) {
        query = query.eq("rolling", filters.rolling);
      }

      if (filters.minAmount) {
        query = query.gte("min_amount", parseInt(filters.minAmount));
      }

      if (filters.maxAmount) {
        query = query.lte("max_amount", parseInt(filters.maxAmount));
      }

      const { data, error } = await query;

      if (error) throw error;

      // Filter by industry tags and demographics in memory (array contains)
      let filtered = data || [];
      if (filters.industryTags.length > 0) {
        filtered = filtered.filter(p => 
          filters.industryTags.some(tag => p.industry_tags?.includes(tag))
        );
      }
      if (filters.demographics.length > 0) {
        filtered = filtered.filter(p => 
          filters.demographics.some(demo => p.demographics?.includes(demo))
        );
      }

      setPrograms(filtered);
    } catch (error) {
      toast.error("Failed to fetch programs");
    } finally {
      setLoading(false);
    }
  };

  const fetchFavorites = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from("favorites")
      .select("program_id")
      .eq("user_id", session.user.id);

    if (data) {
      setFavorites(new Set(data.map(f => f.program_id)));
    }
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Loan Finder</h1>
          <p className="text-xl text-muted-foreground mb-6">
            Find the right loan for your Arizona business
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
                  Found {programs.length} loan{programs.length !== 1 ? "s" : ""}
                </p>
                <div className="grid md:grid-cols-2 gap-6">
                  {programs.map((program) => (
                    <ProgramCard
                      key={program.id}
                      program={program}
                      isFavorite={favorites.has(program.id)}
                      onFavoriteToggle={fetchFavorites}
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
