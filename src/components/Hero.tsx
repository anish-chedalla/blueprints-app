import { motion, useReducedMotion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, ShieldCheck } from "lucide-react";

export const Hero = () => {
  const shouldReduceMotion = useReducedMotion();
  const initial = shouldReduceMotion ? undefined : { opacity: 0, y: 16 };
  const animate = shouldReduceMotion ? undefined : { opacity: 1, y: 0 };

  return (
    <div className="relative overflow-hidden bg-background pb-20 pt-20 md:pb-28 md:pt-28">
      <div className="absolute -top-24 right-[-10%] h-[28rem] w-[28rem] rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-border bg-muted px-4 py-1.5"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-accent" />
          <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            Arizona Small Business Funding
          </span>
        </motion.div>

        <motion.h1
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-extrabold leading-[1.1] tracking-tight text-foreground sm:text-5xl md:text-6xl"
        >
          Find funding you can{" "}
          <span className="text-accent">actually pursue</span>
        </motion.h1>

        <motion.p
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground md:text-xl"
        >
          Live federal grants, reviewed Arizona programs, and vetted small-business
          loans in one place, with transparent eligibility checks.
        </motion.p>

        <motion.div
          initial={initial}
          animate={animate}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            asChild
            className="group h-14 px-8 text-base shadow-lg transition-all duration-300 hover:shadow-xl"
          >
            <Link to="/grants" className="flex items-center gap-2">
              Find grants & loans
              <ArrowRight className="h-4 w-4 transition-transform duration-300 group-hover:translate-x-1" />
            </Link>
          </Button>
          <Button
            size="lg"
            variant="outline"
            asChild
            className="h-14 px-8 text-base"
          >
            <Link to="/idea-lab" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Not sure where to start?
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
