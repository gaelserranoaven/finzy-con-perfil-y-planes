/* FINZY — Consejos con IA personalizada (Gemini) */

const CONSEJOS_ESTATICOS = [
    { cat: 'ahorro', emoji: '💰', title: 'Págate primero a ti mismo', body: 'Cuando recibas dinero, separa tu ahorro antes de gastar. Un 10% inicial ya es un gran comienzo.' },
    { cat: 'ahorro', emoji: '🎯', title: 'Define metas con nombre', body: 'Ahorrar por ahorrar es aburrido. Ponle nombre a tu meta y el cerebro responde mejor.' },
    { cat: 'gastos', emoji: '⏰', title: 'La regla de las 48 horas', body: 'Antes de comprar algo no esencial, espera 48 horas. La mayoría de impulsos se desvanecen.' },
    { cat: 'gastos', emoji: '📊', title: 'Registra todo, todo, TODO', body: 'Hasta el café de $3. Lo que no se mide, no se controla. En 30 días descubrirás patrones inesperados.' },
    { cat: 'habitos', emoji: '🍕', title: 'Cocinar es un superpoder financiero', body: 'Comer fuera 3 veces por semana puede costarte $200 al mes. Aprende 5 recetas y guarda esa plata.' },
    { cat: 'habitos', emoji: '📱', title: 'Auditoría de suscripciones', body: 'Spotify, Netflix, gym... Revisa tus suscripciones cada 3 meses. Es plata silenciosa que se va.' },
    { cat: 'habitos', emoji: '🧠', title: 'Distingue querer de necesitar', body: 'Necesitas comer. Quieres comer sushi. Ambas son válidas, pero saber cuál es cuál te ayuda a decidir mejor.' },
    { cat: 'inversion', emoji: '📈', title: 'El interés compuesto es magia', body: 'Si ahorras $50 al mes desde los 18 con un retorno del 7% anual, a los 60 tienes más de $150,000.' },
    { cat: 'inversion', emoji: '🌱', title: 'Diversifica desde el día 1', body: 'No pongas todo tu dinero en una sola cosa. Reparte el riesgo entre distintas opciones.' },
    { cat: 'ahorro', emoji: '🪙', title: 'El método de los sobres digitales', body: 'Divide tu dinero en categorías: ocio, comida, ahorro, gastos fijos. Cuando un sobre se vacía, paras.' },
    { cat: 'gastos', emoji: '🛒', title: 'Nunca compres con hambre', body: 'Cuando estás aburrido o estresado, comprás cosas que no necesitas. Identifica tus disparadores.' },
    { cat: 'habitos', emoji: '🎓', title: 'Invierte en ti antes que en cosas', body: 'Un curso de $50 que te da una nueva habilidad vale más que unos audífonos de $200.' }
];

let currentCat = 'all';
let personalizedCards = [];

// Renderizar consejos estáticos filtrados
function renderConsejos() {
    const grid = document.getElementById('consejosGrid');
    const filtered = currentCat === 'all' ? CONSEJOS_ESTATICOS : CONSEJOS_ESTATICOS.filter(c => c.cat === currentCat);

    const staticHTML = filtered.map(c => `
        <article class="consejo-card">
            <div class="consejo-card-emoji">${c.emoji}</div>
            <div class="consejo-card-cat">/ ${c.cat}</div>
            <h3 class="consejo-card-title">${c.title}</h3>
            <p class="consejo-card-body">${c.body}</p>
        </article>
    `).join('');

    grid.innerHTML = staticHTML;
}

// Renderizar sección de consejos personalizados con IA
function renderPersonalizedSection(cards) {
    const existing = document.getElementById('aiConsejosSection');
    if (existing) existing.remove();

    const section = document.createElement('section');
    section.id = 'aiConsejosSection';
    section.style.cssText = 'margin-bottom: 32px;';

    section.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="flex:1;height:1px;background:rgba(26,24,20,0.08);"></div>
            <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:var(--ink-muted);text-transform:uppercase;white-space:nowrap;">✨ Para ti, basado en tus datos</span>
            <div style="flex:1;height:1px;background:rgba(26,24,20,0.08);"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
            ${cards.map(c => `
                <article class="consejo-card" style="border:1.5px solid rgba(212,245,66,0.4);background:linear-gradient(135deg,#fff 0%,rgba(212,245,66,0.06) 100%);position:relative;overflow:hidden;">
                    <div style="position:absolute;top:12px;right:12px;font-size:10px;font-weight:700;letter-spacing:0.06em;color:#2D9D5F;background:#2D9D5F15;padding:3px 8px;border-radius:20px;text-transform:uppercase;">IA</div>
                    <div class="consejo-card-emoji">${c.emoji}</div>
                    <div class="consejo-card-cat">/ ${c.categoria}</div>
                    <h3 class="consejo-card-title">${c.titulo}</h3>
                    <p class="consejo-card-body">${c.consejo}</p>
                </article>
            `).join('')}
        </div>
    `;

    const grid = document.getElementById('consejosGrid');
    grid.parentNode.insertBefore(section, grid);
}

// Skeleton loader mientras carga Gemini
function showAISkeleton() {
    const existing = document.getElementById('aiConsejosSection');
    if (existing) existing.remove();

    const section = document.createElement('section');
    section.id = 'aiConsejosSection';
    section.style.cssText = 'margin-bottom: 32px;';
    section.innerHTML = `
        <div style="display:flex;align-items:center;gap:12px;margin-bottom:20px;">
            <div style="flex:1;height:1px;background:rgba(26,24,20,0.08);"></div>
            <span style="font-size:12px;font-weight:700;letter-spacing:0.08em;color:var(--ink-muted);text-transform:uppercase;white-space:nowrap;">✨ Generando consejos personalizados...</span>
            <div style="flex:1;height:1px;background:rgba(26,24,20,0.08);"></div>
        </div>
        <div style="display:grid;grid-template-columns:repeat(auto-fill,minmax(280px,1fr));gap:16px;">
            ${[1,2,3].map(() => `
                <div style="background:white;border-radius:16px;padding:24px;border:1.5px solid rgba(26,24,20,0.06);">
                    <div style="width:40px;height:40px;background:rgba(26,24,20,0.06);border-radius:50%;margin-bottom:16px;animation:pulse 1.5s infinite;"></div>
                    <div style="height:12px;background:rgba(26,24,20,0.06);border-radius:6px;margin-bottom:10px;width:60%;animation:pulse 1.5s infinite;"></div>
                    <div style="height:16px;background:rgba(26,24,20,0.08);border-radius:6px;margin-bottom:12px;animation:pulse 1.5s infinite;"></div>
                    <div style="height:12px;background:rgba(26,24,20,0.06);border-radius:6px;margin-bottom:8px;animation:pulse 1.5s infinite;"></div>
                    <div style="height:12px;background:rgba(26,24,20,0.06);border-radius:6px;width:75%;animation:pulse 1.5s infinite;"></div>
                </div>
            `).join('')}
        </div>
        <style>@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }</style>
    `;
    const grid = document.getElementById('consejosGrid');
    grid.parentNode.insertBefore(section, grid);
}

// Filtros
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentCat = chip.dataset.cat;
        renderConsejos();
    });
});

// Init
(async () => {
    await loadUserInSidebar();
    renderConsejos();

    // Intentar cargar consejos personalizados con Gemini
    try {
        showAISkeleton();

        const user = await requireAuth();
        if (!user) return;

        // Obtener datos del usuario para contexto
        const [movements, goals, stats, name] = await Promise.all([
            getMovements(),
            getGoals(),
            calculateStats(),
            getUserName()
        ]);

        const cards = await getPersonalizedAdvice({ name, movements, goals, stats });

        if (cards && cards.length > 0) {
            personalizedCards = cards;
            renderPersonalizedSection(cards);
        } else {
            const sec = document.getElementById('aiConsejosSection');
            if (sec) sec.remove();
        }
    } catch (err) {
        console.warn('Gemini no disponible:', err.message);
        const sec = document.getElementById('aiConsejosSection');
        if (sec) sec.remove();
        // Falla silenciosa — los consejos estáticos siguen funcionando
    }
})();
