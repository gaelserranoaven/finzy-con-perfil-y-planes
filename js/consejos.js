/* FINZY — Consejos con IA personalizada (OpenAI) */

const CONSEJOS_ESTATICOS = [
    // ============ AHORRO ============
    { cat: 'ahorro', emoji: '💰', title: 'Págate primero a ti mismo', body: 'Cuando recibas dinero, separa tu ahorro antes de gastar. Un 10% inicial ya es un gran comienzo.' },
    { cat: 'ahorro', emoji: '🎯', title: 'Define metas con nombre', body: 'Ahorrar por ahorrar es aburrido. Ponle nombre a tu meta y el cerebro responde mejor.' },
    { cat: 'ahorro', emoji: '🪙', title: 'El método de los sobres digitales', body: 'Divide tu dinero en categorías: ocio, comida, ahorro, gastos fijos. Cuando un sobre se vacía, paras.' },
    { cat: 'ahorro', emoji: '🏦', title: 'Fondo de emergencia primero', body: 'Antes de invertir o darte gustos grandes, junta 3 meses de gastos básicos. Es tu colchón para cuando algo salga mal.' },
    { cat: 'ahorro', emoji: '🤖', title: 'Automatiza tu ahorro', body: 'Programa una transferencia automática el día que te pagan. Si tienes que decidir cada mes, casi nunca ahorras lo mismo.' },
    { cat: 'ahorro', emoji: '🎉', title: 'Ahorra tus "extras"', body: 'Bonos, regalos de cumpleaños, devoluciones de impuestos: ese dinero que no esperabas es el más fácil de ahorrar completo.' },
    { cat: 'ahorro', emoji: '🔄', title: 'Redondea tus compras', body: 'Si algo cuesta $47, guarda $50 y aparta esos $3. Suena poco, pero en un año se nota.' },
    { cat: 'ahorro', emoji: '📅', title: 'El reto de las 52 semanas', body: 'Semana 1 ahorras $1.000, semana 2 $2.000, y así subiendo. Al final del año tienes un ahorro considerable sin sentirlo tanto.' },
    { cat: 'ahorro', emoji: '🎁', title: 'Ahorra antes de un antojo grande', body: 'Si quieres algo caro, no lo compres a crédito: ábrete una meta y ahorra durante unas semanas. Si sigues queriéndolo, cómpralo de contado.' },
    { cat: 'ahorro', emoji: '📉', title: 'Ahorra la diferencia', body: 'Si consigues algo más barato de lo presupuestado (un pasaje, una compra), transfiere la diferencia directo a tu ahorro antes de gastarla en otra cosa.' },

    // ============ GASTOS ============
    { cat: 'gastos', emoji: '⏰', title: 'La regla de las 48 horas', body: 'Antes de comprar algo no esencial, espera 48 horas. La mayoría de impulsos se desvanecen.' },
    { cat: 'gastos', emoji: '📊', title: 'Registra todo, todo, TODO', body: 'Hasta el café de $3. Lo que no se mide, no se controla. En 30 días descubrirás patrones inesperados.' },
    { cat: 'gastos', emoji: '🛒', title: 'Nunca compres con hambre', body: 'Cuando estás aburrido o estresado, comprás cosas que no necesitas. Identifica tus disparadores.' },
    { cat: 'gastos', emoji: '📋', title: 'Haz lista antes de comprar', body: 'Ir al súper o al centro comercial sin lista es la receta perfecta para gastar de más. La lista te obliga a decidir antes, no en el momento.' },
    { cat: 'gastos', emoji: '💳', title: 'Cuidado con "lo pago después"', body: 'Comprar a cuotas hace que todo se sienta más barato de lo que es. Suma siempre el costo total con intereses antes de decir que sí.' },
    { cat: 'gastos', emoji: '🔍', title: 'Compara antes de comprar', body: 'Dos minutos comparando precios en otra tienda o app pueden ahorrarte más que media hora de trabajo.' },
    { cat: 'gastos', emoji: '🚨', title: 'Cuidado con las rebajas falsas', body: 'Un "50% de descuento" en algo que no necesitabas sigue siendo un gasto que no necesitabas. La oferta no te obliga a comprar.' },
    { cat: 'gastos', emoji: '📱', title: 'Desactiva el "un clic"', body: 'Quita tu tarjeta guardada de las apps de compra. Ese segundo extra de escribir los datos a mano es suficiente para pensarlo dos veces.' },
    { cat: 'gastos', emoji: '🎯', title: 'Ponle límite a los gustos', body: 'No se trata de no gastar en lo que te gusta, sino de definir un monto fijo al mes para eso y no pasarte.' },
    { cat: 'gastos', emoji: '🧾', title: 'Revisa tus gastos fijos cada semestre', body: 'Plan de datos, seguros, servicios: negocia o cambia de proveedor cada 6 meses. Casi siempre hay una opción más barata para lo mismo.' },

    // ============ HÁBITOS ============
    { cat: 'habitos', emoji: '🍕', title: 'Cocinar es un superpoder financiero', body: 'Comer fuera 3 veces por semana puede costarte $200 al mes. Aprende 5 recetas y guarda esa plata.' },
    { cat: 'habitos', emoji: '📱', title: 'Auditoría de suscripciones', body: 'Spotify, Netflix, gym... Revisa tus suscripciones cada 3 meses. Es plata silenciosa que se va.' },
    { cat: 'habitos', emoji: '🧠', title: 'Distingue querer de necesitar', body: 'Necesitas comer. Quieres comer sushi. Ambas son válidas, pero saber cuál es cuál te ayuda a decidir mejor.' },
    { cat: 'habitos', emoji: '🎓', title: 'Invierte en ti antes que en cosas', body: 'Un curso de $50 que te da una nueva habilidad vale más que unos audífonos de $200.' },
    { cat: 'habitos', emoji: '📆', title: 'Ponte un día de revisión financiera', body: 'Elige un día fijo cada semana (15 minutos bastan) para revisar cómo va tu plata. Lo que se revisa seguido, se controla mejor.' },
    { cat: 'habitos', emoji: '🗣️', title: 'Habla de dinero sin pena', body: 'Comparar precios, preguntar cuánto gana un amigo en un negocio, negociar un sueldo: hablar de plata abiertamente te da mejor información para decidir.' },
    { cat: 'habitos', emoji: '🏆', title: 'Celebra tus logros financieros', body: 'Cuando cumplas una meta de ahorro o pagues una deuda, date un gusto pequeño y planeado. Refuerza el hábito en vez de sabotearlo.' },
    { cat: 'habitos', emoji: '👥', title: 'Cuidado con la presión social', body: 'No tienes que ir a todo, comprar todo o vestir igual que tus amigos. Gastar para encajar es de las formas más comunes de quedarse sin plata.' },
    { cat: 'habitos', emoji: '📚', title: 'Sigue aprendiendo de finanzas', body: 'Un podcast, un libro o un video a la semana sobre dinero cambia cómo decides en meses, no en años.' },
    { cat: 'habitos', emoji: '🧘', title: 'No decidas con emociones fuertes', body: 'Las peores decisiones de plata se toman triste, ansioso o eufórico. Si puedes, espera a estar en calma antes de gastar o invertir algo grande.' },

    // ============ INVERSIÓN ============
    { cat: 'inversion', emoji: '📈', title: 'El interés compuesto es magia', body: 'Si ahorras $50 al mes desde los 18 con un retorno del 7% anual, a los 60 tienes más de $150,000.' },
    { cat: 'inversion', emoji: '🌱', title: 'Diversifica desde el día 1', body: 'No pongas todo tu dinero en una sola cosa. Reparte el riesgo entre distintas opciones.' },
    { cat: 'inversion', emoji: '⏳', title: 'Empieza aunque sea poco', body: 'No necesitas mucho dinero para empezar a invertir, necesitas tiempo. Empezar con poco hoy vale más que esperar a tener "suficiente".' },
    { cat: 'inversion', emoji: '🎢', title: 'El riesgo y el retorno van juntos', body: 'Si algo promete ganancias muy altas sin riesgo, no es una inversión: es una estafa. Toda inversión real tiene algún nivel de riesgo.' },
    { cat: 'inversion', emoji: '🧊', title: 'No inviertas tu fondo de emergencia', body: 'El dinero que puedas necesitar rápido no debe estar en algo que puede bajar de valor. Invierte solo lo que no necesitas en el corto plazo.' },
    { cat: 'inversion', emoji: '📖', title: 'Entiende antes de invertir', body: 'Si no puedes explicarle a un amigo cómo funciona una inversión en un minuto, todavía no estás listo para meterle tu plata.' },
    { cat: 'inversion', emoji: '🔁', title: 'Reinvierte tus ganancias', body: 'Cuando algo te dé rendimientos, en vez de gastarlos, vuelve a invertirlos. Así el interés compuesto trabaja más rápido para ti.' },
    { cat: 'inversion', emoji: '🕰️', title: 'El tiempo en el mercado gana', body: 'Tratar de "adivinar el momento perfecto" para invertir suele salir peor que simplemente invertir de forma constante y esperar.' }
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

// Skeleton loader mientras carga la IA
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

    // Intentar cargar consejos personalizados con IA
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
        console.warn('Asistente IA no disponible:', err.message);
        const sec = document.getElementById('aiConsejosSection');
        if (sec) sec.remove();
        // Falla silenciosa — los consejos estáticos siguen funcionando
    }
})();
