import { motion } from "framer-motion";
import { MapPin } from "lucide-react";

export const LocalCoverage = () => {
  const sources = [
    "AZ Commerce Authority",
    "AZ Commission on the Arts",
    "AZ Department of Administration",
    "AZ Department of Agriculture",
    "AZ Office of Economic Opportunity",
    "AZ Registrar of Contractors",
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="max-w-4xl mx-auto"
        >
          <h2 className="text-4xl font-bold text-center mb-4">
            Extra coverage for Arizona
          </h2>
          <p className="text-center text-muted-foreground mb-12">
            We review official state and local pages and show exactly when each record was checked
          </p>
          <div className="grid md:grid-cols-3 gap-4">
            {sources.map((source, i) => (
              <motion.div
                key={source}
                initial={{ opacity: 0, scale: 0.9 }}
                whileInView={{ opacity: 1, scale: 1 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
                className="flex items-center gap-3 p-4 rounded-lg border border-border bg-card hover:bg-muted/50 transition-colors"
              >
                <MapPin className="w-5 h-5 text-primary shrink-0" />
                <span className="text-sm font-medium">{source}</span>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
