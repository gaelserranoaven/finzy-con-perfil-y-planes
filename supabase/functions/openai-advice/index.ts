/* ===================================================================
   FINZY — Edge Function: consejos personalizados con OpenAI (ChatGPT)
   El JWT se verifica con auth.getUser (valida la firma contra Supabase
   Auth), no decodificando el payload a mano.
   La OPENAI_API_KEY vive como secreto del proyecto (Deno.env), nunca
   llega al navegador. El cliente solo manda { name, movements, goals, stats }.
   =================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
// Clave pública, no el service role: ver el comentario en openai-chat.
// Autenticamos con el JWT del propio usuario para no depender de la legacy
// SUPABASE_SERVICE_ROLE_KEY, que puede estar deshabilitada en el proyecto.
const ANON_KEY = Deno.env.get("SUPABASE_ANON_KEY")
  ?? Deno.env.get("SUPABASE_PUBLISHABLE_KEY")
  ?? "sb_publishable__zch_FyhCZ6j37NQr0Ddbg_9kqZPVJT";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function isLoggedInUser(authHeader: string | null): Promise<boolean> {
  if (!authHeader) return false;
  const client = createClient(SUPABASE_URL, ANON_KEY, {
    global: { headers: { Authorization: authHeader } },
    auth: { persistSession: false, autoRefreshToken: false },
  });
  const { data: { user }, error } = await client.auth.getUser();
  return !error && Boolean(user);
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  if (!(await isLoggedInUser(req.headers.get("Authorization")))) {
    return new Response(JSON.stringify({ error: "Debes iniciar sesión" }), {
      status: 401,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { name, movements, goals, investmentGoals, stats } = await req.json();

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
      : "Sin metas de ahorro activas";

    const invGoalsText = (investmentGoals || []).length > 0
      ? investmentGoals.map((g: any) => `${g.name} en ${g.instrument} (${Math.round((g.saved / g.target) * 100)}% completado)`).join(", ")
      : "Sin metas de inversión activas";

    const prompt = `Eres "Fin", un asesor financiero certificado especializado en jóvenes latinoamericanos que recién empiezan a manejar su plata. Tu trabajo es mirar los números reales de ${name} y darle consejos que pueda aplicar esta misma semana, no frases motivacionales genéricas.

Datos financieros reales de ${name} este mes:
- Balance: $${Number(stats.balance).toFixed(0)}
- Ingresos: $${Number(stats.income).toFixed(0)}
- Gastos: $${Number(stats.expense).toFixed(0)}
- Principales categorías de gasto: ${topCatText || "Sin gastos registrados"}
- Metas de ahorro: ${goalsText}
- Metas de inversión: ${invGoalsText}

Genera exactamente 3 consejos financieros PERSONALIZADOS basados en estos datos reales. Reglas:
- Al menos uno de los 3 debe hablar de ahorro/gastos y, si tiene metas de inversión o dinero sobrante, al menos uno debe hablar de inversión — mencionando el instrumento concreto (CDT, acciones, cripto, etc.) cuando aplique y su nivel de riesgo.
- Sé específico con los números (montos, porcentajes, plazos) en vez de generalidades.
- Usa un tono cercano, directo y juvenil (puedes usar "vos" o "tú").
- No uses asteriscos ni markdown. Responde SOLO en este formato JSON, sin texto extra (el campo "emoji" debe ser un único emoji relevante al consejo):
[
  {"emoji": "(un emoji corto)", "categoria": "ahorro|gastos|habitos|inversion", "titulo": "Título corto", "consejo": "Consejo de 2-3 oraciones máximo."},
  {"emoji": "(un emoji corto)", "categoria": "...", "titulo": "...", "consejo": "..."},
  {"emoji": "(un emoji corto)", "categoria": "...", "titulo": "...", "consejo": "..."}
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
