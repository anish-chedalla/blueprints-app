import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Award, DollarSign, Landmark, TrendingUp } from "lucide-react";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { searchFederalGrants } from "@/lib/grants-gov";
import { isProgramAvailable } from "@/lib/program-availability";
import { VERIFIED_LOAN_FALLBACK } from "@/data/verified-loans";

const LIVE_GRANT_QUERY = {
  status: "posted" as const,
  eligibility: "22|23|99",
  instrument: "G" as const,
  page: 0,
  rows: 1,
};

export const StatsStrip = () => {
  const { data } = useQuery({
    queryKey: ["landing-stats"],
    queryFn: async () => {
      const [catalogResult, sourcesResult, federalActive, federalNew] = await Promise.all([
        supabase.from("programs").select("*").not("source_id", "is", null),
        supabase.from("grant_sources").select("*", { count: "exact", head: true }),
        searchFederalGrants(LIVE_GRANT_QUERY).catch(() => null),
        searchFederalGrants({ ...LIVE_GRANT_QUERY, dateRange: "7" }).catch(() => null),
      ]);

      const catalog = (catalogResult.data || []).filter((program) => isProgramAvailable(program));
      const curatedGrants = catalog.filter(
        (program) => program.type === "GRANT" && program.source_kind !== "api" && !program.source_id?.startsWith("grants-gov:"),
      );
      const databaseLoans = catalog.filter(
        (program) => program.type === "LOAN" && program.source_url && program.last_verified_at,
      );
      const loansCount = databaseLoans.length || VERIFIED_LOAN_FALLBACK.filter((program) => isProgramAvailable(program)).length;
      const oneWeekAgo = Date.now() - 7 * 24 * 60 * 60 * 1000;
      const newlyCataloged = [...curatedGrants, ...databaseLoans].filter(
        (program) => new Date(program.created_at).getTime() >= oneWeekAgo,
      ).length;

      return {
        grants: (federalActive?.hitCount || 0) + curatedGrants.length,
        loans: loansCount,
        sources: sourcesResult.count || 0,
        newThisWeek: (federalNew?.hitCount || 0) + newlyCataloged,
      };
    },
    staleTime: 5 * 60 * 1000,
  });

  const stats = [
    { label: "Active grants", value: data?.grants, icon: Award },
    { label: "Loan programs", value: data?.loans, icon: DollarSign },
    { label: "Sources tracked", value: data?.sources, icon: Landmark },
    { label: "New this week", value: data?.newThisWeek, icon: TrendingUp },
  ];

  return (
    <section className="relative z-20 -mt-14 px-6 md:-mt-16">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, delay: 0.4 }}
        className="mx-auto grid max-w-5xl grid-cols-2 gap-3 rounded-2xl border border-border bg-card/95 p-3 shadow-xl backdrop-blur-sm md:grid-cols-4 md:gap-4 md:p-4"
      >
        {stats.map(({ label, value, icon: Icon }) => (
          <Card key={label} className="border-none bg-transparent p-3 shadow-none md:p-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-primary/10">
                <Icon className="h-5 w-5 text-primary" />
              </div>
              <div>
                <p className="text-xl font-bold leading-none md:text-2xl">
                  {value === undefined ? "—" : value.toLocaleString()}
                </p>
                <p className="mt-1 text-xs text-muted-foreground">{label}</p>
              </div>
            </div>
          </Card>
        ))}
      </motion.div>
    </section>
  );
};
