/* ===================================================================
   FINZY — Integración con Gemini AI
   La llamada real a Gemini vive en la Edge Function
   supabase/functions/gemini-advice, para no exponer la API key
   en el navegador. Aquí solo invocamos esa función.
   =================================================================== */

async function getPersonalizedAdvice(userProfile) {
    const { data, error } = await _supabase.functions.invoke('gemini-advice', {
        body: userProfile
    });

    if (error) throw new Error('Error conectando con Gemini');
    return data;
}
