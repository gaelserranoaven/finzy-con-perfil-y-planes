/* ===================================================================
   FINZY — Integración con Gemini AI
   Reemplaza TU_GEMINI_API_KEY con tu clave de Google AI Studio
   Obtenerla gratis en: https://aistudio.google.com/apikey
   =================================================================== */

const GEMINI_API_KEY = 'TU_GEMINI_API_KEY';
const GEMINI_URL = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${GEMINI_API_KEY}`;

async function getPersonalizedAdvice(userProfile) {
    const { name, movements, goals, stats } = userProfile;

    // Construir resumen financiero del usuario
    const topCategories = movements
        .filter(m => m.type === 'expense')
        .reduce((acc, m) => {
            acc[m.category] = (acc[m.category] || 0) + Number(m.amount);
            return acc;
        }, {});

    const topCatText = Object.entries(topCategories)
        .sort((a, b) => b[1] - a[1])
        .slice(0, 3)
        .map(([cat, amt]) => `${cat}: $${amt.toFixed(0)}`)
        .join(', ');

    const goalsText = goals.length > 0
        ? goals.map(g => `${g.name} (${Math.round((g.saved/g.target)*100)}% completado)`).join(', ')
        : 'Sin metas activas';

    const prompt = `Eres un asesor financiero amigable para jóvenes latinoamericanos. 
El usuario se llama ${name} y estos son sus datos financieros del mes:
- Balance: $${stats.balance.toFixed(0)}
- Ingresos: $${stats.income.toFixed(0)}
- Gastos: $${stats.expense.toFixed(0)}
- Principales categorías de gasto: ${topCatText || 'Sin gastos registrados'}
- Metas de ahorro: ${goalsText}

Genera exactamente 3 consejos financieros PERSONALIZADOS basados en sus datos reales. 
Usa un tono cercano, directo y juvenil (puedes usar "vos" o "tú"). 
Sé específico con los números cuando sea relevante.
No uses asteriscos ni markdown. Responde SOLO en este formato JSON:
[
  {"emoji": "💡", "categoria": "ahorro|gastos|habitos|inversion", "titulo": "Título corto", "consejo": "Consejo de 2-3 oraciones máximo."},
  {"emoji": "💡", "categoria": "...", "titulo": "...", "consejo": "..."},
  {"emoji": "💡", "categoria": "...", "titulo": "...", "consejo": "..."}
]`;

    const response = await fetch(GEMINI_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            contents: [{ parts: [{ text: prompt }] }],
            generationConfig: { temperature: 0.7, maxOutputTokens: 600 }
        })
    });

    if (!response.ok) throw new Error('Error conectando con Gemini');

    const data = await response.json();
    const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';

    // Limpiar posible markdown y parsear JSON
    const clean = text.replace(/```json|```/g, '').trim();
    return JSON.parse(clean);
}
