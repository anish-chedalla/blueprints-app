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
      title: "Apply",
      copy: "We give checklists, forms, and reminders.",
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
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center">
                  <step.icon className="w-10 h-10 text-primary" />
                </div>
              </div>
              <div className="text-sm font-semibold text-primary mb-2">
                Step {step.number}
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
