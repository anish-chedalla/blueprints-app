import type { SupabaseClient, User } from "https://esm.sh/@supabase/supabase-js@2.75.1";

export type AuthenticationResult =
  | { user: User; error: null }
  | { user: null; error: "Unauthorized" };

export async function authenticateRequest(
  req: Request,
  supabase: SupabaseClient,
): Promise<AuthenticationResult> {
  const authorization = req.headers.get("Authorization");
  if (!authorization?.startsWith("Bearer ")) {
    return { user: null, error: "Unauthorized" };
  }

  const token = authorization.slice("Bearer ".length).trim();
  if (!token) {
    return { user: null, error: "Unauthorized" };
  }

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data.user) {
    return { user: null, error: "Unauthorized" };
  }

  return { user: data.user, error: null };
}

export async function consumeAiQuota(
  supabase: SupabaseClient,
  userId: string,
  functionName: string,
  limit: number,
): Promise<boolean> {
  const { data, error } = await supabase.rpc("consume_ai_quota", {
    p_user_id: userId,
    p_function_name: functionName,
    p_limit: limit,
  });

  if (error) {
    console.error("Failed to enforce AI quota:", error.message);
    return false;
  }

  return data === true;
}
