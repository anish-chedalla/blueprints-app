import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, Lightbulb, Radio, ShieldCheck, CheckCircle2, Coins } from "lucide-react";

const trustPoints = [
  { icon: Radio, label: "Live Grants.gov data" },
  { icon: CheckCircle2, label: "Transparent eligibility checks" },
  { icon: Coins, label: "Free, no paywall" },
];

export const Hero = () => {
  return (
    <div className="relative overflow-hidden bg-gradient-to-b from-primary via-primary to-primary/90 pb-28 pt-24 md:pb-36 md:pt-32">
      <div className="absolute inset-0 bg-grid-pattern opacity-40" />
      <div className="absolute -top-32 left-1/2 h-[32rem] w-[32rem] -translate-x-1/2 rounded-full bg-accent/20 blur-3xl" />

      <div className="relative z-10 mx-auto max-w-4xl px-6 text-center">
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="mb-6 inline-flex items-center gap-2 rounded-full border border-primary-foreground/20 bg-primary-foreground/10 px-4 py-1.5 backdrop-blur-sm"
        >
          <ShieldCheck className="h-3.5 w-3.5 text-primary-foreground" />
          <span className="text-xs font-medium uppercase tracking-wide text-primary-foreground/90">
            Arizona Small Business Funding
          </span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.1 }}
          className="text-4xl font-extrabold leading-[1.1] tracking-tight text-primary-foreground sm:text-5xl md:text-6xl"
        >
          Find funding you can{" "}
          <span className="bg-gradient-to-r from-accent to-blue-300 bg-clip-text text-transparent">
            actually pursue
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.2 }}
          className="mx-auto mt-6 max-w-2xl text-lg text-primary-foreground/80 md:text-xl"
        >
          Live federal grants, reviewed Arizona programs, and vetted small-business
          loans in one place — with transparent eligibility checks so you know why
          a program fits.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, delay: 0.3 }}
          className="mt-10 flex flex-col justify-center gap-4 sm:flex-row"
        >
          <Button
            size="lg"
            asChild
            className="group h-14 bg-background px-8 text-base text-foreground shadow-xl transition-all duration-300 hover:bg-background/90 hover:shadow-2xl"
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
            className="h-14 border-primary-foreground/30 bg-transparent px-8 text-base text-primary-foreground hover:bg-primary-foreground/10 hover:border-primary-foreground"
          >
            <Link to="/idea-lab" className="flex items-center gap-2">
              <Lightbulb className="h-4 w-4" />
              Not sure where to start?
            </Link>
          </Button>
        </motion.div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.5, delay: 0.5 }}
          className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-3"
        >
          {trustPoints.map(({ icon: Icon, label }) => (
            <div key={label} className="flex items-center gap-2 text-sm text-primary-foreground/70">
              <Icon className="h-4 w-4" />
              {label}
            </div>
          ))}
        </motion.div>
      </div>
    </div>
  );
};
