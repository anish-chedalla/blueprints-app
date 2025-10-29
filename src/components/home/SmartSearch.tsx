import { motion } from "framer-motion";
import { Search } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

export const SmartSearch = () => {
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();

  const chips = [
    "Veteran owned",
    "Women owned",
    "Rural",
    "Startup",
    "Nonprofit partner",
  ];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      navigate(`/grants?search=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleChipClick = (chip: string) => {
    navigate(`/grants?filter=${encodeURIComponent(chip)}`);
  };

  return (
    <section className="py-16 bg-background">
      <div className="container mx-auto px-6 max-w-4xl">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.4 }}
        >
          <h2 className="text-3xl font-bold text-center mb-4">
            Search by industry, location, or program name
          </h2>
          <div className="flex gap-2 mb-6">
            <Input
              type="text"
              placeholder="Try cafe Phoenix or SBIR energy"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
              className="flex-1 h-14 text-lg"
            />
            <Button size="lg" onClick={handleSearch} className="h-14 px-8">
              <Search className="w-5 h-5 mr-2" />
              Search
            </Button>
          </div>
          <div className="flex flex-wrap gap-2 justify-center">
            {chips.map((chip, i) => (
              <motion.div
                key={chip}
                initial={{ opacity: 0, x: -20 }}
                whileInView={{ opacity: 1, x: 0 }}
                viewport={{ once: true }}
                transition={{ duration: 0.3, delay: i * 0.1 }}
              >
                <Badge
                  variant="outline"
                  className="cursor-pointer hover:bg-muted transition-colors px-4 py-2 text-sm"
                  onClick={() => handleChipClick(chip)}
                >
                  {chip}
                </Badge>
              </motion.div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
};
