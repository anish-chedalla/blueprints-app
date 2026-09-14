import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { Radio, CheckCircle2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";

// Shown only if the live source registry has no rows yet, so the section
// never regresses to a blank state.
const FALLBACK_SOURCES = {
  automated: ["Grants.gov", "SBA", "USDA", "Department of Energy", "NSF", "NASA", "EDA", "SBIR.gov"],
  reviewed: [
    "AZ Commerce Authority",
    "AZ Office of Economic Opportunity",
    "AZ Department of Agriculture",
    "AZ Commission on the Arts",
    "AZ Department of Administration",
    "AZ Registrar of Contractors",
  ],
};

export const CoverageSection = () => {
  const { data, isLoading } = useQuery({
    queryKey: ["coverage-sources"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("grant_sources")
        .select("*")
        .order("automated", { ascending: false })
        .order("name");
      if (error) throw error;
      return data;
    },
    staleTime: 30 * 60 * 1000,
  });

  const hasLiveData = !isLoading && (data?.length ?? 0) > 0;
  const automatedNames = hasLiveData ? data!.filter((s) => s.automated).map((s) => s.name) : FALLBACK_SOURCES.automated;
  const reviewedNames = hasLiveData ? data!.filter((s) => !s.automated).map((s) => s.name) : FALLBACK_SOURCES.reviewed;

  const columns = [
    {
      title: "Live automated sources",
      description: "Pulled directly from official APIs and refreshed continuously.",
      icon: Radio,
      names: automatedNames,
    },
    {
      title: "Reviewed & verified sources",
      description: "Manually checked pages, with a visible last-reviewed date.",
      icon: CheckCircle2,
      names: reviewedNames,
    },
  ];

  return (
    <section className="bg-muted/30 py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-4xl"
        >
          <h2 className="mb-4 text-center text-4xl font-bold">What we cover</h2>
          <p className="mb-12 text-center text-muted-foreground">
            Federal agencies via live public APIs, plus Arizona state and local programs we review
            by hand and re-check on a schedule.
          </p>

          <div className="grid gap-8 md:grid-cols-2">
            {columns.map((column, colIndex) => (
              <motion.div
                key={column.title}
                initial={{ opacity: 0, y: 16 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: colIndex * 0.1 }}
                className="rounded-xl border border-border bg-card p-6"
              >
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                    <column.icon className="h-5 w-5 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-semibold">{column.title}</h3>
                    <p className="text-xs text-muted-foreground">{column.description}</p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  {column.names.map((name) => (
                    <Badge key={name} variant="outline" className="px-3 py-1 text-xs">
                      {name}
                    </Badge>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>

          <p className="mt-8 text-center text-xs text-muted-foreground/70">
            We are not affiliated with these agencies — Blueprints independently indexes and
            reviews their public funding notices.
          </p>
        </motion.div>
      </div>
    </section>
  );
};
