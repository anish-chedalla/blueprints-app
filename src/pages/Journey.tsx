import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { getJourneyStatus, JOURNEY_STEPS, type JourneyStatus } from "@/lib/journey";
import { ArrowRight, CheckCircle2, Circle, Compass } from "lucide-react";

export default function Journey() {
  const navigate = useNavigate();
  const [status, setStatus] = useState<JourneyStatus | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) { navigate("/auth"); return; }
      const result = await getJourneyStatus(session.user.id, session.user.last_sign_in_at ?? null);
      setStatus(result);
      setLoading(false);
    };
    void load();
  }, [navigate]);

  if (loading || !status) {
    return <DashboardLayout><div className="p-12 text-center text-muted-foreground">Loading your journey…</div></DashboardLayout>;
  }

  return (
    <DashboardLayout>
      <div className="container mx-auto max-w-3xl px-4 py-12">
        <div className="mb-8 flex items-center gap-3">
          <Compass className="h-8 w-8 text-primary" />
          <div>
            <h1 className="text-3xl font-bold">Your setup journey</h1>
            <p className="text-muted-foreground">Finish these steps to build out your business blueprint.</p>
          </div>
        </div>

        <div className="mb-8">
          <div className="mb-2 flex items-center justify-between text-sm text-muted-foreground">
            <span>{status.completedCount} of {status.totalCount} steps complete</span>
          </div>
          <div className="h-2 w-full overflow-hidden rounded-full bg-secondary">
            <div className="h-full bg-primary transition-all duration-300" style={{ width: `${(status.completedCount / status.totalCount) * 100}%` }} />
          </div>
        </div>

        <div className="space-y-4">
          {JOURNEY_STEPS.map((step, index) => {
            const stepStatus = status.steps.find((item) => item.key === step.key);
            const completed = Boolean(stepStatus?.completed);
            return (
              <Card key={step.key} className={completed ? "border-success/30 bg-success/5" : ""}>
                <CardHeader>
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-3">
                      {completed ? <CheckCircle2 className="mt-1 h-5 w-5 shrink-0 text-success" /> : <Circle className="mt-1 h-5 w-5 shrink-0 text-muted-foreground" />}
                      <div>
                        <CardTitle className="text-lg">{index + 1}. {step.title}</CardTitle>
                        <CardDescription className="mt-1">{step.description}</CardDescription>
                      </div>
                    </div>
                    <Button asChild variant={completed ? "outline" : "default"} size="sm" className="shrink-0">
                      <Link to={step.href}>{completed ? "Review" : step.cta}<ArrowRight className="ml-2 h-4 w-4" /></Link>
                    </Button>
                  </div>
                </CardHeader>
              </Card>
            );
          })}
        </div>

        {status.isComplete && (
          <Card className="mt-8 border-primary/30 bg-primary/5">
            <CardContent className="flex flex-wrap items-center justify-between gap-4 pt-6">
              <div>
                <h2 className="text-xl font-semibold">You're all set up!</h2>
                <p className="text-muted-foreground">Your blueprint is ready to view.</p>
              </div>
              <Button asChild size="lg"><Link to="/blueprint">View your Blueprint<ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
