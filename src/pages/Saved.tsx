import { DashboardLayout } from "@/components/DashboardLayout";
import { ProgramCard } from "@/components/ProgramCard";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Bookmark, Heart } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Saved() {
  const [grants, setGrants] = useState<any[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [favorites, setFavorites] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const navigate = useNavigate();

  useEffect(() => {
    checkUser();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      toast.error("Please sign in to view saved items");
      navigate("/auth");
      return;
    }
    setUser(session.user);
    fetchSavedPrograms(session.user.id);
  };

  const fetchSavedPrograms = async (userId: string) => {
    setLoading(true);
    try {
      // Fetch user's favorites
      const { data: favoritesData, error: favError } = await supabase
        .from("favorites")
        .select("program_id")
        .eq("user_id", userId);

      if (favError) throw favError;

      const programIds = favoritesData?.map(f => f.program_id) || [];
      setFavorites(new Set(programIds));

      if (programIds.length === 0) {
        setGrants([]);
        setLoans([]);
        setLoading(false);
        return;
      }

      // Fetch programs details
      const { data: programsData, error: progError } = await supabase
        .from("programs")
        .select("*")
        .in("id", programIds);

      if (progError) throw progError;

      const grantsData = programsData?.filter(p => p.type === "GRANT") || [];
      const loansData = programsData?.filter(p => p.type === "LOAN") || [];

      setGrants(grantsData);
      setLoans(loansData);
    } catch (error) {
      toast.error("Failed to fetch saved programs");
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleFavoriteToggle = () => {
    if (user) {
      fetchSavedPrograms(user.id);
    }
  };

  if (loading) {
    return (
      <DashboardLayout>
        <div className="container mx-auto px-4 py-8">
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading saved items...</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const EmptyState = ({ type }: { type: string }) => (
    <div className="text-center py-12">
      <Heart className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
      <p className="text-xl font-semibold mb-2">No saved {type} yet</p>
      <p className="text-muted-foreground mb-6">
        Start exploring and save your favorite programs
      </p>
      <Button asChild>
        <a href={type === "grants" ? "/grants" : "/loans"}>
          Browse {type === "grants" ? "Grants" : "Loans"}
        </a>
      </Button>
    </div>
  );

  return (
    <DashboardLayout>
      <div className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <div className="flex items-center gap-3 mb-4">
            <Bookmark className="h-8 w-8 text-primary" />
            <h1 className="text-4xl font-bold">Saved Programs</h1>
          </div>
          <p className="text-xl text-muted-foreground">
            Your bookmarked grants and loans in one place
          </p>
        </div>

        <Tabs defaultValue="grants" className="w-full">
          <TabsList className="mb-6">
            <TabsTrigger value="grants" className="px-8">
              Grants ({grants.length})
            </TabsTrigger>
            <TabsTrigger value="loans" className="px-8">
              Loans ({loans.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="grants">
            {grants.length === 0 ? (
              <EmptyState type="grants" />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {grants.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isFavorite={favorites.has(program.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>

          <TabsContent value="loans">
            {loans.length === 0 ? (
              <EmptyState type="loans" />
            ) : (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {loans.map((program) => (
                  <ProgramCard
                    key={program.id}
                    program={program}
                    isFavorite={favorites.has(program.id)}
                    onFavoriteToggle={handleFavoriteToggle}
                  />
                ))}
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
}
