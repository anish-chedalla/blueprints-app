import { motion } from "framer-motion";

export const TrustRow = () => {
  const agencies = [
    { name: "SBA", tooltip: "Small Business Administration" },
    { name: "EDA", tooltip: "Economic Development Administration" },
    { name: "DOE", tooltip: "Department of Energy" },
    { name: "USDA", tooltip: "United States Department of Agriculture" },
    { name: "NASA", tooltip: "National Aeronautics and Space Administration" },
    { name: "NSF", tooltip: "National Science Foundation" },
  ];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, delay: 0.3 }}
      className="border-y border-border bg-muted/30 py-8"
    >
      <div className="container mx-auto px-6">
        <p className="text-center text-sm text-muted-foreground mb-6">
          We index official public notices from trusted agencies
        </p>
        <div className="flex flex-wrap justify-center items-center gap-8 md:gap-12">
          {agencies.map((agency, i) => (
            <motion.div
              key={agency.name}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.3, delay: 0.4 + i * 0.1 }}
              className="group relative"
            >
              <div className="text-2xl font-bold text-muted-foreground/60 group-hover:text-foreground transition-colors">
                {agency.name}
              </div>
              <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 bg-popover text-popover-foreground text-xs px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap pointer-events-none shadow-lg">
                {agency.tooltip}
              </div>
            </motion.div>
          ))}
        </div>
        <p className="text-center text-xs text-muted-foreground/70 mt-8">
          We are not affiliated with these agencies
        </p>
      </div>
    </motion.div>
  );
};
