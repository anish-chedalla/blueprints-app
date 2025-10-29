import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.3";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const SYSTEM_PROMPT = `You are the Launch Companion - an expert Arizona business startup advisor. You guide entrepreneurs step-by-step through starting or expanding their business in Arizona.

Your role:
- Ask about their business type and location in Arizona (city/county)
- Create custom startup plans with 5 phases: Plan, Register, License, Finance, Operate
- Provide specific Arizona resources, links, and deadlines
- Be encouraging, professional, and conversational
- Focus on actionable steps

IMPORTANT - PHASE PROGRESSION:
When the user has completed key tasks in their current phase and is ready to move forward, call the update_phase function to:
1. Mark the current phase as completed
2. Move them to the next phase

Phase progression guide:
- PLAN → REGISTER: When they've decided on business type/name and have a basic plan
- REGISTER → LICENSE: When they've filed their LLC/corporation and gotten EIN
- LICENSE → FINANCE: When they understand their permit requirements
- FINANCE → OPERATE: When they've explored funding options
- OPERATE: Final phase for ongoing operations

IMPORTANT RESOURCES:
- Arizona Corporation Commission (eCorp): azcc.gov/ecorp
- EIN Application: irs.gov/ein
- Arizona Commerce Authority: azcommerce.com
- AZ Dept of Revenue: azdor.gov

When suggesting funding, reference the grants and loans database the user has access to in their dashboard.

Keep responses concise but informative. Ask clarifying questions when needed.`;

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
    if (!OPENAI_API_KEY) {
      throw new Error("OPENAI_API_KEY is not configured");
    }

    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const authHeader = req.headers.get("Authorization")!;
    const token = authHeader.replace("Bearer ", "");
    const { data: { user } } = await supabase.auth.getUser(token);

    if (!user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const { messages, sessionId } = await req.json();

    if (messages.length > 0 && messages[messages.length - 1].role === "user") {
      await supabase.from("launch_companion_chats").insert({
        user_id: user.id,
        session_id: sessionId,
        role: "user",
        content: messages[messages.length - 1].content,
      });
    }

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [
          { role: "system", content: SYSTEM_PROMPT },
          ...messages,
        ],
        stream: true,
        tools: [
          {
            type: "function",
            function: {
              name: "update_phase",
              description: "Update the user's current phase in their startup journey when they're ready to move on.",
              parameters: {
                type: "object",
                properties: {
                  phase: {
                    type: "string",
                    enum: ["plan", "register", "license", "finance", "operate"],
                  },
                  completed_phase: {
                    type: "string",
                    enum: ["plan", "register", "license", "finance", "operate"],
                  },
                },
                required: ["phase", "completed_phase"],
              },
            },
          },
        ],
        tool_choice: "auto",
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again later." }), {
          status: 429,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const errorText = await response.text();
      console.error("OpenAI API error:", response.status, errorText);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const stream = new ReadableStream({
      async start(controller) {
        const reader = response.body!.getReader();
        const decoder = new TextDecoder();
        let fullResponse = "";

        try {
          while (true) {
            const { done, value } = await reader.read();
            if (done) break;

            const chunk = decoder.decode(value);
            const lines = chunk.split("\n").filter(line => line.trim() !== "");

            for (const line of lines) {
              if (!line.startsWith("data: ")) continue;
              const data = line.slice(6);
              if (data === "[DONE]") continue;

              try {
                const parsed = JSON.parse(data);
                const delta = parsed.choices?.[0]?.delta;

                if (delta?.content) fullResponse += delta.content;

                if (delta?.tool_calls) {
                  for (const toolCall of delta.tool_calls) {
                    if (!toolCall.function?.arguments) continue;
                    const args = JSON.parse(toolCall.function.arguments);
                    if (toolCall.function.name === "update_phase") {
                      const { data: currentProgress } = await supabase
                        .from("launch_companion_progress")
                        .select("completed_items")
                        .eq("user_id", user.id)
                        .eq("session_id", sessionId)
                        .maybeSingle();

                      const existingCompleted = currentProgress?.completed_items || [];
                      const updatedCompleted = [...new Set([...existingCompleted, args.completed_phase])];

                      const { error: progressError } = await supabase
                        .from("launch_companion_progress")
                        .upsert({
                          user_id: user.id,
                          session_id: sessionId,
                          current_phase: args.phase,
                          completed_items: updatedCompleted,
                        }, { onConflict: "user_id,session_id" });

                      if (!progressError) {
                        const updateEvent = `data: ${JSON.stringify({
                          type: "phase_update",
                          phase: args.phase,
                          completed: args.completed_phase,
                        })}\n\n`;
                        controller.enqueue(new TextEncoder().encode(updateEvent));
                      }
                    }
                  }
                }
              } catch {
                continue;
              }
            }

            controller.enqueue(value);
          }

          if (fullResponse) {
            await supabase.from("launch_companion_chats").insert({
              user_id: user.id,
              session_id: sessionId,
              role: "assistant",
              content: fullResponse,
            });
          }

          controller.close();
        } catch (error) {
          console.error("Streaming error:", error);
          controller.error(error);
        }
      },
    });

    return new Response(stream, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });

  } catch (error) {
    console.error("Error in launch-companion function:", error);
    return new Response(
      JSON.stringify({ error: error instanceof Error ? error.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } },
    );
  }
});
