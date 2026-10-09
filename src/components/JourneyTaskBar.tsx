import { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";
import { getJourneyStatus, JOURNEY_STEPS, type JourneyStepDefinition } from "@/lib/journey";
import { onJourneyUpdated } from "@/lib/journeyEvents";
import { hasSeenGoal, markGoalSeen, hasCelebrated, markCelebrated } from "@/lib/tour-state";
import { cn } from "@/lib/utils";
import { CheckCircle2, Compass, HelpCircle } from "lucide-react";

type ExternalStepKey = Exclude<JourneyStepDefinition["key"], "business" | "location" | "industry">;

interface Props {
  stepKey: ExternalStepKey;
}

export function JourneyTaskBar({ stepKey }: Props) {
  const [loaded, setLoaded] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [justCompleted, setJustCompleted] = useState(false);
  const [showGoalDialog, setShowGoalDialog] = useState(false);
  const wasCompletedRef = useRef<boolean | null>(null);

  const step = JOURNEY_STEPS.find((item) => item.key === stepKey)!;
  const stepNumber = JOURNEY_STEPS.findIndex((item) => item.key === stepKey) + 1;

  const refresh = useCallback(async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;
    const status = await getJourneyStatus(session.user.id, session.user.last_sign_in_at ?? null);
    const nowCompleted = Boolean(status.steps.find((item) => item.key === stepKey)?.completed);

    if (wasCompletedRef.current === false && nowCompleted && !hasCelebrated(stepKey)) {
      setJustCompleted(true);
      markCelebrated(stepKey);
    }
    wasCompletedRef.current = nowCompleted;
    setCompleted(nowCompleted);

    if (!nowCompleted && !hasSeenGoal(stepKey)) {
      setShowGoalDialog(true);
      markGoalSeen(stepKey);
    }
    setLoaded(true);
  }, [stepKey]);

  useEffect(() => {
    void refresh();
    return onJourneyUpdated(() => void refresh());
  }, [refresh]);

  if (!loaded) return null;

  return (
    <>
      <Dialog open={showGoalDialog} onOpenChange={setShowGoalDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Task {stepNumber} goal: {step.title}</DialogTitle>
            <DialogDescription>{step.description}</DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button onClick={() => setShowGoalDialog(false)}>Got it</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <div className={cn(
        "mb-6 flex flex-wrap items-center justify-between gap-3 rounded-lg border px-4 py-3",
        justCompleted ? "border-success/30 bg-success/5" : completed ? "bg-muted/30" : "border-primary/30 bg-primary/5",
      )}>
        <div className="flex items-center gap-2 text-sm">
          {justCompleted ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-success" />
          ) : completed ? (
            <CheckCircle2 className="h-4 w-4 shrink-0 text-muted-foreground" />
          ) : (
            <Compass className="h-4 w-4 shrink-0 text-primary" />
          )}
          <span>
            {justCompleted
              ? `Task ${stepNumber} complete! You finished "${step.title}".`
              : completed
                ? `Journey step ${stepNumber} of ${JOURNEY_STEPS.length} is done.`
                : `Journey step ${stepNumber} of ${JOURNEY_STEPS.length}: ${step.title}.`}
          </span>
          {!completed && (
            <button type="button" className="inline-flex items-center gap-1 text-xs text-muted-foreground underline underline-offset-2 hover:text-foreground" onClick={() => setShowGoalDialog(true)}>
              <HelpCircle className="h-3 w-3" />Show goal
            </button>
          )}
        </div>
        <div className="flex gap-2">
          {justCompleted && (
            <Button size="sm" variant="outline" onClick={() => setJustCompleted(false)}>Continue exploring</Button>
          )}
          <Button size="sm" variant={justCompleted ? "default" : "outline"} asChild>
            <Link to="/journey">Back to Journey</Link>
          </Button>
        </div>
      </div>
    </>
  );
}
