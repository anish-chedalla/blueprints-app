import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight, BellRing } from "lucide-react";

export const FinalCTA = () => {
  return (
    <section className="bg-muted/30 py-24">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto max-w-3xl text-center"
        >
          <h2 className="mb-6 text-4xl font-bold md:text-5xl">Ready to find funding that fits?</h2>
          <p className="mb-10 text-xl text-muted-foreground">
            Search official federal data and reviewed Arizona opportunities, save what matters,
            and set an alert so nothing slips past a deadline.
          </p>
          <div className="flex flex-col justify-center gap-4 sm:flex-row">
            <Button size="lg" asChild className="px-8 py-6 text-lg">
              <Link to="/grants" className="flex items-center gap-2">
                Find grants & loans
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
