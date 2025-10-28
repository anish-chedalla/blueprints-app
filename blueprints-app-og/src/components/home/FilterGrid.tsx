import { motion } from "framer-motion";
import {
  Briefcase,
  MapPin,
  TrendingUp,
  Users,
  DollarSign,
  Award,
  Clock,
  HandCoins,
} from "lucide-react";

export const FilterGrid = () => {
  const filters = [
    { name: "Industry", icon: Briefcase },
    { name: "Location", icon: MapPin },
    { name: "Stage", icon: TrendingUp },
    { name: "Headcount", icon: Users },
    { name: "Revenue", icon: DollarSign },
    { name: "Ownership", icon: Award },
    { name: "Timeline", icon: Clock },
    { name: "Co-funding", icon: HandCoins },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-4">
            Filters that matter
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            Built for real businesses, not just researchers
          </p>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {filters.map((filter, i) => (
              <motion.div
                key={filter.name}
                initial={{ opacity: 0, rotateY: -90 }}
                whileInView={{ opacity: 1, rotateY: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.05 }}
                className="flex flex-col items-center gap-3 p-6 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <filter.icon className="w-8 h-8 text-primary" />
                <span className="text-sm font-medium text-center">
                  {filter.name}
                </span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
