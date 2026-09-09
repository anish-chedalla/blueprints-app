import { motion } from "framer-motion";
import { BellRing, Search } from "lucide-react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";

export const EmailCapture = () => (
  <section className="bg-primary/5 py-20">
    <div className="container mx-auto px-6">
      <motion.div
        initial={{ opacity: 0, y: 24 }}
        whileInView={{ opacity: 1, y: 0 }}
        viewport={{ once: true }}
        className="mx-auto max-w-2xl rounded-2xl border bg-card p-8 text-center shadow-sm"
      >
        <BellRing className="mx-auto mb-4 h-12 w-12 text-primary" />
        <h2 className="mb-4 text-4xl font-bold">Monitor a search you care about</h2>
        <p className="mb-7 text-muted-foreground">
          Search first, review the results, then save the exact criteria you want Blueprints to monitor. Email delivery is only enabled when you explicitly opt in.
        </p>
        <Button asChild size="lg"><Link to="/grants"><Search className="mr-2 h-5 w-5" />Create a grant alert</Link></Button>
      </motion.div>
    </div>
  </section>
);
