import { supabase } from "@/integrations/supabase/client";
import type { Tables } from "@/integrations/supabase/types";
import type { Opportunity } from "@/lib/opportunities";

export type ViewHistoryItem = Tables<"view_history">;

const HISTORY_LIMIT = 200;
const historyKey = (userId: string) => `blueprints:view-history:${userId}`;
const preferenceKey = (userId: string) => `blueprints:view-history-enabled:${userId}`;

function readLocal(userId: string): ViewHistoryItem[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(historyKey(userId)) || "[]");
    return Array.isArray(parsed) ? parsed as ViewHistoryItem[] : [];
  } catch {
    return [];
  }
}

function writeLocal(userId: string, items: ViewHistoryItem[]) {
  try {
    localStorage.setItem(historyKey(userId), JSON.stringify(items.slice(0, HISTORY_LIMIT)));
  } catch {
    // Storage can be unavailable in privacy-restricted browser contexts.
  }
}

export function isViewHistoryEnabled(userId: string, accountPreference?: boolean): boolean {
  try {
    const localPreference = localStorage.getItem(preferenceKey(userId));
    return localPreference === null ? accountPreference !== false : localPreference !== "false";
  } catch {
    return true;
  }
}

export function setViewHistoryEnabled(userId: string, enabled: boolean) {
  try {
    localStorage.setItem(preferenceKey(userId), String(enabled));
  } catch {
    // The current session can still use database-backed history.
  }
}

export async function recordOpportunityView(opportunity: Opportunity): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !isViewHistoryEnabled(session.user.id, session.user.user_metadata?.view_history_enabled)) return;

  const row: ViewHistoryItem = {
    id: crypto.randomUUID(),
    user_id: session.user.id,
    opportunity_key: opportunity.key,
    funding_type: opportunity.fundingType,
    source: opportunity.source,
    external_id: opportunity.externalId,
    program_id: opportunity.programId,
    title: opportunity.title,
    sponsor: opportunity.sponsor,
    internal_url: opportunity.source === "grants.gov"
      ? `/federal-grant/${opportunity.externalId}`
      : opportunity.programId ? `/program/${opportunity.programId}` : null,
    official_url: opportunity.officialUrl,
    viewed_at: new Date().toISOString(),
  };

  await persistHistoryRow(row);
}

export async function recordHistoryRevisit(item: ViewHistoryItem): Promise<void> {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session || !isViewHistoryEnabled(session.user.id, session.user.user_metadata?.view_history_enabled)) return;
  await persistHistoryRow({
    ...item,
    id: crypto.randomUUID(),
    user_id: session.user.id,
    viewed_at: new Date().toISOString(),
  });
}

async function persistHistoryRow(row: ViewHistoryItem): Promise<void> {
  writeLocal(row.user_id, [row, ...readLocal(row.user_id)]);
  // Local storage is the immediate fallback while a deployment is waiting for
  // the matching migration. A missing table must never break navigation.
  await supabase.from("view_history").insert(row);
}

export async function loadViewHistory(userId: string): Promise<ViewHistoryItem[]> {
  const localItems = readLocal(userId);
  const { data } = await supabase
    .from("view_history")
    .select("*")
    .eq("user_id", userId)
    .order("viewed_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  const merged = new Map<string, ViewHistoryItem>();
  [...localItems, ...(data || [])].forEach((item) => merged.set(item.id, item));
  return [...merged.values()]
    .sort((left, right) => new Date(right.viewed_at).getTime() - new Date(left.viewed_at).getTime())
    .slice(0, HISTORY_LIMIT);
}

export async function clearViewHistory(userId: string): Promise<void> {
  try {
    localStorage.removeItem(historyKey(userId));
  } catch {
    // Continue with the synced-history deletion.
  }
  await supabase.from("view_history").delete().eq("user_id", userId);
}

export function latestUniqueViews(items: ViewHistoryItem[], type: "GRANT" | "LOAN", limit = 2) {
  const keys = new Set<string>();
  return items.filter((item) => {
    if (item.funding_type !== type || keys.has(item.opportunity_key)) return false;
    keys.add(item.opportunity_key);
    return true;
  }).slice(0, limit);
}
