import { motion } from "framer-motion";
import { Shield, Calendar, Link } from "lucide-react";

export const AssuranceRow = () => {
  const assurances = [
    {
      icon: Shield,
      title: "Funder-owned records",
      description: "Every listing points to an official agency or funder page",
    },
    {
      icon: Calendar,
      title: "Visible verification dates",
      description: "Live API records and reviewed sources are clearly labeled",
    },
    {
      icon: Link,
      title: "No sponsored ranking",
      description: "Fit scores come from your profile, never referral payments",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
          {assurances.map((item, i) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
              className="text-center"
            >
              <div className="mb-4 flex justify-center">
                <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center">
                  <item.icon className="w-8 h-8 text-primary" />
                </div>
              </div>
              <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
              <p className="text-muted-foreground text-sm">
                {item.description}
              </p>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
