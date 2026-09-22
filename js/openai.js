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

    // El motivo real viaja en el cuerpo de la respuesta (err.context), no en
    // error.message, que solo dice "non-2xx status code".
    if (error) {
        let reason = '';
        try { reason = (await error?.context?.json())?.error || ''; } catch (_) { /* sin JSON */ }
        throw new Error(reason || 'Error conectando con el asistente');
    }
    return data;
}
