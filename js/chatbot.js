/* ===================================================================
   FINZY — Chatbot personalizado con IA (solo planes premium)
   Se inyecta solo en las páginas internas. Ve los movimientos y metas
   reales del usuario para responder con contexto.
   =================================================================== */

let chatHistory = [];
let chatContextLoaded = false;

function buildLockedWidget() {
    const fab = document.createElement('button');
    fab.className = 'chatbot-fab chatbot-fab-locked';
    fab.setAttribute('aria-label', 'Chat IA — solo premium');
    fab.textContent = '🔒';

    const panel = document.createElement('div');
    panel.className = 'chatbot-panel';
    panel.innerHTML = `
        <div class="chatbot-header">
            <span class="chatbot-header-title">✨ Asistente Finzy</span>
            <button class="chatbot-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="chatbot-locked-body">
            <div class="chatbot-locked-emoji">🔒</div>
            <h3>Disponible en planes premium</h3>
            <p>Sube de plan para chatear con tu asistente financiero personal, que conoce tus ingresos y gastos reales.</p>
            <a href="perfil.html" class="btn btn-primary btn-sm">Ver planes</a>
        </div>
    `;

    fab.addEventListener('click', () => panel.classList.toggle('open'));
    panel.querySelector('.chatbot-close').addEventListener('click', () => panel.classList.remove('open'));

    document.body.appendChild(fab);
    document.body.appendChild(panel);
}

function renderBubble(container, text, cls) {
    const bubble = document.createElement('div');
    bubble.className = `chatbot-bubble ${cls}`;
    bubble.textContent = text;
    container.appendChild(bubble);
    container.scrollTop = container.scrollHeight;
    return bubble;
}

function buildPremiumWidget() {
    const fab = document.createElement('button');
    fab.className = 'chatbot-fab';
    fab.setAttribute('aria-label', 'Abrir asistente Finzy');
    fab.textContent = '💬';

    const panel = document.createElement('div');
    panel.className = 'chatbot-panel';
    panel.innerHTML = `
        <div class="chatbot-header">
            <span class="chatbot-header-title">✨ Asistente Finzy</span>
            <button class="chatbot-close" aria-label="Cerrar">✕</button>
        </div>
        <div class="chatbot-messages" id="chatMessages"></div>
        <div class="chatbot-input-row">
            <input type="text" id="chatInput" placeholder="Pregúntame sobre tus finanzas...">
            <button class="chatbot-send" id="chatSend" aria-label="Enviar">➤</button>
        </div>
    `;

    document.body.appendChild(fab);
    document.body.appendChild(panel);

    const messages = panel.querySelector('#chatMessages');
    const input = panel.querySelector('#chatInput');
    const sendBtn = panel.querySelector('#chatSend');

    fab.addEventListener('click', () => {
        panel.classList.toggle('open');
        if (panel.classList.contains('open') && messages.children.length === 0) {
            renderBubble(messages, '¡Hola! Soy tu asistente financiero. Puedo ver tus ingresos, gastos y metas para darte respuestas concretas. ¿Qué quieres saber?', 'chatbot-bubble-bot');
        }
    });
    panel.querySelector('.chatbot-close').addEventListener('click', () => panel.classList.remove('open'));

    async function sendMessage() {
        const text = input.value.trim();
        if (!text) return;

        input.value = '';
        sendBtn.disabled = true;
        renderBubble(messages, text, 'chatbot-bubble-user');
        const loading = renderBubble(messages, 'Pensando...', 'chatbot-bubble-loading');

        try {
            if (!chatContextLoaded) {
                await loadChatContext();
            }

            const { data, error } = await _supabase.functions.invoke('gemini-chat', {
                body: { message: text, history: chatHistory, context: chatFinancialContext }
            });

            if (error) throw error;

            loading.remove();
            renderBubble(messages, data.reply, 'chatbot-bubble-bot');
            chatHistory.push({ role: 'user', text });
            chatHistory.push({ role: 'model', text: data.reply });
        } catch (err) {
            loading.remove();
            renderBubble(messages, 'No pude responder en este momento, intenta de nuevo.', 'chatbot-bubble-bot');
            console.error('chatbot:', err);
        } finally {
            sendBtn.disabled = false;
        }
    }

    sendBtn.addEventListener('click', sendMessage);
    input.addEventListener('keydown', (e) => { if (e.key === 'Enter') sendMessage(); });
}

let chatFinancialContext = null;

async function loadChatContext() {
    const [movements, goals, stats, name] = await Promise.all([
        getMovements(),
        getGoals(),
        calculateStats(),
        getUserName()
    ]);
    chatFinancialContext = { name, movements, goals, stats };
    chatContextLoaded = true;
}

(async () => {
    const plan = await getUserPlan();
    if (plan === 'gratis') {
        buildLockedWidget();
    } else {
        buildPremiumWidget();
    }
})();
