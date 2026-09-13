import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

type RecordValue = Record<string, unknown>;
type AdminClient = ReturnType<typeof createClient>;
interface SearchResultItem { key: string; title: string; url: string }
interface EmailResult { id: string }

const jsonHeaders = { "Content-Type": "application/json" };
const trackedProviderStatuses = new Set([
  "sent", "delivered", "delivery_delayed", "bounced", "failed", "suppressed",
  "complained", "opened", "clicked",
]);
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);
const errorMessage = (error: unknown) => error instanceof Error ? error.message : String(error);

async function digest(value: string) {
  const bytes = new TextEncoder().encode(value);
  const hash = await crypto.subtle.digest("SHA-256", bytes);
  return Array.from(new Uint8Array(hash)).map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string, idempotencyKey: string): Promise<EmailResult> {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
      "Idempotency-Key": idempotencyKey,
    },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  const payload = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(`Email provider returned ${response.status}${typeof payload?.message === "string" ? `: ${payload.message}` : ""}`);
  if (typeof payload?.id !== "string") throw new Error("Email provider accepted the request without returning a message ID");
  return { id: payload.id };
}

async function hasSuccessfulAttempt(supabase: AdminClient, idempotencyKey: string) {
  const { data } = await supabase.from("alert_deliveries").select("status").eq("idempotency_key", idempotencyKey).maybeSingle();
  return Boolean(data && data.status !== "failed");
}

async function recordDelivery(supabase: AdminClient, delivery: RecordValue) {
  const { error } = await supabase.from("alert_deliveries").upsert(delivery, { onConflict: "idempotency_key" });
  if (error) throw error;
}

async function refreshDeliveryStatuses(supabase: AdminClient, apiKey: string) {
  const { data, error } = await supabase
    .from("alert_deliveries")
    .select("id, provider_message_id, status")
    .not("provider_message_id", "is", null)
    .in("status", ["accepted", "sent", "delivery_delayed"])
    .order("created_at", { ascending: true })
    .limit(100);
  if (error) throw error;

  let refreshed = 0;
  for (const delivery of data || []) {
    const response = await fetch(`https://api.resend.com/emails/${encodeURIComponent(delivery.provider_message_id)}`, {
      headers: { Authorization: `Bearer ${apiKey}` },
    });
    if (!response.ok) continue;
    const payload = await response.json();
    const nextStatus = typeof payload?.last_event === "string" ? payload.last_event : "";
    if (!trackedProviderStatuses.has(nextStatus) || nextStatus === delivery.status) continue;
    const { error: updateError } = await supabase.from("alert_deliveries").update({
      status: nextStatus,
      delivered_at: nextStatus === "delivered" ? new Date().toISOString() : null,
      error_message: ["bounced", "failed", "suppressed", "complained"].includes(nextStatus)
        ? `Resend reported ${nextStatus}`
        : null,
    }).eq("id", delivery.id);
    if (!updateError) refreshed++;
  }
  return refreshed;
}

async function searchFederal(criteria: RecordValue): Promise<SearchResultItem[]> {
  if (criteria.source === "arizona" || criteria.source === "reviewed") return [];
  const response = await fetch("https://api.grants.gov/v1/api/search2", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      // Keep the monitored federal window aligned with the first page captured
      // when the user saves a search, so existing page-two results are not
      // incorrectly announced as new on the first scheduled run.
      rows: 20,
      startRecordNum: 0,
      keyword: typeof criteria.keyword === "string" ? criteria.keyword : "",
      oppStatuses: typeof criteria.status === "string" ? criteria.status : "posted",
      eligibilities: criteria.eligibility === "all" ? "" : typeof criteria.eligibility === "string" ? criteria.eligibility : "23|99",
      fundingCategories: typeof criteria.category === "string" ? criteria.category : "",
      agencies: typeof criteria.agency === "string" ? criteria.agency : "",
      fundingInstruments: "G",
    }),
  });
  if (!response.ok) throw new Error(`Grants.gov returned ${response.status}`);
  const payload = await response.json();
  return (payload?.data?.oppHits || []).map((item: RecordValue) => ({
    key: `grants.gov:${String(item.id || "")}`,
    title: String(item.title || "Federal opportunity"),
    url: `https://www.grants.gov/search-results-detail/${encodeURIComponent(String(item.id || ""))}`,
  })).filter((item: SearchResultItem) => item.key !== "grants.gov:");
}

async function searchReviewed(supabase: AdminClient, criteria: RecordValue): Promise<SearchResultItem[]> {
  if (criteria.source === "federal") return [];
  const { data, error } = await supabase.from("programs").select("id, source_id, name, sponsor, description, industry_tags, url, source_url, deadline, rolling, status").eq("type", "GRANT").not("source_id", "is", null).neq("status", "CLOSED").limit(200);
  if (error) throw error;
  const keyword = typeof criteria.keyword === "string" ? criteria.keyword.trim().toLowerCase() : "";
  return (data || []).filter((item) => {
    if (!item.rolling && item.deadline && new Date(item.deadline).getTime() < Date.now()) return false;
    return !keyword || [item.name, item.sponsor, item.description, ...(item.industry_tags || [])].join(" ").toLowerCase().includes(keyword);
  }).map((item) => ({
    key: `blueprints:${item.source_id || item.id}`,
    title: item.name,
    url: item.source_url || item.url,
  }));
}

serve(async (request) => {
  if (request.method !== "POST") return new Response(JSON.stringify({ error: "Method not allowed" }), { status: 405, headers: jsonHeaders });
  const cronSecret = Deno.env.get("ALERT_CRON_SECRET");
  if (!cronSecret || request.headers.get("x-alert-cron-secret") !== cronSecret) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: jsonHeaders });
  }
  const supabaseUrl = Deno.env.get("SUPABASE_URL");
  const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
  const resendKey = Deno.env.get("RESEND_API_KEY");
  const from = Deno.env.get("ALERT_FROM_EMAIL");
  if (!supabaseUrl || !serviceRoleKey) return new Response(JSON.stringify({ error: "Supabase service configuration is missing" }), { status: 500, headers: jsonHeaders });
  if (!resendKey || !from) return new Response(JSON.stringify({ error: "RESEND_API_KEY and ALERT_FROM_EMAIL must be configured; in-app alerts remain available" }), { status: 503, headers: jsonHeaders });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let remindersSent = 0;
  let searchesChecked = 0;
  let searchEmailsSent = 0;
  const failures: Array<{ kind: string; id: string; error: string }> = [];
  const statusesRefreshed = await refreshDeliveryStatuses(supabase, resendKey);

  const { data: reminders, error: reminderError } = await supabase.from("opportunity_reminders").select("id, user_id, remind_at, delivery_channels, saved_opportunity_id").lte("remind_at", new Date().toISOString()).is("email_sent_at", null).contains("delivery_channels", ["email"]).limit(100);
  if (reminderError) throw reminderError;
  for (const reminder of reminders || []) {
    const idempotencyKey = `reminder/${reminder.id}`;
    try {
      const [{ data: saved }, { data: userResult }] = await Promise.all([
        supabase.from("saved_opportunities").select("title, sponsor, official_url, deadline").eq("id", reminder.saved_opportunity_id).maybeSingle(),
        supabase.auth.admin.getUserById(reminder.user_id),
      ]);
      const email = userResult.user?.email;
      if (!saved || !email) throw new Error("Reminder recipient or saved opportunity is missing");
      const subject = `Reminder: ${saved.title}`;
      if (!await hasSuccessfulAttempt(supabase, idempotencyKey)) {
        const result = await sendEmail(resendKey, from, email, subject, `<h1>${escapeHtml(saved.title)}</h1><p>${escapeHtml(saved.sponsor)}</p><p>You asked Blueprints to remind you about this funding opportunity${saved.deadline ? ` before its ${escapeHtml(saved.deadline)} deadline` : ""}.</p><p><a href="${escapeHtml(saved.official_url)}">Review the official opportunity</a></p>`, idempotencyKey);
        await recordDelivery(supabase, { user_id: reminder.user_id, kind: "reminder", reference_id: reminder.id, idempotency_key: idempotencyKey, provider_message_id: result.id, subject, status: "accepted", error_message: null });
      }
      await supabase.from("opportunity_reminders").update({ email_sent_at: new Date().toISOString(), email_error: null }).eq("id", reminder.id);
      remindersSent++;
    } catch (error) {
      const message = errorMessage(error);
      await recordDelivery(supabase, { user_id: reminder.user_id, kind: "reminder", reference_id: reminder.id, idempotency_key: idempotencyKey, subject: "Opportunity reminder", status: "failed", error_message: message });
      await supabase.from("opportunity_reminders").update({ email_error: message }).eq("id", reminder.id);
      failures.push({ kind: "reminder", id: reminder.id, error: message });
    }
  }

  const { data: searches, error: searchError } = await supabase.from("saved_searches").select("*").eq("email_enabled", true).limit(100);
  if (searchError) throw searchError;
  for (const search of searches || []) {
    try {
      const criteria = search.criteria && typeof search.criteria === "object" ? search.criteria as RecordValue : {};
      const [federal, reviewed] = await Promise.all([searchFederal(criteria), searchReviewed(supabase, criteria)]);
      const current = [...reviewed, ...federal];
      const previousIds = Array.isArray(search.last_result_ids) ? search.last_result_ids : [];
      const previous = new Set(previousIds);
      const observedIds = Array.from(new Set([...previousIds, ...current.map((item) => item.key)])).slice(-1000);
      const additions = current.filter((item) => !previous.has(item.key));
      const { data: userResult } = await supabase.auth.admin.getUserById(search.user_id);
      if (additions.length > 0) {
        if (!userResult.user?.email) throw new Error("Saved-search recipient has no email address");
        const fingerprint = await digest(additions.map((item) => item.key).sort().join("|"));
        const idempotencyKey = `saved-search/${search.id}/${fingerprint.slice(0, 32)}`;
        const subject = `${additions.length} new match${additions.length === 1 ? "" : "es"} for ${search.name}`;
        if (!await hasSuccessfulAttempt(supabase, idempotencyKey)) {
          const list = additions.slice(0, 10).map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></li>`).join("");
          const result = await sendEmail(resendKey, from, userResult.user.email, subject, `<h1>New Blueprints matches</h1><p>Your saved search <strong>${escapeHtml(search.name)}</strong> found new opportunities:</p><ul>${list}</ul><p>Eligibility must be confirmed on each official source.</p>`, idempotencyKey);
          await recordDelivery(supabase, { user_id: search.user_id, kind: "saved_search", reference_id: search.id, idempotency_key: idempotencyKey, provider_message_id: result.id, subject, status: "accepted", error_message: null });
          searchEmailsSent++;
        }
        await supabase.from("saved_searches").update({ last_checked_at: new Date().toISOString(), last_result_ids: observedIds, last_email_sent_at: new Date().toISOString(), last_email_error: null }).eq("id", search.id);
      } else {
        await supabase.from("saved_searches").update({ last_checked_at: new Date().toISOString(), last_result_ids: observedIds, last_email_error: null }).eq("id", search.id);
      }
      searchesChecked++;
    } catch (error) {
      const message = errorMessage(error);
      await supabase.from("saved_searches").update({ last_checked_at: new Date().toISOString(), last_email_error: message }).eq("id", search.id);
      failures.push({ kind: "saved_search", id: search.id, error: message });
    }
  }

  return new Response(JSON.stringify({ success: failures.length === 0, remindersSent, searchesChecked, searchEmailsSent, statusesRefreshed, failures }), {
    status: failures.length === 0 ? 200 : 500,
    headers: jsonHeaders,
  });
});
