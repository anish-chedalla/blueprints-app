import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Lightbulb, BellRing, History, ArrowRight } from "lucide-react";

const features = [
  {
    icon: Lightbulb,
    title: "Idea Lab",
    description: "Not sure where to start? Describe your business and get matched to relevant funding categories.",
    href: "/idea-lab",
    cta: "Explore Idea Lab",
  },
  {
    icon: BellRing,
    title: "Saved funding & alerts",
    description: "Track opportunities you care about and get optional reminders before deadlines pass.",
    href: "/saved",
    cta: "View saved funding",
  },
  {
    icon: History,
    title: "Application history",
    description: "Keep a private record of every program you've reviewed, so nothing slips through.",
    href: "/history",
    cta: "See your history",
  },
];

export const FeatureHighlights = () => {
  return (
    <section className="bg-background py-20">
      <div className="container mx-auto px-6">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="mx-auto mb-12 max-w-2xl text-center"
        >
          <h2 className="mb-4 text-4xl font-bold">More than a search bar</h2>
          <p className="text-muted-foreground">
            Tools that help you go from "what's out there" to "what I'm actually applying for."
          </p>
        </motion.div>

        <div className="grid gap-6 md:grid-cols-3">
          {features.map((feature, i) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.1 }}
            >
              <Link
                to={feature.href}
                className="group flex h-full flex-col rounded-xl border border-border bg-card p-6 transition-all duration-300 hover:-translate-y-1 hover:border-primary/40 hover:shadow-lg"
              >
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="mb-2 font-semibold">{feature.title}</h3>
                <p className="mb-4 flex-1 text-sm text-muted-foreground">{feature.description}</p>
                <span className="flex items-center gap-1 text-sm font-medium text-primary">
                  {feature.cta}
                  <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                </span>
              </Link>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
