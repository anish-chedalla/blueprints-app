import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { dismissJourneyBanner, getJourneyStatus } from "@/lib/journey";
import { Compass, X } from "lucide-react";

export function JourneyBanner() {
  const [userId, setUserId] = useState<string | null>(null);
  const [visible, setVisible] = useState(false);
  const [completedCount, setCompletedCount] = useState(0);
  const [totalCount, setTotalCount] = useState(4);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      const status = await getJourneyStatus(session.user.id, session.user.last_sign_in_at ?? null);
      setUserId(session.user.id);
      setCompletedCount(status.completedCount);
      setTotalCount(status.totalCount);
      setVisible(status.showBanner);
    };
    void load();
  }, []);

  if (!visible) return null;

  const dismiss = () => {
    setVisible(false);
    if (userId) void dismissJourneyBanner(userId);
  };

  return (
    <Alert className="mb-6 flex items-start justify-between gap-4 border-primary/30 bg-primary/5">
      <div className="flex items-start gap-3">
        <Compass className="mt-0.5 h-4 w-4 text-primary" />
        <div>
          <AlertTitle>Finish setting up your business</AlertTitle>
          <AlertDescription>{completedCount} of {totalCount} journey steps complete.</AlertDescription>
        </div>
      </div>
      <div className="flex shrink-0 items-center gap-2">
        <Button asChild size="sm"><Link to="/journey">Continue</Link></Button>
        <Button size="icon" variant="ghost" onClick={dismiss} aria-label="Dismiss reminder"><X className="h-4 w-4" /></Button>
      </div>
    </Alert>
  );
}
