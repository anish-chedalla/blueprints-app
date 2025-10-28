import { DashboardLayout } from "@/components/DashboardLayout";
import { FilterPanel } from "@/components/FilterPanel";
import { ProgramCard } from "@/components/ProgramCard";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Search, RefreshCw } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

export default function Grants() {
  const [programs, setPrograms] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [lastSynced, setLastSynced] = useState<string | null>(null);
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
    fetchLastSyncTime();
  }, [filters, searchQuery]);

  const fetchLastSyncTime = async () => {
    const { data } = await supabase
      .from('sync_metadata')
      .select('last_synced')
      .eq('sync_type', 'grants')
      .order('last_synced', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (data) {
      setLastSynced(data.last_synced);
    }
  };

  const handleSyncGrants = async (scope: 'arizona' | 'national' | 'both' = 'both') => {
    setSyncing(true);
    const scopeLabels = {
      arizona: 'Arizona grants',
      national: 'national grants',
      both: 'Arizona and national grants'
    };
    
    try {
      toast.info(`Syncing ${scopeLabels[scope]}...`, { duration: 3000 });
      
      const { data, error } = await supabase.functions.invoke('sync-grants', {
        body: { scope },
      });

      if (error) throw error;

      if (data.success) {
        toast.success(`Successfully synced ${data.recordsSynced} grants`);
        setLastSynced(data.lastSynced);
        await fetchPrograms();
      } else {
        throw new Error(data.error || 'Sync failed');
      }
    } catch (error) {
      console.error('Error syncing grants:', error);
      toast.error('Failed to sync grant data');
    } finally {
      setSyncing(false);
    }
  };

  const fetchPrograms = async () => {
    setLoading(true);
    try {
      let query = supabase
        .from("programs")
        .select("*")
        .eq("type", "GRANT")
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
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-4xl font-bold mb-2">Grant Finder</h1>
              <p className="text-xl text-muted-foreground">
                Discover grant opportunities for your Arizona business
              </p>
              {lastSynced && (
                <p className="text-sm text-muted-foreground mt-2">
                  Last synced: {new Date(lastSynced).toLocaleString()}
                </p>
              )}
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button 
                  disabled={syncing}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className={`h-4 w-4 ${syncing ? 'animate-spin' : ''}`} />
                  {syncing ? 'Syncing...' : 'Sync Grants'}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onClick={() => handleSyncGrants('arizona')}>
                  Sync Arizona Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncGrants('national')}>
                  Sync National Only
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleSyncGrants('both')}>
                  Sync Both (AZ + National)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
          
          <div className="relative max-w-xl">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            <Input
              placeholder="Search grants by name, sponsor, or description..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>

        <div className="grid lg:grid-cols-[300px_1fr] gap-8">
          <aside className="lg:sticky lg:top-20 h-fit space-y-4">
            <FilterPanel filters={filters} onFilterChange={setFilters} type="GRANT" />
            <div className="text-xs text-muted-foreground p-4 border rounded-lg bg-muted/50">
              This product uses the Grants.gov API but is not endorsed or certified by the U.S. Department of Health and Human Services.
            </div>
          </aside>

          <main>
            {loading ? (
              <div className="text-center py-12">
                <p className="text-muted-foreground">Loading grants...</p>
              </div>
            ) : programs.length === 0 ? (
              <div className="text-center py-12">
                <p className="text-xl font-semibold mb-2">No grants found</p>
                <p className="text-muted-foreground">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <>
                <p className="text-sm text-muted-foreground mb-4">
                  Found {programs.length} grant{programs.length !== 1 ? "s" : ""}
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
