import { Hero } from "@/components/Hero";
import { Navbar } from "@/components/Navbar";
import { TrustRow } from "@/components/home/TrustRow";
import { SmartSearch } from "@/components/home/SmartSearch";
import { GrantTicker } from "@/components/home/GrantTicker";
import { ProblemOutcome } from "@/components/home/ProblemOutcome";
import { Steps } from "@/components/home/Steps";
import { LocalCoverage } from "@/components/home/LocalCoverage";
import { FilterGrid } from "@/components/home/FilterGrid";

import { EmailCapture } from "@/components/home/EmailCapture";
import { AssuranceRow } from "@/components/home/AssuranceRow";
import { FinalCTA } from "@/components/home/FinalCTA";
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";

const Footer = () => (
  <footer className="bg-muted/30 border-t border-border py-12">
    <div className="container mx-auto px-6">
      <div className="grid md:grid-cols-4 gap-8 mb-8">
        <div>
          <h3 className="font-semibold mb-4">About</h3>
          <p className="text-sm text-muted-foreground">
            Blueprints helps small businesses find funding opportunities.
          </p>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Programs</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/grants" className="hover:text-foreground">Grants</Link></li>
            <li><Link to="/loans" className="hover:text-foreground">Loans</Link></li>
            <li><Link to="/licensing" className="hover:text-foreground">Licensing</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="font-semibold mb-4">Tools</h3>
          <ul className="space-y-2 text-sm text-muted-foreground">
            <li><Link to="/assistant" className="hover:text-foreground">AI Assistant</Link></li>
            <li><Link to="/saved" className="hover:text-foreground">Saved</Link></li>
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
        <p>© 2025 Blueprints. All rights reserved.</p>
      </div>
    </div>
  </footer>
);

export default function Home() {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <Hero />
      <TrustRow />
      <SmartSearch />
      <GrantTicker />
      <ProblemOutcome />
      <Steps />
      <LocalCoverage />
      <FilterGrid />
      <EmailCapture />
      <AssuranceRow />
      <FinalCTA />
      <Footer />
    </div>
  );
}
