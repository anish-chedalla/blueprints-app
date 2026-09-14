import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Search, BellRing } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="relative overflow-hidden bg-gradient-to-br from-primary/10 via-primary/5 to-background py-24">
      <motion.div
        className="absolute inset-0 opacity-30"
        animate={{
          backgroundPosition: ["0% 0%", "100% 100%"],
        }}
        transition={{
          duration: 20,
          repeat: Infinity,
          repeatType: "reverse",
        }}
        style={{
          backgroundImage:
            "linear-gradient(45deg, hsl(var(--primary) / 0.1) 25%, transparent 25%, transparent 75%, hsl(var(--primary) / 0.1) 75%, hsl(var(--primary) / 0.1)), linear-gradient(45deg, hsl(var(--primary) / 0.1) 25%, transparent 25%, transparent 75%, hsl(var(--primary) / 0.1) 75%, hsl(var(--primary) / 0.1))",
          backgroundSize: "60px 60px",
          backgroundPosition: "0 0, 30px 30px",
        }}
      />
      <div className="container relative z-10 mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-6 text-5xl font-bold">Ready to find funding that fits?</h2>
          <p className="mb-10 text-xl text-muted-foreground">
            Search official federal data and reviewed Arizona opportunities, save what matters,
            and set an alert so nothing slips past a deadline — all without a paywall.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8 py-6 text-lg">
              <Link to="/grants" className="flex items-center gap-2">
                <Search className="h-5 w-5" />
                Start searching
                <ArrowRight className="h-5 w-5" />
              </Link>
            </Button>
            <Button size="lg" variant="outline" asChild className="px-8 py-6 text-lg">
              <Link to="/grants" className="flex items-center gap-2">
                <BellRing className="h-5 w-5" />
                Create a funding alert
              </Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
