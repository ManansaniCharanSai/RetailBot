import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

function buildSystemPrompt(inventoryData: any[], salesData: any[]) {
  return `You are RetailBot, an intelligent retail assistant for ShopSmart Store.
You have real-time access to the store inventory and sales data provided below.

CURRENT INVENTORY:
${JSON.stringify(inventoryData, null, 2)}

RECENT SALES DATA:
${JSON.stringify(salesData, null, 2)}

YOUR CAPABILITIES:
- INVENTORY QUERIES: Answer stock levels, pricing, low stock alerts
- SALES INSIGHTS: When asked for charts/trends/analysis, respond with a JSON block
- SALES SUMMARY: Provide concise daily, weekly, and monthly KPI summaries
- DASHBOARD SNAPSHOT: Provide dashboard-style metrics (revenue, units sold, top products, category performance)
- FORECASTING: Estimate short-term demand (next 7 days / 30 days) from available sales history
- RECOMMENDATIONS: Suggest restocking, promotions, product bundling
- ADVANCED FEATURES: Identify slow movers, stockout risk, and promotion opportunities
- CUSTOMER SERVICE: Handle returns policy, store hours, FAQs

RESPONSE RULES:
- For normal questions: respond in friendly conversational English using markdown formatting
- For data insight requests (charts, graphs, trends, analysis): ALWAYS include this exact format somewhere in your response:
INSIGHT_DATA:{"chartType":"bar|line|pie|doughnut","title":"...","labels":[...],"datasets":[{"label":"...","data":[...],"backgroundColor":[...]}],"summary":"one sentence summary"}:END_INSIGHT
- Keep responses concise and helpful
- Always flag items where stock < threshold as ⚠️ LOW STOCK
- Currency in INR (Indian Rupees, symbol: ₹)
- When showing currency values, use the ₹ symbol
- When listing products, format them nicely with bullet points
- For bundle recommendations, be creative and explain the value proposition`;
}

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });

  try {
    const { messages } = await req.json();
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY is not configured");

    // Fetch inventory and sales from Supabase
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

    const [invRes, salesRes] = await Promise.all([
      fetch(`${supabaseUrl}/rest/v1/inventory?is_active=eq.true&select=*`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }),
      fetch(`${supabaseUrl}/rest/v1/sales?select=*&order=date.desc&limit=50`, {
        headers: { apikey: supabaseKey, Authorization: `Bearer ${supabaseKey}` },
      }),
    ]);

    const inventoryData = await invRes.json();
    const salesData = await salesRes.json();

    const systemPrompt = buildSystemPrompt(inventoryData, salesData);

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash",
        messages: [
          { role: "system", content: systemPrompt },
          ...messages,
        ],
        stream: true,
      }),
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }), {
          status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      if (response.status === 402) {
        return new Response(JSON.stringify({ error: "AI credits exhausted. Please add funds." }), {
          status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" },
        });
      }
      const t = await response.text();
      console.error("AI gateway error:", response.status, t);
      return new Response(JSON.stringify({ error: "AI service error" }), {
        status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" },
    });
  } catch (e) {
    console.error("chat error:", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
