import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { Star } from "lucide-react";

export const SuccessSnapshots = () => {
  const snapshots = [
    {
      quote: "Awarded $50k equipment grant",
      detail: "Food manufacturing startup in Mesa",
    },
    {
      quote: "Matched to 3 export programs",
      detail: "Tech consultancy in Scottsdale",
    },
    {
      quote: "Saved 8 hours on forms",
      detail: "Family-owned retail in Tucson",
    },
  ];

  return (
    <section className="py-20 bg-background">
      <div className="container mx-auto px-6">
        <motion.h2
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
          className="text-4xl font-bold text-center mb-12"
        >
          Real results
        </motion.h2>
        <div className="grid md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {snapshots.map((snapshot, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 24, rotate: -2 }}
              whileInView={{ opacity: 1, y: 0, rotate: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.4, delay: i * 0.15 }}
            >
              <Card className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star
                      key={j}
                      className="w-4 h-4 fill-primary text-primary"
                    />
                  ))}
                </div>
                <p className="font-semibold text-lg mb-2">{snapshot.quote}</p>
                <p className="text-sm text-muted-foreground">
                  {snapshot.detail}
                </p>
              </Card>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
};
