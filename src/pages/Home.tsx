import { Hero } from "@/components/Hero";
import { PublicLayout } from "@/components/PublicLayout";
import { StatsStrip } from "@/components/home/StatsStrip";
import { SmartSearch } from "@/components/home/SmartSearch";
import { GrantTicker } from "@/components/home/GrantTicker";
import { ProblemOutcome } from "@/components/home/ProblemOutcome";
import { Steps } from "@/components/home/Steps";
import { CoverageSection } from "@/components/home/CoverageSection";
import { FeatureHighlights } from "@/components/home/FeatureHighlights";
import { AssuranceRow } from "@/components/home/AssuranceRow";
import { FinalCTA } from "@/components/home/FinalCTA";

export default function Home() {
  return (
    <PublicLayout>
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
    </PublicLayout>
  );
}
