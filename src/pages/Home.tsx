import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { StatsStrip } from "@/components/home/StatsStrip";
import { SmartSearch } from "@/components/home/SmartSearch";
import { GrantTicker } from "@/components/home/GrantTicker";
import { ProblemOutcome } from "@/components/home/ProblemOutcome";
import { Steps } from "@/components/home/Steps";
import { CoverageSection } from "@/components/home/CoverageSection";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { AssuranceRow } from "@/components/home/AssuranceRow";
import { FinalCTA } from "@/components/home/FinalCTA";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-muted/30 border-t border-border py-12">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-4">About</h3>
          <p className="text-sm text-muted-foreground">
            Blueprints helps Arizona small businesses find funding they can actually pursue —
            live federal grants, reviewed local programs, and vetted loans in one place.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Find funding</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/grants" className="hover:text-foreground">Grants</Link></li>
            <li><Link to="/loans" className="hover:text-foreground">Loans</Link></li>
            <li><Link to="/idea-lab" className="hover:text-foreground">Idea Lab</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Tools</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/assistant" className="hover:text-foreground">AI Assistant</Link></li>
            <li><Link to="/saved" className="hover:text-foreground">Saved Funding</Link></li>
            <li><Link to="/history" className="hover:text-foreground">History</Link></li>
            <li><Link to="/dashboard" className="hover:text-foreground">Dashboard</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Legal</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><a href="#" className="hover:text-foreground">Privacy</a></li>
            <li><a href="#" className="hover:text-foreground">Terms</a></li>
            <li><a href="#" className="hover:text-foreground">Contact</a></li>
          </ul>
        </div>
      </div>
      <div className="pt-8 border-t border-border text-center text-sm text-muted-foreground">
        <p>© {new Date().getFullYear()} Blueprints. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <StatsStrip />
      <SmartSearch />
      <GrantTicker />
      <ProblemOutcome />
      <Steps />
      <CoverageSection />
      <FeatureHighlights />
      <AssuranceRow />
      <FinalCTA />
      <Footer />
    </div>
  );
}
