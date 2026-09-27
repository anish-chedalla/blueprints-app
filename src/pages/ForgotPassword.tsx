import { useState } from "react";
import { AlertCircle, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appUrl } from "@/lib/github-pages";
import { getAuthErrorMessage, isAuthConnectivityError } from "@/lib/auth-errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { AuthHeader } from "@/components/AuthHeader";

export default function ForgotPassword() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (event: React.FormEvent) => {
    event.preventDefault();
    setLoading(true);
    setError("");

    const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: appUrl("reset-password"),
    });

    setLoading(false);
    if (resetError) {
      setError(isAuthConnectivityError(resetError)
        ? "The sign-in service is unavailable right now. Please try again shortly."
        : getAuthErrorMessage(resetError));
      return;
    }

    setSent(true);
  };

  return (
    <main className="min-h-screen bg-background px-5 py-5 text-foreground sm:px-8">
      <div className="mx-auto w-full max-w-6xl">
        <AuthHeader backTo="/auth" backLabel="Back to sign in" />
      </div>
      <div className="grid min-h-[calc(100vh-6rem)] place-items-center px-0 py-8">
      <section className="w-full max-w-md rounded-3xl border border-border bg-card p-6 text-card-foreground shadow-xl sm:p-8" aria-labelledby="forgot-title">
        <h1 id="forgot-title" className="text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-muted-foreground">
          Enter your account email and we'll send a secure password-reset link.
        </p>

        {sent ? (
          <Alert className="mt-6 border-success/30 bg-success/10 text-success">
            <CheckCircle2 className="h-4 w-4" />
            <AlertTitle>Check your email</AlertTitle>
            <AlertDescription>
              If an account exists for that address, a reset link is on its way. The link may take a few minutes to arrive.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit} className="mt-6 space-y-5">
            {error && (
              <Alert variant="destructive" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>We couldn't send the reset email</AlertTitle>
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="reset-email">Email address</Label>
              <Input id="reset-email" type="email" autoComplete="email" value={email} onChange={(event) => setEmail(event.target.value)} required disabled={loading} />
            </div>
            <Button type="submit" className="h-11 w-full" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? "Sending..." : "Send reset link"}
            </Button>
          </form>
        )}
      </section>
      </div>
    </main>
  );
}
