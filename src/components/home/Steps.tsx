import { motion } from "framer-motion";
import { Search, CheckCircle, ClipboardList } from "lucide-react";

export const Steps = () => {
  const steps = [
    {
      number: 1,
      title: "Search",
      copy: "Type what you do and where you operate.",
      icon: Search,
    },
    {
      number: 2,
      title: "Match",
      copy: "Get a shortlist with eligibility and deadlines.",
      icon: CheckCircle,
    },
    {
      number: 3,
      title: "Track",
      copy: "Save strong candidates, set reminders, and continue on the official source.",
      icon: ClipboardList,
    },
  ];

  return (
    <section className="py-20 bg-muted/30">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-bold text-center mb-16"
        >
          How it works
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {steps.map((step, i) => (
            <motion.div
              key={step.number}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mb-6 flex justify-center">
                <div className="relative flex h-20 w-20 items-center justify-center rounded-full bg-primary/10">
                  <step.icon className="h-10 w-10 text-primary" />
                  <span className="absolute -right-1 -top-1 flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-semibold text-accent-foreground">
                    {step.number}
                  </span>
                </div>
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-muted-foreground">{step.copy}</p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
