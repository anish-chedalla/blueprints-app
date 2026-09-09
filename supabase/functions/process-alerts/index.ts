import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.75.1";

type RecordValue = Record<string, unknown>;
interface SearchResultItem { key: string; title: string; url: string }

const jsonHeaders = { "Content-Type": "application/json" };
const escapeHtml = (value: string) => value.replace(/[&<>'"]/g, (character) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", "'": "&#39;", '"': "&quot;" })[character] || character);

async function sendEmail(apiKey: string, from: string, to: string, subject: string, html: string) {
  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
    body: JSON.stringify({ from, to: [to], subject, html }),
  });
  if (!response.ok) throw new Error(`Email provider returned ${response.status}`);
}

async function searchFederal(criteria: RecordValue): Promise<SearchResultItem[]> {
  if (criteria.source === "arizona" || criteria.source === "reviewed") return [];
  const response = await fetch("https://api.grants.gov/v1/api/search2", {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=UTF-8" },
    body: JSON.stringify({
      rows: 50,
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

async function searchReviewed(supabase: ReturnType<typeof createClient>, criteria: RecordValue): Promise<SearchResultItem[]> {
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
  const from = Deno.env.get("ALERT_FROM_EMAIL") || "Blueprints <alerts@example.com>";
  if (!supabaseUrl || !serviceRoleKey) return new Response(JSON.stringify({ error: "Supabase service configuration is missing" }), { status: 500, headers: jsonHeaders });
  if (!resendKey) return new Response(JSON.stringify({ error: "RESEND_API_KEY is not configured; in-app alerts remain available" }), { status: 503, headers: jsonHeaders });

  const supabase = createClient(supabaseUrl, serviceRoleKey);
  let remindersSent = 0;
  let searchesChecked = 0;
  let searchEmailsSent = 0;

  const { data: reminders, error: reminderError } = await supabase.from("opportunity_reminders").select("id, user_id, remind_at, delivery_channels, saved_opportunity_id").lte("remind_at", new Date().toISOString()).is("email_sent_at", null).contains("delivery_channels", ["email"]).limit(100);
  if (reminderError) throw reminderError;
  for (const reminder of reminders || []) {
    const [{ data: saved }, { data: userResult }] = await Promise.all([
      supabase.from("saved_opportunities").select("title, sponsor, official_url, deadline").eq("id", reminder.saved_opportunity_id).maybeSingle(),
      supabase.auth.admin.getUserById(reminder.user_id),
    ]);
    const email = userResult.user?.email;
    if (!saved || !email) continue;
    await sendEmail(resendKey, from, email, `Reminder: ${saved.title}`, `<h1>${escapeHtml(saved.title)}</h1><p>${escapeHtml(saved.sponsor)}</p><p>You asked Blueprints to remind you about this funding opportunity${saved.deadline ? ` before its ${escapeHtml(saved.deadline)} deadline` : ""}.</p><p><a href="${escapeHtml(saved.official_url)}">Review the official opportunity</a></p>`);
    await supabase.from("opportunity_reminders").update({ email_sent_at: new Date().toISOString() }).eq("id", reminder.id);
    remindersSent++;
  }

  const { data: searches, error: searchError } = await supabase.from("saved_searches").select("*").eq("email_enabled", true).limit(100);
  if (searchError) throw searchError;
  for (const search of searches || []) {
    const criteria = search.criteria && typeof search.criteria === "object" ? search.criteria as RecordValue : {};
    const [federal, reviewed] = await Promise.all([searchFederal(criteria), searchReviewed(supabase, criteria)]);
    const current = [...reviewed, ...federal];
    const previous = new Set(search.last_result_ids || []);
    const additions = current.filter((item) => !previous.has(item.key));
    const { data: userResult } = await supabase.auth.admin.getUserById(search.user_id);
    if (additions.length > 0 && userResult.user?.email) {
      const list = additions.slice(0, 10).map((item) => `<li><a href="${escapeHtml(item.url)}">${escapeHtml(item.title)}</a></li>`).join("");
      await sendEmail(resendKey, from, userResult.user.email, `${additions.length} new match${additions.length === 1 ? "" : "es"} for ${search.name}`, `<h1>New Blueprints matches</h1><p>Your saved search <strong>${escapeHtml(search.name)}</strong> found new opportunities:</p><ul>${list}</ul><p>Eligibility must be confirmed on each official source.</p>`);
      searchEmailsSent++;
    }
    await supabase.from("saved_searches").update({ last_checked_at: new Date().toISOString(), last_result_ids: current.map((item) => item.key).slice(0, 200) }).eq("id", search.id);
    searchesChecked++;
  }

  return new Response(JSON.stringify({ success: true, remindersSent, searchesChecked, searchEmailsSent }), { headers: jsonHeaders });
});
