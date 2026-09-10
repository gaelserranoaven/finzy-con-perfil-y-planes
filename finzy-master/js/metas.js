/* FINZY — Metas */

let selectedEmoji = '🎮';
let currentGoalId = null;

async function renderGoals() {
    const grid = document.getElementById('goalsGrid');
    const empty = document.getElementById('emptyGoals');
    const goals = await getGoals();

    const totalSaved = goals.reduce((s, g) => s + Number(g.saved || 0), 0);
    const totalTarget = goals.reduce((s, g) => s + Number(g.target || 0), 0);
    const pct = totalTarget > 0 ? Math.min(100, (totalSaved / totalTarget) * 100) : 0;

    document.getElementById('totalSaved').textContent = formatMoney(totalSaved);
    document.getElementById('totalGoal').textContent = formatMoney(totalTarget);
    document.getElementById('goalsCount').textContent = goals.length;
    document.getElementById('globalProgress').style.width = pct + '%';

    if (goals.length === 0) {
        grid.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
    grid.innerHTML = goals.map(g => {
        const progress = Math.min(100, (g.saved / g.target) * 100);
        const completed = g.saved >= g.target;
        const dateLabel = g.date ? `Para el ${formatDate(g.date)}` : 'Sin fecha';

        return `
            <div class="goal-card ${completed ? 'goal-card-completed' : ''}">
                ${completed ? '<span class="completed-badge">✓ Cumplida</span>' : ''}
                <div class="goal-card-emoji">${g.emoji}</div>
                <div class="goal-card-name">${g.name}</div>
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
                    <button class="goal-action-btn add-to-goal" data-id="${g.id}" data-name="${g.name}">+ Aportar</button>
                    <button class="goal-action-btn danger delete-goal" data-id="${g.id}">Eliminar</button>
                </div>
            </div>
        `;
    }).join('');

    document.querySelectorAll('.add-to-goal').forEach(btn => {
        btn.addEventListener('click', () => {
            currentGoalId = btn.dataset.id;
            document.getElementById('currentGoalName').textContent = btn.dataset.name;
            document.getElementById('addToGoalModal').classList.add('open');
        });
    });

    document.querySelectorAll('.delete-goal').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('¿Eliminar esta meta? No se puede deshacer.')) {
                btn.disabled = true;
                await deleteGoal(id);
                await renderGoals();
            }
        });
    });
}

// Modal nueva meta
const goalModal = document.getElementById('goalModal');
document.getElementById('addGoalBtn')?.addEventListener('click', () => {
    document.getElementById('goalDate').value = new Date(Date.now() + 90 * 86400000).toISOString().split('T')[0];
    goalModal.classList.add('open');
});
document.getElementById('closeGoalModal')?.addEventListener('click', () => goalModal.classList.remove('open'));
goalModal?.addEventListener('click', (e) => { if (e.target === goalModal) goalModal.classList.remove('open'); });

document.querySelectorAll('.emoji-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.emoji-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        selectedEmoji = btn.dataset.emoji;
    });
});

document.getElementById('saveGoal')?.addEventListener('click', async () => {
    const name = document.getElementById('goalName').value.trim();
    const target = parseFloat(document.getElementById('goalAmount').value);
    const saved = parseFloat(document.getElementById('goalSaved').value) || 0;
    const date = document.getElementById('goalDate').value;

    if (!name || !target || target <= 0) {
        alert('Completa el nombre y un monto válido');
        return;
    }

    const saveGoalBtn = document.getElementById('saveGoal');
    saveGoalBtn.disabled = true;
    await addGoal({ name, emoji: selectedEmoji, target, saved, date });

    document.getElementById('goalName').value = '';
    document.getElementById('goalAmount').value = '';
    document.getElementById('goalSaved').value = '';
    goalModal.classList.remove('open');
    saveGoalBtn.disabled = false;

    await renderGoals();
});

// Modal aportar a meta
const addModal = document.getElementById('addToGoalModal');
document.getElementById('closeAddToGoal')?.addEventListener('click', () => addModal.classList.remove('open'));
addModal?.addEventListener('click', (e) => { if (e.target === addModal) addModal.classList.remove('open'); });

document.getElementById('confirmAdd')?.addEventListener('click', async () => {
    const amount = parseFloat(document.getElementById('addAmount').value);
    if (!amount || amount <= 0) {
        alert('Ingresa un monto válido');
        return;
    }

    const confirmBtn = document.getElementById('confirmAdd');
    confirmBtn.disabled = true;
    const goals = await getGoals();
    const goal = goals.find(g => g.id == currentGoalId);
    if (goal) {
        await updateGoal(currentGoalId, { saved: Number(goal.saved) + amount });
    }

    document.getElementById('addAmount').value = '';
    addModal.classList.remove('open');
    confirmBtn.disabled = false;
    await renderGoals();
});

// Init
(async () => { await loadUserInSidebar(); await renderGoals(); })();
