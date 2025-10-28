import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Search } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="py-24 bg-gradient-to-br from-primary/10 via-primary/5 to-background relative overflow-hidden">
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
      <div className="container mx-auto px-6 relative z-10">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-center max-w-3xl mx-auto"
        >
          <h2 className="text-5xl font-bold mb-6">
            Start your funding search
          </h2>
          <p className="text-xl text-muted-foreground mb-10">
            Join thousands of small businesses finding the right opportunities
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" asChild className="text-lg px-8 py-6">
              <Link to="/grants" className="flex items-center gap-2">
                <Search className="w-5 h-5" />
                Find grants
                <ArrowRight className="w-5 h-5" />
              </Link>
            </Button>
            <Button
              size="lg"
              variant="outline"
              asChild
              className="text-lg px-8 py-6"
            >
              <Link to="/grants?sample=true">See sample results</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    </section>
  );
};
