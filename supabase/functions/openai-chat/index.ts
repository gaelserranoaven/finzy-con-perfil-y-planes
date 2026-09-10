/* ===================================================================
   FINZY — Edge Function: chatbot personalizado con OpenAI (ChatGPT)
   Solo responde a usuarios con plan premium (verificado aquí, no solo
   en el frontend, para que no se pueda saltar el candado desde devtools).
   La OPENAI_API_KEY vive como secreto del proyecto, nunca en el cliente.
   =================================================================== */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function getUserPlanFromJWT(authHeader: string | null): string {
  if (!authHeader) return "gratis";
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return payload.user_metadata?.plan || "gratis";
  } catch {
    return "gratis";
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const plan = getUserPlanFromJWT(req.headers.get("Authorization"));
  if (plan === "gratis") {
    return new Response(JSON.stringify({ error: "Esta función es solo para planes premium" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { message, history, context } = await req.json();
    const { name, movements, goals, stats } = context;

    const topCategories = (movements || [])
      .filter((m: any) => m.type === "expense")
      .reduce((acc: Record<string, number>, m: any) => {
        acc[m.category] = (acc[m.category] || 0) + Number(m.amount);
        return acc;
      }, {});

    const topCatText = Object.entries(topCategories)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 5)
      .map(([cat, amt]) => `${cat}: $${Number(amt).toFixed(0)}`)
      .join(", ");

    const goalsText = (goals || []).length > 0
      ? goals.map((g: any) => `${g.name} (${Math.round((g.saved / g.target) * 100)}% completado)`).join(", ")
      : "Sin metas activas";

    const recentMovs = (movements || [])
      .slice(0, 15)
      .map((m: any) => `${m.date} · ${m.type === "income" ? "+" : "-"}$${Number(m.amount).toFixed(0)} · ${m.category} · ${m.description}`)
      .join("\n");

    const systemContext = `Eres el asistente financiero personal de ${name} dentro de la app Finzy.
Estos son sus datos financieros reales del mes:
- Balance: $${Number(stats.balance).toFixed(0)}
- Ingresos: $${Number(stats.income).toFixed(0)}
- Gastos: $${Number(stats.expense).toFixed(0)}
- Principales categorías de gasto: ${topCatText || "Sin gastos registrados"}
- Metas de ahorro: ${goalsText}
- Movimientos recientes:
${recentMovs || "Sin movimientos registrados"}

Responde SIEMPRE basándote en estos datos reales cuando sea relevante, en español, con tono cercano y juvenil (puedes usar "vos" o "tú"), directo y sin rodeos. No uses asteriscos ni markdown. Máximo 4 oraciones por respuesta.`;

    const messages = [
      { role: "system", content: systemContext },
      ...(history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages,
        temperature: 0.7,
        max_tokens: 300,
      }),
    });

    if (!response.ok) throw new Error("Error conectando con OpenAI");

    const data = await response.json();
    const reply = data.choices?.[0]?.message?.content?.trim() || "No tengo una respuesta para eso, intenta preguntarme de otra forma.";

    return new Response(JSON.stringify({ reply }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
