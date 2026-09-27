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

        <div className="grid gap-6 md:grid-cols-2">
          {features.map((feature, i) => {
            const featured = i === 0;
            return (
              <motion.div
                key={feature.title}
                initial={{ opacity: 0, y: 24 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.4, delay: i * 0.1 }}
                className={featured ? "md:col-span-2" : ""}
              >
                <Link
                  to={feature.href}
                  className={`group flex h-full flex-col rounded-xl border p-6 transition-all duration-300 hover:-translate-y-1 hover:shadow-lg ${
                    featured
                      ? "border-accent/20 bg-accent/5 hover:border-accent/40 md:flex-row md:items-center md:gap-8 md:p-8"
                      : "border-border bg-card hover:border-primary/40"
                  }`}
                >
                  <div className={`mb-4 flex h-12 w-12 shrink-0 items-center justify-center rounded-lg ${featured ? "bg-accent/15" : "bg-primary/10"} ${featured ? "md:mb-0" : ""}`}>
                    <feature.icon className={`h-6 w-6 ${featured ? "text-accent" : "text-primary"}`} />
                  </div>
                  <div className="flex-1">
                    <h3 className={featured ? "mb-2 text-lg font-semibold" : "mb-2 font-semibold"}>{feature.title}</h3>
                    <p className="mb-4 text-sm text-muted-foreground md:mb-0">{feature.description}</p>
                  </div>
                  <span className={`flex shrink-0 items-center gap-1 text-sm font-medium ${featured ? "text-accent" : "text-primary"}`}>
                    {feature.cta}
                    <ArrowRight className="h-3.5 w-3.5 transition-transform duration-300 group-hover:translate-x-1" />
                  </span>
                </Link>
              </motion.div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
