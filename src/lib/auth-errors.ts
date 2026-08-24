const CONNECTIVITY_MESSAGE =
  "We couldn't reach the sign-in service. Your details weren't submitted. Please try again in a moment, or continue browsing funding opportunities.";

export function isAuthConnectivityError(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  return [
    "failed to fetch",
    "networkerror",
    "network error",
    "load failed",
    "connection refused",
  ].some((fragment) => normalized.includes(fragment));
}

export function getAuthErrorMessage(error: unknown) {
  const message = error instanceof Error ? error.message : String(error ?? "");
  const normalized = message.toLowerCase();

  if (isAuthConnectivityError(error)) return CONNECTIVITY_MESSAGE;
  if (normalized.includes("invalid login credentials")) {
    return "That email and password combination doesn't match an account. Check your details and try again.";
  }
  if (normalized.includes("email not confirmed")) {
    return "Please confirm your email before signing in. Check your inbox for the confirmation link.";
  }
  if (normalized.includes("user already registered")) {
    return "An account already exists for that email. Switch to sign in to continue.";
  }
  if (normalized.includes("rate limit") || normalized.includes("too many requests")) {
    return "Too many attempts were made. Please wait a few minutes before trying again.";
  }

  return message || "We couldn't complete that request. Please try again.";
}
