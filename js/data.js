/* ===================================================================
   FINZY — Capa de datos (Supabase)
   =================================================================== */

const CATEGORIES = {
    comida: { emoji: '🍔', label: 'Comida', color: '#FF8FB5' },
    transporte: { emoji: '🚌', label: 'Transporte', color: '#4ECDC4' },
    entretenimiento: { emoji: '🎮', label: 'Entretenimiento', color: '#6B4EFF' },
    ropa: { emoji: '👕', label: 'Ropa', color: '#FFD93D' },
    educacion: { emoji: '📚', label: 'Educación', color: '#D4F542' },
    salud: { emoji: '⚕️', label: 'Salud', color: '#FF5B3E' },
    otro: { emoji: '💫', label: 'Otro', color: '#8A8580' },
    ingreso: { emoji: '💰', label: 'Ingreso', color: '#2D9D5F' }
};

// ============ Movimientos ============

async function getMovements() {
    const user = await requireAuth();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('movements')
        .select('*')
        .eq('user_id', user.id)
        .order('date', { ascending: false });

    if (error) { console.error('getMovements:', error); return []; }
    return data || [];
}

async function addMovement(mov) {
    const user = await requireAuth();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('movements')
        .insert([{
            user_id: user.id,
            type: mov.type,
            description: mov.desc,   // ← este cambio
            amount: mov.amount,
            category: mov.category,
            date: mov.date
        }])
        .select()
        .single();

    if (error) { console.error('addMovement:', error); return null; }
    return data;
}

async function deleteMovement(id) {
    const { error } = await _supabase
        .from('movements')
        .delete()
        .eq('id', id);

    if (error) console.error('deleteMovement:', error);
}

// ============ Metas ============

async function getGoals() {
    const user = await requireAuth();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) { console.error('getGoals:', error); return []; }
    return data || [];
}

async function addGoal(goal) {
    const user = await requireAuth();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('goals')
        .insert([{
            user_id: user.id,
            name: goal.name,
            emoji: goal.emoji,
            target: goal.target,
            saved: goal.saved || 0,
            date: goal.date || null
        }])
        .select()
        .single();

    if (error) { console.error('addGoal:', error); return null; }
    return data;
}

async function updateGoal(id, updates) {
    const { error } = await _supabase
        .from('goals')
        .update(updates)
        .eq('id', id);

    if (error) console.error('updateGoal:', error);
}

async function deleteGoal(id) {
    const { error } = await _supabase
        .from('goals')
        .delete()
        .eq('id', id);

    if (error) console.error('deleteGoal:', error);
}

// ============ Cálculos ============

async function calculateStats() {
    const movs = await getMovements();
    const goals = await getGoals();

    const income = movs.filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount), 0);
    const expense = movs.filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount), 0);
    const saving = goals.reduce((s, g) => s + Number(g.saved || 0), 0);

    return { income, expense, balance: income - expense, saving };
}

async function categoryBreakdown() {
    const movs = (await getMovements()).filter(m => m.type === 'expense');
    const map = {};
    movs.forEach(m => {
        if (!map[m.category]) map[m.category] = 0;
        map[m.category] += Number(m.amount);
    });
    return Object.entries(map)
        .map(([key, value]) => ({ key, value, ...CATEGORIES[key] }))
        .sort((a, b) => b.value - a.value);
}

// ============ Formato ============

function formatMoney(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
