import { supabase } from "@/integrations/supabase/client";

export interface JourneyStepDefinition {
  key: "funding" | "licensing" | "pipeline" | "blueprint";
  title: string;
  description: string;
  href: string;
  cta: string;
}

export const JOURNEY_STEPS: JourneyStepDefinition[] = [
  {
    key: "funding",
    title: "Explore & save funding",
    description: "Browse grants and loans matched to your business and save at least one to your plan.",
    href: "/grants",
    cta: "Find grants & loans",
  },
  {
    key: "licensing",
    title: "Review your compliance checklist",
    description: "Generate your personalized licensing and permit checklist for your city and industry.",
    href: "/licensing",
    cta: "Check requirements",
  },
  {
    key: "pipeline",
    title: "Build your funding pipeline",
    description: "Move at least one saved grant or loan forward, like marking it as researching or applying.",
    href: "/saved",
    cta: "Manage your pipeline",
  },
  {
    key: "blueprint",
    title: "View your Blueprint",
    description: "See your business profile, funding pipeline, and compliance checklist in one place.",
    href: "/blueprint",
    cta: "View Blueprint",
  },
];

export interface JourneyStepStatus {
  key: JourneyStepDefinition["key"];
  completed: boolean;
}

export interface JourneyStatus {
  steps: JourneyStepStatus[];
  completedCount: number;
  totalCount: number;
  isComplete: boolean;
  showBanner: boolean;
}

export async function getJourneyStatus(userId: string, lastSignInAt: string | null): Promise<JourneyStatus> {
  const [savedResult, pipelineResult, licensingResult, progressResult] = await Promise.all([
    supabase.from("saved_opportunities").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("saved_opportunities").select("id", { count: "exact", head: true }).eq("user_id", userId).neq("pipeline_status", "saved"),
    supabase.from("licensing_checklist_state").select("id", { count: "exact", head: true }).eq("user_id", userId),
    supabase.from("journey_progress").select("*").eq("user_id", userId).maybeSingle(),
  ]);

  const progress = progressResult.data;

  const steps: JourneyStepStatus[] = [
    { key: "funding", completed: (savedResult.count || 0) > 0 },
    { key: "licensing", completed: (licensingResult.count || 0) > 0 },
    { key: "pipeline", completed: (pipelineResult.count || 0) > 0 },
    { key: "blueprint", completed: Boolean(progress?.blueprint_viewed_at) },
  ];

  const completedCount = steps.filter((step) => step.completed).length;
  const totalCount = steps.length;
  const isComplete = completedCount === totalCount;

  if (isComplete && !progress?.completed_at) {
    await supabase.from("journey_progress").upsert({ user_id: userId, completed_at: new Date().toISOString() }, { onConflict: "user_id" });
  }

  const bannerDismissedAt = progress?.banner_dismissed_at;
  const showBanner = !isComplete && (!bannerDismissedAt || !lastSignInAt || bannerDismissedAt < lastSignInAt);

  return { steps, completedCount, totalCount, isComplete, showBanner };
}

export async function markBlueprintViewed(userId: string): Promise<void> {
  const { data: progress } = await supabase.from("journey_progress").select("blueprint_viewed_at").eq("user_id", userId).maybeSingle();
  if (progress?.blueprint_viewed_at) return;
  await supabase.from("journey_progress").upsert({ user_id: userId, blueprint_viewed_at: new Date().toISOString() }, { onConflict: "user_id" });
}

export async function dismissJourneyBanner(userId: string): Promise<void> {
  await supabase.from("journey_progress").upsert({ user_id: userId, banner_dismissed_at: new Date().toISOString() }, { onConflict: "user_id" });
}
