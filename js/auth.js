/* ===================================================================
   FINZY — Autenticación con Supabase
   =================================================================== */

// Planes disponibles y su etiqueta visible
const PLAN_LABELS = {
    gratis: 'Plan gratis',
    premium_mensual: 'Premium mensual ✨',
    premium_anual: 'Premium anual ✨'
};

async function requireAuth() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) {
        window.location.href = 'index.html';
        return null;
    }
    return user;
}

// Obtener nombre del usuario desde metadata
async function getUserName() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return 'tú';
    return user.user_metadata?.full_name || user.email?.split('@')[0] || 'tú';
}

// Registrar nuevo usuario con nombre completo y teléfono
async function register(email, password, fullName, phone) {
    const { data, error } = await _supabase.auth.signUp({
        email,
        password,
        options: {
            data: {
                full_name: fullName,
                phone: phone
            }
        }
    });
    if (error) throw error;
    return data;
}

// Iniciar sesión
async function login(email, password) {
    const { data, error } = await _supabase.auth.signInWithPassword({ email, password });
    if (error) throw error;
    return data;
}

// Cerrar sesión
async function logout() {
    await _supabase.auth.signOut();
    window.location.href = 'index.html';
}

// Obtener el plan actual del usuario (por defecto: gratis)
async function getUserPlan() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return 'gratis';
    return user.user_metadata?.plan || 'gratis';
}

// Cambiar de plan — esto NO procesa ningún cobro real, solo guarda
// la selección en el perfil del usuario. Falta integrar una pasarela
// de pago real (Wompi/ePayco) para que esto cobre de verdad.
async function setUserPlan(plan) {
    const { data, error } = await _supabase.auth.updateUser({
        data: {
            plan: plan,
            plan_started_at: new Date().toISOString()
        }
    });
    if (error) throw error;
    return data;
}

// Obtener dirección de envío guardada (para la recompensa del plan anual)
// Devuelve { line1, details } o null si no ha guardado nada
async function getShippingAddress() {
    const { data: { user } } = await _supabase.auth.getUser();
    return user?.user_metadata?.shipping_address || null;
}

// Guardar dirección de envío — { line1, details }
async function setShippingAddress(address) {
    const { data, error } = await _supabase.auth.updateUser({
        data: { shipping_address: address }
    });
    if (error) throw error;
    return data;
}

// Obtener teléfono guardado del usuario
async function getUserPhone() {
    const { data: { user } } = await _supabase.auth.getUser();
    return user?.user_metadata?.phone || '';
}

// Actualizar teléfono del usuario
async function updateUserPhone(phone) {
    const { data, error } = await _supabase.auth.updateUser({ data: { phone } });
    if (error) throw error;
    return data;
}

// Cargar nombre y plan en sidebar — llamar en cada página interna
async function loadUserInSidebar() {
    const name = await getUserName();
    const plan = await getUserPlan();
    const nameEl = document.getElementById('userName');
    const avatarEl = document.getElementById('userAvatar');
    const planEl = document.getElementById('userPlanLabel');
    if (nameEl) nameEl.textContent = name;
    if (avatarEl) avatarEl.textContent = name.charAt(0).toUpperCase();
    if (planEl) {
        planEl.textContent = PLAN_LABELS[plan] || PLAN_LABELS.gratis;
        planEl.classList.toggle('user-meta-premium', plan !== 'gratis');
    }
}
