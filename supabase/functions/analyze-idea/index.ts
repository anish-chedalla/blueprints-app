// deno run --allow-net --allow-env server.ts
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { businessIdea, industry, budget } = await req.json();
    if (!businessIdea) throw new Error("Business idea is required");

    // Environment variables
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    const SUPABASE_URL = Deno.env.get("SUPABASE_URL");
    const SUPABASE_ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY");

    if (!OPENAI_API_KEY) throw new Error("Missing OPENAI_API_KEY");
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) throw new Error("Supabase credentials missing");

    // Initialize Supabase client
    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

    // Fetch programs from your Supabase table
    const { data: programs, error: dbError } = await supabase
      .from("programs")
      .select("*")
      .limit(50);
    if (dbError) throw dbError;

    // Construct the analysis prompt
    const analysisPrompt = `Analyze this business idea and provide actionable insights:

Business Idea: ${businessIdea}
Industry: ${industry || "Not specified"}
Budget: ${budget ? `$${budget}` : "Not specified"}

Available funding programs:
${programs?.map(p => `- ${p.name}: ${p.description}`).join("\n") || "None available"}

Please provide:
1. A brief market analysis (2–3 sentences about viability and potential)
2. Top 3–5 specific funding recommendations from the available programs that match this idea
3. Key next steps to move forward (3–4 actionable items)

Format your response in clear sections with headers.`;

    // Call OpenAI directly
    const aiResponse = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          {
            role: "system",
            content: "You are a business funding expert who helps entrepreneurs find the best grants and loans for their ideas. Be specific, actionable, and encouraging.",
          },
          { role: "user", content: analysisPrompt },
        ],
      }),
    });

    if (!aiResponse.ok) {
      const errorText = await aiResponse.text();
      console.error("OpenAI error:", aiResponse.status, errorText);
      throw new Error("Failed to analyze business idea");
    }

    const aiData = await aiResponse.json();
    const analysis = aiData.choices?.[0]?.message?.content || "No response generated.";

    // Match mentioned programs in AI output
    const matchedPrograms =
      programs?.filter((p) => analysis.toLowerCase().includes(p.name.toLowerCase())) || [];

    // Return result
    return new Response(
      JSON.stringify({
        analysis,
        matchedPrograms: matchedPrograms.slice(0, 5),
        totalPrograms: programs?.length || 0,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  } catch (e) {
    console.error("analyze-idea error:", e);
    return new Response(
      JSON.stringify({
        error: e instanceof Error ? e.message : "Unknown error",
      }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});