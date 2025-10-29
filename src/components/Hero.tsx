import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";

export const Hero = () => {
  return (
    <div className="relative min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-primary via-primary/90 to-primary/80">
      {/* Animated map pins background */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="xMidYMid slice">
          <defs>
            <radialGradient id="pinGlow" cx="50%" cy="50%" r="50%">
              <stop offset="0%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0.3" />
              <stop offset="100%" stopColor="hsl(var(--primary-foreground))" stopOpacity="0" />
            </radialGradient>
          </defs>
          
          {/* Subtly scattered dots throughout */}
          {[
            { x: 15, y: 20, delay: 0 },
            { x: 25, y: 15, delay: 0.1 },
            { x: 35, y: 25, delay: 0.2 },
            { x: 12, y: 35, delay: 0.15 },
            { x: 22, y: 85, delay: 0.25 },
            { x: 8, y: 70, delay: 0.3 },
            { x: 45, y: 10, delay: 0.35 },
            { x: 55, y: 18, delay: 0.4 },
            { x: 48, y: 88, delay: 0.45 },
            { x: 65, y: 12, delay: 0.5 },
            { x: 75, y: 22, delay: 0.55 },
            { x: 70, y: 82, delay: 0.6 },
            { x: 85, y: 15, delay: 0.65 },
            { x: 92, y: 28, delay: 0.7 },
            { x: 88, y: 75, delay: 0.75 },
            { x: 18, y: 92, delay: 0.8 },
            { x: 42, y: 78, delay: 0.85 },
            { x: 62, y: 90, delay: 0.9 },
          ].map((pin, i) => (
            <motion.g
              key={`dot-${i}`}
              initial={{ opacity: 0, scale: 0 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ duration: 0.6, delay: pin.delay + 0.5 }}
            >
              <circle cx={`${pin.x}%`} cy={`${pin.y}%`} r="12" fill="url(#pinGlow)" />
              <circle cx={`${pin.x}%`} cy={`${pin.y}%`} r="2.5" fill="hsl(var(--primary-foreground))" opacity="0.4" />
            </motion.g>
          ))}
        </svg>
      </div>

      {/* Main content */}
      <div className="relative z-10 text-center px-6 max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.2 }}
          className="mb-4"
        >
          <span className="text-4xl md:text-5xl lg:text-6xl font-bold tracking-tight bg-gradient-to-r from-white via-blue-100 to-blue-400 bg-clip-text text-transparent drop-shadow-lg">
            Blueprints
          </span>
        </motion.div>
        <motion.h1
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-5xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6"
        >
          <span className="text-primary-foreground drop-shadow-lg animate-[glow_3s_ease-in-out_infinite] [text-shadow:_0_0_20px_rgba(255,255,255,0.3),_0_0_40px_rgba(255,255,255,0.2)] [-webkit-text-stroke:_0.5px_rgba(255,255,255,0.3)]">
            Your Ideas. Our Blueprints
          </span>
        </motion.h1>
        
        <motion.p
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          className="text-xl md:text-2xl text-primary-foreground/90 mb-12 max-w-2xl mx-auto font-light leading-relaxed drop-shadow-md"
        >
          One place to search federal and local grants, loans, and incentives
        </motion.p>
        
        {/* CTA Buttons */}
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.7 }}
          className="flex flex-col sm:flex-row justify-center gap-4"
        >
          <Button 
            size="lg" 
            asChild
            className="text-lg px-10 py-7 bg-background text-foreground hover:bg-background/90 hover:scale-105 transition-all duration-300 shadow-xl hover:shadow-2xl group"
          >
            <Link to="/grants" className="flex items-center gap-3">
              Find grants
              <ArrowRight className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-300" />
            </Link>
          </Button>
          <Button 
            size="lg" 
            variant="outline"
            asChild
            className="text-lg px-10 py-7 bg-transparent text-primary-foreground border-primary-foreground/30 hover:bg-primary-foreground/10 hover:border-primary-foreground transition-all duration-300"
          >
            <Link to="/grants?industry=true">
              Browse by industry
            </Link>
          </Button>
        </motion.div>
      </div>
    </div>
  );
};
