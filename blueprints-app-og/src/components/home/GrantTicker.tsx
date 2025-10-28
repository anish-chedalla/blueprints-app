import { motion } from "framer-motion";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Card } from "@/components/ui/card";
import { format } from "date-fns";

export const GrantTicker = () => {
  const { data: grants } = useQuery({
    queryKey: ["recent-grants"],
    queryFn: async () => {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { data, error } = await supabase
        .from("programs")
        .select("*")
        .eq("type", "GRANT")
        .gte("created_at", sevenDaysAgo.toISOString())
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) throw error;
      return data;
    },
  });

  if (!grants || grants.length === 0) return null;

  return (
    <section className="py-16 bg-muted/30 overflow-hidden">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-3xl font-bold text-center mb-8"
        >
          New opportunities posted in the last 7 days
        </motion.h2>
        <motion.div
          initial={{ opacity: 0 }}
          whileInView={{ opacity: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide"
        >
          {grants.map((grant, i) => (
            <motion.div
              key={grant.id}
              initial={{ opacity: 0, x: 50 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
              whileHover={{ scale: 1.02 }}
            >
              <Card className="min-w-[320px] p-4 hover:shadow-lg transition-shadow">
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">
                  {grant.name}
                </h3>
                <p className="text-xs text-muted-foreground mb-2">
                  {grant.sponsor}
                </p>
                {grant.deadline && (
                  <p className="text-xs text-muted-foreground mb-3">
                    Closes: {format(new Date(grant.deadline), "MMM d, yyyy")}
                  </p>
                )}
                <div className="flex gap-2 flex-wrap">
                  <Badge variant="secondary" className="text-xs">
                    {grant.type}
                  </Badge>
                  {grant.level && (
                    <Badge variant="outline" className="text-xs">
                      {grant.level}
                    </Badge>
                  )}
                </div>
              </Card>
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
};
