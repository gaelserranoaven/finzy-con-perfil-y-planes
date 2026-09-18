/* ===================================================================
   FINZY — Edge Function: chatbot personalizado con OpenAI (ChatGPT)
   Solo responde a usuarios con plan premium (verificado aquí, no solo
   en el frontend, para que no se pueda saltar el candado desde devtools).
   El JWT se verifica con auth.getUser (valida la firma contra Supabase
   Auth), no decodificando el payload a mano — así una sesión inválida
   o forjada nunca llega a leer el plan del usuario.
   La OPENAI_API_KEY vive como secreto del proyecto, nunca en el cliente.

   Además de responder preguntas, la IA puede registrar movimientos
   reales (gastos/ingresos) usando function calling de OpenAI: si el
   usuario pide algo como "hoy gasté 100000 en comida", el modelo
   devuelve una tool_call que esta función ejecuta insertando la fila
   en `movements` con el user_id ya autenticado (nunca confiamos en un
   user_id que venga del modelo o del cliente).
   =================================================================== */

import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const OPENAI_API_KEY = Deno.env.get("OPENAI_API_KEY");
const OPENAI_URL = "https://api.openai.com/v1/chat/completions";
const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const SERVICE_ROLE_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

const VALID_CATEGORIES = ["comida", "transporte", "entretenimiento", "ropa", "educacion", "salud", "otro", "ingreso"];

const supabaseAdmin = createClient(SUPABASE_URL, SERVICE_ROLE_KEY);

async function getAuthedUser(authHeader: string | null): Promise<{ id: string; plan: string } | null> {
  const token = authHeader?.replace("Bearer ", "");
  if (!token) return null;

  const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
  if (error || !user) return null;

  const { data } = await supabaseAdmin
    .from("subscriptions")
    .select("plan")
    .eq("user_id", user.id)
    .maybeSingle();

  return { id: user.id, plan: data?.plan || "gratis" };
}

const tools = [
  {
    type: "function",
    function: {
      name: "registrar_movimiento",
      description:
        "Registra un gasto o ingreso REAL en el dashboard financiero del usuario. Úsala únicamente cuando el usuario pida explícitamente anotar, registrar, guardar o agregar un gasto o ingreso concreto (por ejemplo: 'hoy gasté 100000 en una comida', 'me pagaron 500000 de sueldo'). No la uses para preguntas generales ni consejos.",
      parameters: {
        type: "object",
        properties: {
          tipo: { type: "string", enum: ["expense", "income"], description: "'expense' si es un gasto, 'income' si es un ingreso" },
          descripcion: { type: "string", description: "Descripción corta y clara de en qué fue el gasto o de dónde vino el ingreso" },
          monto: { type: "number", description: "Monto del movimiento, solo el número (sin símbolos de moneda ni separadores de miles)" },
          categoria: {
            type: "string",
            enum: VALID_CATEGORIES,
            description: "Categoría del movimiento. Usa 'ingreso' solo cuando tipo es 'income'; para gastos elige la categoría que mejor calce (comida, transporte, entretenimiento, ropa, educacion, salud, otro)",
          },
          fecha: { type: "string", description: "Fecha del movimiento en formato YYYY-MM-DD. Si el usuario no da una fecha, usa la fecha de hoy indicada en tu contexto." },
        },
        required: ["tipo", "descripcion", "monto"],
      },
    },
  },
];

async function callOpenAI(messages: any[], useTools: boolean) {
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
      ...(useTools ? { tools, tool_choice: "auto" } : {}),
    }),
  });

  if (!response.ok) throw new Error("Error conectando con OpenAI");
  return response.json();
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  const authedUser = await getAuthedUser(req.headers.get("Authorization"));
  if (!authedUser || authedUser.plan === "gratis") {
    return new Response(JSON.stringify({ error: "Esta función es solo para planes premium" }), {
      status: 403,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }

  try {
    const { message, history, context } = await req.json();
    const { name, movements, goals, investmentGoals, stats } = context;

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
      : "Sin metas de ahorro activas";

    const invGoalsText = (investmentGoals || []).length > 0
      ? investmentGoals.map((g: any) => `${g.name} en ${g.instrument} (${Math.round((g.saved / g.target) * 100)}% completado)`).join(", ")
      : "Sin metas de inversión activas";

    const recentMovs = (movements || [])
      .slice(0, 15)
      .map((m: any) => `${m.date} · ${m.type === "income" ? "+" : "-"}$${Number(m.amount).toFixed(0)} · ${m.category} · ${m.description}`)
      .join("\n");

    const today = new Date().toISOString().split("T")[0];

    const systemContext = `Eres "Fin", el asesor financiero personal de ${name} dentro de la app Finzy. Tu rol es doble:
1) Analizar sus finanzas reales y darle consejos concretos y accionables (nunca genéricos).
2) Registrar en el dashboard los gastos e ingresos que ${name} te dicte en el chat, usando la función registrar_movimiento cuando corresponda.

Reglas de tu rol como asesor:
- Responde SIEMPRE basándote en los datos reales de abajo cuando sea relevante.
- Tono cercano y juvenil para un joven latinoamericano (puedes usar "vos" o "tú"), directo y sin rodeos.
- Prioriza sugerencias de corto plazo específicas (montos, plazos, categorías) sobre frases motivacionales vacías.
- Si preguntan sobre invertir, recuerda que el riesgo y el retorno van juntos, y sugiere considerar su fondo de emergencia antes de invertir.
- No uses asteriscos ni markdown. Máximo 4 oraciones por respuesta.

Reglas para registrar movimientos:
- Usa registrar_movimiento SOLO si ${name} describe un gasto o ingreso real y concreto que quiere que guardes (ej: "anota que gasté 20000 en el bus", "regístrame un ingreso de 300000").
- Si falta el monto o no queda claro si es gasto o ingreso, pregunta antes de registrar nada.
- Nunca inventes montos ni fechas: si no te las dan, usa la fecha de hoy (${today}) y pide el monto si no lo mencionaron.
- Después de registrar, confirma con un mensaje corto y concreto (ej: "Listo, anoté $20.000 en transporte").

Datos financieros reales de ${name} (hoy es ${today}):
- Balance: $${Number(stats.balance).toFixed(0)}
- Ingresos: $${Number(stats.income).toFixed(0)}
- Gastos: $${Number(stats.expense).toFixed(0)}
- Principales categorías de gasto: ${topCatText || "Sin gastos registrados"}
- Metas de ahorro: ${goalsText}
- Metas de inversión: ${invGoalsText}
- Movimientos recientes:
${recentMovs || "Sin movimientos registrados"}`;

    const messages: any[] = [
      { role: "system", content: systemContext },
      ...(history || []).map((h: any) => ({
        role: h.role === "user" ? "user" : "assistant",
        content: h.text,
      })),
      { role: "user", content: message },
    ];

    let data = await callOpenAI(messages, true);
    let choice = data.choices?.[0]?.message;
    const actions: any[] = [];

    if (choice?.tool_calls?.length) {
      messages.push(choice);

      for (const call of choice.tool_calls) {
        let result: any = { ok: false, error: "No se pudo registrar el movimiento" };

        if (call.function?.name === "registrar_movimiento") {
          try {
            const args = JSON.parse(call.function.arguments || "{}");
            const tipo = args.tipo === "income" ? "income" : args.tipo === "expense" ? "expense" : null;
            const monto = Number(args.monto);
            const descripcion = String(args.descripcion || "").trim().slice(0, 200);
            const fecha = /^\d{4}-\d{2}-\d{2}$/.test(args.fecha) ? args.fecha : today;
            let categoria = VALID_CATEGORIES.includes(args.categoria) ? args.categoria : (tipo === "income" ? "ingreso" : "otro");
            if (tipo === "income") categoria = "ingreso";

            if (!tipo || !descripcion || !(monto > 0)) {
              result = { ok: false, error: "Faltan datos válidos (tipo, descripción o monto) para registrar el movimiento" };
            } else {
              const { data: inserted, error } = await supabaseAdmin
                .from("movements")
                .insert([{
                  user_id: authedUser.id,
                  type: tipo,
                  description: descripcion,
                  amount: monto,
                  category: categoria,
                  date: fecha,
                }])
                .select()
                .single();

              if (error) throw error;
              result = { ok: true, movement: inserted };
              actions.push({ type: "movement", movement: inserted });
            }
          } catch (err) {
            result = { ok: false, error: (err as Error).message };
          }
        }

        messages.push({
          role: "tool",
          tool_call_id: call.id,
          content: JSON.stringify(result),
        });
      }

      data = await callOpenAI(messages, false);
      choice = data.choices?.[0]?.message;
    }

    const reply = choice?.content?.trim() || "No tengo una respuesta para eso, intenta preguntarme de otra forma.";

    return new Response(JSON.stringify({ reply, actions }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: (err as Error).message }), {
      status: 400,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
