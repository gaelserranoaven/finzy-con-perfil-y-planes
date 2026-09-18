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

// ============ Selector visual de categoría ============

function renderCategoryGrid(gridId, defaultCategory = 'comida') {
    const grid = document.getElementById(gridId);
    if (!grid) return;

    grid.innerHTML = Object.entries(CATEGORIES)
        .filter(([key]) => key !== 'ingreso')
        .map(([key, cat]) => `
            <button type="button" class="category-btn${key === defaultCategory ? ' active' : ''}" data-category="${key}">
                <span class="category-btn-emoji">${cat.emoji}</span>
                <span>${cat.label}</span>
            </button>
        `).join('');

    grid.querySelectorAll('.category-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.category-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
        });
    });
}

function getSelectedCategory(gridId) {
    const active = document.querySelector(`#${gridId} .category-btn.active`);
    return active ? active.dataset.category : 'otro';
}

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

// ============ Instrumentos de inversión ============
// Catálogo educativo: en qué puede invertir el usuario, con nivel de
// riesgo, para qué sirve típicamente y una recomendación concreta.
// riskLevel: 1 (muy bajo) a 5 (muy alto).

const INSTRUMENTS = {
    cdt: {
        emoji: '🏦', label: 'CDT / Depósito a término', riskLevel: 1, riskLabel: 'Riesgo muy bajo',
        description: 'Le prestas tu dinero a un banco por un plazo fijo (30, 90, 180 días...) a cambio de un interés pactado desde el inicio.',
        recommendation: 'Ideal para dinero que vas a necesitar pronto (menos de 1 año) y no quieres que pierda valor. No genera grandes ganancias, pero es predecible y de bajo riesgo.'
    },
    fondos_indexados: {
        emoji: '📊', label: 'Fondos indexados / ETFs', riskLevel: 3, riskLabel: 'Riesgo medio',
        description: 'Un solo fondo que replica un índice (como el S&P 500), repartiendo tu dinero entre cientos de empresas a la vez.',
        recommendation: 'Recomendado para la mayoría de personas que empiezan a invertir a largo plazo (5+ años): diversifica automáticamente y tiene comisiones bajas.'
    },
    acciones: {
        emoji: '📈', label: 'Acciones de empresas', riskLevel: 4, riskLabel: 'Riesgo alto',
        description: 'Compras una parte pequeña de una empresa específica. Ganas si la empresa crece o reparte dividendos, pierdes si le va mal.',
        recommendation: 'Solo con dinero que no necesitas en el corto plazo y estudiando la empresa antes. Diversifica entre varias, nunca todo en una sola.'
    },
    cripto: {
        emoji: '🪙', label: 'Criptomonedas', riskLevel: 5, riskLabel: 'Riesgo muy alto',
        description: 'Activos digitales (Bitcoin, Ethereum, etc.) con precios muy volátiles, que pueden subir o bajar con fuerza en horas.',
        recommendation: 'Solo un porcentaje pequeño de tu dinero (el que puedas perder sin afectar tus finanzas). Nunca tu fondo de emergencia ni dinero prestado.'
    },
    oro: {
        emoji: '🟡', label: 'Oro / metales preciosos', riskLevel: 2, riskLabel: 'Riesgo bajo-medio',
        description: 'Metal físico o certificados sobre oro. Tiende a mantener su valor cuando hay inflación o crisis económicas.',
        recommendation: 'Útil como reserva de valor y para diversificar, no como la inversión principal. No genera intereses ni dividendos por sí solo.'
    },
    bienes_raices: {
        emoji: '🏠', label: 'Bienes raíces / fondos inmobiliarios', riskLevel: 3, riskLabel: 'Riesgo medio',
        description: 'Invertir en propiedades directamente o en fondos que las administran (FIBRAs/REITs), generando renta o valorización.',
        recommendation: 'Requiere capital inicial más alto (o un fondo para empezar con poco). Buen complemento a largo plazo, poco líquido si es propiedad directa.'
    },
    fondos_pension: {
        emoji: '🌳', label: 'Fondo voluntario de pensión', riskLevel: 2, riskLabel: 'Riesgo bajo-medio',
        description: 'Ahorro de largo plazo administrado por un fondo, pensado para complementar tu pensión y con beneficios tributarios.',
        recommendation: 'Pensado para décadas, no para metas de corto plazo. Revisa las comisiones del fondo antes de entrar.'
    },
    otro: {
        emoji: '💡', label: 'Otro instrumento', riskLevel: 3, riskLabel: 'Riesgo variable',
        description: 'Cualquier otra forma de inversión que no esté en la lista (negocio propio, arte, coleccionables, etc.).',
        recommendation: 'Investiga bien antes de meter dinero y ten claro cómo saldrías de esa inversión si necesitas el dinero rápido.'
    }
};

// ============ Metas de inversión ============

async function getInvestmentGoals() {
    const user = await requireAuth();
    if (!user) return [];

    const { data, error } = await _supabase
        .from('investment_goals')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: true });

    if (error) { console.error('getInvestmentGoals:', error); return []; }
    return data || [];
}

async function addInvestmentGoal(goal) {
    const user = await requireAuth();
    if (!user) return null;

    const { data, error } = await _supabase
        .from('investment_goals')
        .insert([{
            user_id: user.id,
            name: goal.name,
            emoji: goal.emoji,
            instrument: goal.instrument || 'otro',
            target: goal.target,
            saved: goal.saved || 0,
            date: goal.date || null
        }])
        .select()
        .single();

    if (error) { console.error('addInvestmentGoal:', error); return null; }
    return data;
}

async function updateInvestmentGoal(id, updates) {
    const { error } = await _supabase
        .from('investment_goals')
        .update(updates)
        .eq('id', id);

    if (error) console.error('updateInvestmentGoal:', error);
}

async function deleteInvestmentGoal(id) {
    const { error } = await _supabase
        .from('investment_goals')
        .delete()
        .eq('id', id);

    if (error) console.error('deleteInvestmentGoal:', error);
}

// ============ Cálculos ============

async function calculateStats() {
    const movs = await getMovements();
    const goals = await getGoals();
    const investmentGoals = await getInvestmentGoals();

    const income = movs.filter(m => m.type === 'income').reduce((s, m) => s + Number(m.amount), 0);
    const expense = movs.filter(m => m.type === 'expense').reduce((s, m) => s + Number(m.amount), 0);
    const saving = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
    const investing = investmentGoals.reduce((s, g) => s + Number(g.saved || 0), 0);

    return { income, expense, balance: income - expense, saving, investing };
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

// ============ Seguridad ============

// Escapa texto antes de insertarlo en innerHTML — necesario para
// descripciones de movimientos y nombres de metas, que son texto libre
// del usuario.
function escapeHTML(str) {
    if (str === null || str === undefined) return '';
    return String(str).replace(/[&<>"']/g, c => ({
        '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;'
    }[c]));
}

// ============ Formato ============

function formatMoney(n) {
    return '$' + Number(n).toLocaleString('en-US', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function formatDate(dateStr) {
    const d = new Date(dateStr + 'T00:00:00');
    return d.toLocaleDateString('es-ES', { day: 'numeric', month: 'short' });
}
