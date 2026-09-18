/* FINZY — Metas de inversión */

let selectedInstrument = 'cdt';
let currentInvGoalId = null;

function renderInstrumentGuide() {
    const grid = document.getElementById('instrumentGuideGrid');
    if (!grid) return;

    grid.innerHTML = Object.entries(INSTRUMENTS).map(([key, inst]) => `
        <article class="instrument-guide-card">
            <div class="instrument-guide-head">
                <span class="instrument-guide-emoji">${inst.emoji}</span>
                <span class="instrument-guide-name">${inst.label}</span>
            </div>
            <span class="instrument-risk-badge risk-${inst.riskLevel}">${inst.riskLabel}</span>
            <p class="instrument-guide-desc">${inst.description}</p>
            <p class="instrument-guide-reco"><strong>Recomendado:</strong> ${inst.recommendation}</p>
        </article>
    `).join('');
}

function renderInstrumentPicker() {
    const grid = document.getElementById('instrumentPickerGrid');
    if (!grid) return;

    grid.innerHTML = Object.entries(INSTRUMENTS).map(([key, inst]) => `
        <button type="button" class="instrument-picker-btn${key === selectedInstrument ? ' active' : ''}" data-instrument="${key}">
            <span class="instrument-picker-emoji">${inst.emoji}</span>
            <span>${inst.label}</span>
        </button>
    `).join('');

    grid.querySelectorAll('.instrument-picker-btn').forEach(btn => {
        btn.addEventListener('click', () => {
            grid.querySelectorAll('.instrument-picker-btn').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            selectedInstrument = btn.dataset.instrument;
        });
    });
}

async function renderInvestmentGoals() {
    const grid = document.getElementById('invGoalsGrid');
    const empty = document.getElementById('emptyInvGoals');
    const goals = await getInvestmentGoals();

    const totalSaved = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
    const totalTarget = goals.reduce((s, g) => s + Number(g.target || 0), 0);
    const pct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    document.getElementById('totalInvested').textContent = formatMoney(totalSaved);
    document.getElementById('totalInvGoal').textContent = formatMoney(totalTarget);
    document.getElementById('invGoalsCount').textContent = goals.length;
    document.getElementById('globalInvProgress').style.width = pct + '%';

    if (goals.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = goals.map(g => {
        const inst = INSTRUMENTS[g.instrument] || INSTRUMENTS.otro;
        const progress = Math.min(100, (g.saved / g.target) * 100);
        const completed = g.saved >= g.target;
        const dateLabel = g.date ? `Para el ${formatDate(g.date)}` : 'Sin fecha';

        return `
            <div class="goal-card ${completed ? 'goal-card-completed' : ''}">
                ${completed ? '<span class="completed-badge">✓ Cumplida</span>' : ''}
                <div class="goal-card-emoji">${escapeHTML(g.emoji)}</div>
                <div class="goal-card-name">${escapeHTML(g.name)}</div>
                <span class="goal-card-instrument">${inst.emoji} ${inst.label}</span>
                <div class="goal-card-date">${dateLabel}</div>
                <div class="goal-card-amounts">
                    <span class="goal-card-saved">${formatMoney(g.saved)}</span>
                    <span class="goal-card-target">/ ${formatMoney(g.target)}</span>
                </div>
                <div class="goal-card-bar">
                    <div class="goal-card-fill" style="width:${progress}%"></div>
                </div>
                <div class="goal-card-percent">
                    <strong>${progress.toFixed(0)}%</strong> completado
                </div>
                <div class="goal-card-actions">
                    <button class="goal-action-btn add-to-inv-goal" data-id="${g.id}" data-name="${escapeHTML(g.name)}">+ Aportar</button>
                    <button class="goal-action-btn danger delete-inv-goal" data-id="${g.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.add-to-inv-goal').forEach(btn => {
        btn.addEventListener('click', () => {
            currentInvGoalId = btn.dataset.id;
            document.getElementById('currentInvGoalName').textContent = btn.dataset.name;
            document.getElementById('addToInvGoalModal').classList.add('open');
        });
    });

    document.querySelectorAll('.delete-inv-goal').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('¿Eliminar esta meta de inversión? No se puede deshacer.')) {
                btn.disabled = true;
                await deleteInvestmentGoal(id);
                await renderInvestmentGoals();
            }
        });
    });
}

// Modal nueva meta de inversión
const invGoalModal = document.getElementById('invGoalModal');
document.getElementById('addInvGoalBtn')?.addEventListener('click', () => {
    renderInstrumentPicker();
    invGoalModal.classList.add('open');
});
document.getElementById('closeInvGoalModal')?.addEventListener('click', () => invGoalModal.classList.remove('open'));
invGoalModal?.addEventListener('click', (e) => { if (e.target === invGoalModal) invGoalModal.classList.remove('open'); });

document.getElementById('saveInvGoal')?.addEventListener('click', async () => {
    const name = document.getElementById('invGoalName').value.trim();
    const target = parseFloat(document.getElementById('invGoalAmount').value);
    const saved = parseFloat(document.getElementById('invGoalSaved').value) || 0;
    const date = document.getElementById('invGoalDate').value;

    if (!name || !target || target <= 0) {
        alert('Completa el nombre y un monto válido');
        return;
    }

    const inst = INSTRUMENTS[selectedInstrument] || INSTRUMENTS.otro;
    const saveBtn = document.getElementById('saveInvGoal');
    saveBtn.disabled = true;
    await addInvestmentGoal({ name, emoji: inst.emoji, instrument: selectedInstrument, target, saved, date });

    document.getElementById('invGoalName').value = '';
    document.getElementById('invGoalAmount').value = '';
    document.getElementById('invGoalSaved').value = '';
    invGoalModal.classList.remove('open');
    saveBtn.disabled = false;

    await renderInvestmentGoals();
});

// Modal aportar a meta de inversión
const addInvModal = document.getElementById('addToInvGoalModal');
document.getElementById('closeAddToInvGoal')?.addEventListener('click', () => addInvModal.classList.remove('open'));
addInvModal?.addEventListener('click', (e) => { if (e.target === addInvModal) addInvModal.classList.remove('open'); });

document.getElementById('confirmInvAdd')?.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('addInvAmount').value);
    if (!amount || amount <= 0) {
        alert('Ingresa un monto válido');
        return;
    }

    const confirmBtn = document.getElementById('confirmInvAdd');
    confirmBtn.disabled = true;
    const goals = await getInvestmentGoals();
    const goal = goals.find(g => g.id == currentInvGoalId);
    if (goal) {
        await updateInvestmentGoal(currentInvGoalId, { saved: Number(goal.saved) + amount });
    }

    document.getElementById('addInvAmount').value = '';
    addInvModal.classList.remove('open');
    confirmBtn.disabled = false;
    await renderInvestmentGoals();
});

// Init
(async () => {
    await loadUserInSidebar();
    renderInstrumentGuide();
    await renderInvestmentGoals();
})();
