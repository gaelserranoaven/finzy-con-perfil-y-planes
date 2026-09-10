/* FINZY — Dashboard */

async function renderStats() {
    const stats = await calculateStats();
    document.getElementById('balanceAmount').textContent = formatMoney(stats.balance);
    document.getElementById('incomeAmount').textContent = formatMoney(stats.income);
    document.getElementById('expenseAmount').textContent = formatMoney(stats.expense);
    document.getElementById('savingAmount').textContent = formatMoney(stats.saving);
}

async function renderRecent() {
    const list = document.getElementById('recentMovements');
    const movs = (await getMovements()).slice(0, 5);

    if (movs.length === 0) {
        list.innerHTML = '<li style="padding:24px;text-align:center;color:var(--ink-muted);font-size:14px">Aún no hay movimientos</li>';
        return;
    }

    list.innerHTML = movs.map(m => {
        const cat = CATEGORIES[m.category] || CATEGORIES.otro;
        const sign = m.type === 'income' ? '+' : '-';
        return `
            <li class="movement-item">
                <div class="movement-icon" style="background:${cat.color}22">${cat.emoji}</div>
                <div class="movement-info">
                    <div class="movement-desc">${m.description}</div>
                    <div class="movement-meta">${cat.label} · ${formatDate(m.date)}</div>
                </div>
                <div class="movement-amount ${m.type}">${sign}${formatMoney(m.amount)}</div>
            </li>
        `;
    }).join('');
}

async function renderChart() {
    const canvas = document.getElementById('categoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const data = await categoryBreakdown();
    const legend = document.getElementById('chartLegend');

    const wrap = canvas.parentElement;
    const size = Math.min(wrap.clientWidth, wrap.clientHeight);
    canvas.width = size * 2;
    canvas.height = size * 2;
    canvas.style.width = size + 'px';
    canvas.style.height = size + 'px';
    ctx.scale(2, 2);

    if (data.length === 0) {
        ctx.fillStyle = '#8A8580';
        ctx.font = '14px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('Sin gastos registrados', size / 2, size / 2);
        legend.innerHTML = '';
        return;
    }

    const total = data.reduce((s, d) => s + d.value, 0);
    const cx = size / 2, cy = size / 2;
    const outerR = size / 2 - 20;
    const innerR = outerR * 0.6;
    let startAngle = -Math.PI / 2;

    data.forEach(d => {
        const slice = (d.value / total) * Math.PI * 2;
        const endAngle = startAngle + slice;
        ctx.beginPath();
        ctx.moveTo(cx, cy);
        ctx.arc(cx, cy, outerR, startAngle, endAngle);
        ctx.closePath();
        ctx.fillStyle = d.color;
        ctx.fill();
        startAngle = endAngle;
    });

    ctx.beginPath();
    ctx.arc(cx, cy, innerR, 0, Math.PI * 2);
    ctx.fillStyle = '#FBF8F3';
    ctx.fill();

    ctx.fillStyle = '#1A1814';
    ctx.font = 'bold 28px Bricolage Grotesque, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(formatMoney(total), cx, cy - 6);
    ctx.font = '11px Bricolage Grotesque, sans-serif';
    ctx.fillStyle = '#8A8580';
    ctx.fillText('total gastado', cx, cy + 16);

    legend.innerHTML = data.map(d => `
        <div class="legend-item">
            <div class="legend-left">
                <span class="legend-dot" style="background:${d.color}"></span>
                <span>${d.emoji} ${d.label}</span>
            </div>
            <span class="legend-amount">${formatMoney(d.value)}</span>
        </div>
    `).join('');
}

async function renderNextGoal() {
    const goals = await getGoals();
    const container = document.getElementById('nextGoalContainer');
    if (!container) return;
    if (goals.length === 0) {
        container.innerHTML = '<p style="color:var(--ink-muted);font-size:14px;padding:16px">Sin metas activas</p>';
        return;
    }
    const g = goals[0];
    const progress = Math.min(100, (g.saved / g.target) * 100);
    container.innerHTML = `
        <div class="goal-emoji-big">${g.emoji}</div>
        <div class="goal-info">
            <div class="goal-name">${g.name}</div>
            <div class="goal-progress-bar">
                <div class="goal-progress-fill" style="width:${progress}%"></div>
            </div>
            <div class="goal-stats">
                <span><strong>${formatMoney(g.saved)}</strong> / ${formatMoney(g.target)}</span>
                <span class="goal-percent">${progress.toFixed(0)}%</span>
            </div>
        </div>
    `;
}

// Modal quick add
const modal = document.getElementById('quickAddModal');
const addBtn = document.getElementById('addQuickBtn');
const closeBtn = document.getElementById('closeQuickModal');
const saveBtn = document.getElementById('saveQuickMovement');
let quickType = 'expense';

addBtn?.addEventListener('click', () => modal.classList.add('open'));
closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        quickType = btn.dataset.type;
    });
});

saveBtn?.addEventListener('click', async () => {
    const desc = document.getElementById('quickDesc').value.trim();
    const amount = parseFloat(document.getElementById('quickAmount').value);
    const category = document.getElementById('quickCategory').value;

    if (!desc || !amount || amount <= 0) {
        alert('Completa la descripción y un monto válido');
        return;
    }

    saveBtn.disabled = true;
    await addMovement({
        type: quickType,
        desc,
        amount,
        category: quickType === 'income' ? 'ingreso' : category,
        date: new Date().toISOString().split('T')[0]
    });

    document.getElementById('quickDesc').value = '';
    document.getElementById('quickAmount').value = '';
    modal.classList.remove('open');
    saveBtn.disabled = false;

    await renderStats();
    await renderRecent();
    await renderChart();
});

// Init
window.addEventListener('load', async () => {
    const name = await getUserName();
    const greetEl = document.getElementById('userGreeting');
    if (greetEl) greetEl.textContent = name;
    await loadUserInSidebar();

    // Subtítulo con mes actual
    const subtitle = document.getElementById('pageSubtitle');
    if (subtitle) {
        const now = new Date();
        const mes = now.toLocaleDateString('es-ES', { month: 'long', year: 'numeric' });
        subtitle.textContent = `Aquí está cómo va tu mes — ${mes.charAt(0).toUpperCase() + mes.slice(1)}`;
    }

    await renderStats();
    await renderRecent();
    await renderChart();
    await renderNextGoal();
});

window.addEventListener('resize', () => { renderChart(); });
