import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { toast } from "sonner";
import {
  AlertCircle,
  ArrowLeft,
  BookmarkCheck,
  Building2,
  Eye,
  EyeOff,
  Loader2,
  Search,
  ShieldCheck,
} from "lucide-react";
import { appUrl } from "@/lib/github-pages";
import { getAuthErrorMessage, isAuthConnectivityError } from "@/lib/auth-errors";

async function checkProfileComplete(userId: string) {
  const { data } = await supabase
    .from("profiles")
    .select("business_name")
    .eq("user_id", userId)
    .single();

  return Boolean(data?.business_name);
}

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [authError, setAuthError] = useState("");
  const [hasConnectivityError, setHasConnectivityError] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const redirecting = useRef(false);

  const requestedPath = useMemo(() => {
    const queryPath = new URLSearchParams(location.search).get("next");
    const statePath = typeof location.state?.from === "string" ? location.state.from : null;
    const candidate = queryPath || statePath;
    return candidate?.startsWith("/") && !candidate.startsWith("//") ? candidate : "/dashboard";
  }, [location.search, location.state]);

  const finishSignIn = useCallback(async (userId: string) => {
    if (redirecting.current) return;
    redirecting.current = true;
    const isProfileComplete = await checkProfileComplete(userId);
    navigate(isProfileComplete ? requestedPath : "/onboarding", { replace: true });
  }, [navigate, requestedPath]);

  useEffect(() => {
    let active = true;

    void supabase.auth.getSession().then(({ data }) => {
      if (active && data.session) void finishSignIn(data.session.user.id);
    });

    const { data: listener } = supabase.auth.onAuthStateChange((event, session) => {
      if (active && session && (event === "SIGNED_IN" || event === "INITIAL_SESSION")) {
        void finishSignIn(session.user.id);
      }
    });

    return () => {
      active = false;
      listener.subscription.unsubscribe();
    };
  }, [finishSignIn]);

  const handleAuth = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setAuthError("");
    setHasConnectivityError(false);

    try {
      if (isSignUp) {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: appUrl("onboarding"),
          },
        });
        if (error) throw error;

        if (data.session) {
          toast.success("Account created successfully");
          navigate("/onboarding", { replace: true });
          return;
        }

        toast.success("Check your email to confirm your account, then sign in.");
        setPassword("");
        setIsSignUp(false);
      } else {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        
        toast.success("Signed in successfully");
        await finishSignIn(data.user.id);
      }
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      const connectivityError = isAuthConnectivityError(error);
      setAuthError(message);
      setHasConnectivityError(connectivityError);
      toast.error(connectivityError ? "Sign-in service unavailable" : message);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleAuth = async () => {
    setLoading(true);
    setAuthError("");
    setHasConnectivityError(false);

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        options: {
          redirectTo: appUrl(`auth?next=${encodeURIComponent(requestedPath)}`),
          scopes: "openid email profile",
        },
      });
      if (error) throw error;
    } catch (error: unknown) {
      const message = getAuthErrorMessage(error);
      const connectivityError = isAuthConnectivityError(error);
      setAuthError(message);
      setHasConnectivityError(connectivityError);
      toast.error(connectivityError ? "Sign-in service unavailable" : message);
      setLoading(false);
    }
  };

  const switchMode = () => {
    setIsSignUp((current) => !current);
    setAuthError("");
    setHasConnectivityError(false);
  };

  return (
    <main className="relative min-h-screen overflow-hidden bg-slate-950 text-white">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,hsl(205_65%_55%/0.18),transparent_38%),radial-gradient(circle_at_bottom_right,hsl(215_50%_35%/0.3),transparent_42%)]" />
      <div className="absolute inset-0 opacity-[0.07] [background-image:linear-gradient(hsl(0_0%_100%/0.4)_1px,transparent_1px),linear-gradient(90deg,hsl(0_0%_100%/0.4)_1px,transparent_1px)] [background-size:40px_40px]" />

      <div className="relative mx-auto flex min-h-screen w-full max-w-6xl flex-col px-5 py-5 sm:px-8 lg:px-10">
        <header className="flex items-center justify-between">
          <Link to="/" className="group flex items-center gap-2.5 rounded-lg py-2 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300">
            <span className="grid h-9 w-9 place-items-center rounded-xl bg-white/10 ring-1 ring-white/15 transition-colors group-hover:bg-white/15">
              <Building2 className="h-5 w-5 text-sky-300" />
            </span>
            <span className="text-lg font-semibold tracking-tight">Blueprints</span>
          </Link>
          <Button asChild variant="ghost" className="text-slate-200 hover:bg-white/10 hover:text-white">
            <Link to="/">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back to home
            </Link>
          </Button>
        </header>

        <div className="grid flex-1 items-center gap-12 py-10 lg:grid-cols-[1fr_460px] lg:py-14">
          <section className="hidden max-w-xl lg:block">
            <p className="mb-5 inline-flex items-center gap-2 rounded-full border border-sky-300/20 bg-sky-300/10 px-3 py-1 text-sm font-medium text-sky-200">
              <ShieldCheck className="h-4 w-4" />
              Your funding workspace
            </p>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight">
              Keep every opportunity moving forward.
            </h1>
            <p className="mt-6 max-w-lg text-lg leading-8 text-slate-300">
              Sign in to save programs, track deadlines, and get guidance built around your business.
            </p>
            <div className="mt-10 grid gap-5 text-slate-200 sm:grid-cols-3">
              <div className="space-y-2">
                <Search className="h-5 w-5 text-sky-300" />
                <p className="text-sm leading-6">Search official-source funding programs</p>
              </div>
              <div className="space-y-2">
                <BookmarkCheck className="h-5 w-5 text-sky-300" />
                <p className="text-sm leading-6">Save matches and deadlines</p>
              </div>
              <div className="space-y-2">
                <Building2 className="h-5 w-5 text-sky-300" />
                <p className="text-sm leading-6">Build a tailored business profile</p>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-white/15 bg-white p-6 text-slate-950 shadow-2xl shadow-black/30 sm:p-8" aria-labelledby="auth-title">
            <div className="mb-7">
              <p className="text-sm font-semibold text-sky-700">{isSignUp ? "Create your workspace" : "Welcome back"}</p>
              <h2 id="auth-title" className="mt-1 text-3xl font-semibold tracking-tight">
                {isSignUp ? "Create an account" : "Sign in to Blueprints"}
              </h2>
              <p className="mt-2 text-sm leading-6 text-slate-600">
                {isSignUp
                  ? "Start saving funding matches and tracking your next steps."
                  : "Enter your account details to continue where you left off."}
              </p>
            </div>

            {authError && (
              <Alert variant="destructive" className="mb-5" role="alert">
                <AlertCircle className="h-4 w-4" />
                <AlertTitle>{hasConnectivityError ? "Sign-in service unavailable" : "We couldn't sign you in"}</AlertTitle>
                <AlertDescription className="mt-1 leading-5">{authError}</AlertDescription>
              </Alert>
            )}

            <Button type="button" variant="outline" className="h-11 w-full" onClick={handleGoogleAuth} disabled={loading}>
              <span aria-hidden="true" className="mr-2 text-base font-bold text-blue-600">G</span>
              Continue with Google
            </Button>

            <div className="my-5 flex items-center gap-3" aria-hidden="true">
              <span className="h-px flex-1 bg-slate-200" />
              <span className="text-xs font-medium uppercase tracking-wide text-slate-500">or use email</span>
              <span className="h-px flex-1 bg-slate-200" />
            </div>

            <form onSubmit={handleAuth} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="email">Email address</Label>
                <Input
                  id="email"
                  type="email"
                  autoComplete="email"
                  placeholder="you@business.com"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  disabled={loading}
                  required
                />
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-4">
                  <Label htmlFor="password">Password</Label>
                  {!isSignUp && (
                    <Link to="/forgot-password" className="text-xs font-semibold text-sky-700 hover:text-sky-900 hover:underline">
                      Forgot password?
                    </Link>
                  )}
                </div>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    autoComplete={isSignUp ? "new-password" : "current-password"}
                    minLength={isSignUp ? 8 : undefined}
                    placeholder={isSignUp ? "At least 8 characters" : "Enter your password"}
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    className="pr-11"
                    disabled={loading}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword((current) => !current)}
                    className="absolute inset-y-0 right-0 grid w-11 place-items-center rounded-r-md text-slate-500 hover:text-slate-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-inset focus-visible:ring-sky-500"
                    aria-label={showPassword ? "Hide password" : "Show password"}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </button>
                </div>
                {isSignUp && <p className="text-xs text-slate-500">Use 8 or more characters.</p>}
              </div>

              <Button type="submit" className="h-11 w-full" disabled={loading}>
                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {loading ? (isSignUp ? "Creating account..." : "Signing in...") : isSignUp ? "Create account" : "Sign in"}
              </Button>
            </form>

            <div className="mt-6 text-center text-sm text-slate-600">
              {isSignUp ? "Already have an account?" : "New to Blueprints?"}{" "}
              <button type="button" onClick={switchMode} className="font-semibold text-sky-700 hover:text-sky-900 hover:underline">
                {isSignUp ? "Sign in" : "Create an account"}
              </button>
            </div>

            <div className="mt-6 border-t border-slate-200 pt-6 text-center">
              <Link to="/grants" className="text-sm font-medium text-slate-600 hover:text-slate-950 hover:underline">
                Explore funding without an account
              </Link>
            </div>
          </section>
        </div>
      </div>
    </main>
  );
}
