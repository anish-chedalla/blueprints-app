import { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, Building2, CheckCircle2, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { appUrl } from "@/lib/github-pages";
import { getAuthErrorMessage, isAuthConnectivityError } from "@/lib/auth-errors";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

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
    <main className="grid min-h-screen place-items-center bg-slate-950 px-5 py-12 text-white">
      <section className="w-full max-w-md rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl sm:p-8" aria-labelledby="forgot-title">
        <Link to="/" className="mb-8 inline-flex items-center gap-2 font-semibold text-slate-900">
          <Building2 className="h-5 w-5 text-sky-700" /> Blueprints
        </Link>
        <h1 id="forgot-title" className="text-3xl font-semibold tracking-tight">Reset your password</h1>
        <p className="mt-2 text-sm leading-6 text-slate-600">
          Enter your account email and we’ll send a secure password-reset link.
        </p>

        {sent ? (
          <Alert className="mt-6 border-emerald-200 bg-emerald-50 text-emerald-950">
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
                <AlertTitle>We couldn’t send the reset email</AlertTitle>
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

        <Button asChild variant="ghost" className="mt-6 w-full">
          <Link to="/auth"><ArrowLeft className="mr-2 h-4 w-4" />Back to sign in</Link>
        </Button>
      </section>
    </main>
  );
}
