/* ===================================================================
   FINZY — Edge Function: consejos personalizados con OpenAI (ChatGPT)
   La OPENAI_API_KEY vive como secreto del proyecto (Deno.env), nunca
   llega al navegador. El cliente solo manda { name, movements, goals, stats }.
   =================================================================== */

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function isLoggedInUser(authHeader: string | null): boolean {
  if (!authHeader) return false;
  try {
    const token = authHeader.replace("Bearer ", "");
    const payload = JSON.parse(atob(token.split(".")[1]));
    return Boolean(payload.sub);
  } catch {
    return false;
  }
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!isLoggedInUser(req.headers.get("Authorization"))) {
    return new Response(JSON.stringify({ error: "Debes iniciar sesión" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { name, movements, goals, stats } = await req.json();

    const topCategories = (movements || [])
      .filter((m: any) => m.type === "expense")
      .reduce((acc: Record<string, number>, m: any) => {
        acc[m.category] = (acc[m.category] || 0) + Number(m.amount);
        return acc;
      }, {});

    const topCatText = Object.entries(topCategories)
      .sort((a: any, b: any) => b[1] - a[1])
      .slice(0, 3)
      .map(([cat, amt]) => `${cat}: $${Number(amt).toFixed(0)}`)
      .join(", ");

    const goalsText = (goals || []).length > 0
      ? goals.map((g: any) => `${g.name} (${Math.round((g.saved / g.target) * 100)}% completado)`).join(", ")
      : "Sin metas activas";

    const prompt = `Eres un asesor financiero amigable para jóvenes latinoamericanos.
El usuario se llama ${name} y estos son sus datos financieros del mes:
- Balance: $${Number(stats.balance).toFixed(0)}
- Ingresos: $${Number(stats.income).toFixed(0)}
- Gastos: $${Number(stats.expense).toFixed(0)}
- Principales categorías de gasto: ${topCatText || "Sin gastos registrados"}
- Metas de ahorro: ${goalsText}

Genera exactamente 3 consejos financieros PERSONALIZADOS basados en sus datos reales.
Usa un tono cercano, directo y juvenil (puedes usar "vos" o "tú").
Sé específico con los números cuando sea relevante.
No uses asteriscos ni markdown. Responde SOLO en este formato JSON, sin texto extra:
[
  {"emoji": "💡", "categoria": "ahorro|gastos|habitos|inversion", "titulo": "Título corto", "consejo": "Consejo de 2-3 oraciones máximo."},
  {"emoji": "💡", "categoria": "...", "titulo": "...", "consejo": "..."},
  {"emoji": "💡", "categoria": "...", "titulo": "...", "consejo": "..."}
]`;

    const response = await fetch(OPENAI_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${OPENAI_API_KEY}`,
      },
      body: JSON.stringify({
        model: "gpt-4o-mini",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.7,
        max_tokens: 600,
      }),
    });

    if (!response.ok) throw new Error("Error conectando con OpenAI");

    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || "";
    const clean = text.replace(/```json|```/g, "").trim();
    const cards = JSON.parse(clean);

    return new Response(JSON.stringify(cards), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
