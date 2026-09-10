/* ===================================================================
   FINZY — Integración con OpenAI (ChatGPT)
   La llamada real a OpenAI vive en la Edge Function
   supabase/functions/openai-advice, para no exponer la API key
   en el navegador. Aquí solo invocamos esa función.
   =================================================================== */

async function getPersonalizedAdvice(userProfile) {
    const { data, error } = await _supabase.functions.invoke('openai-advice', {
        body: userProfile
    });

    if (error) throw new Error('Error conectando con el asistente');
    return data;
}
