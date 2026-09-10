/* FINZY — Gastos */

let currentFilter = 'all';
let modalType = 'expense';

async function renderSummary() {
    const stats = await calculateStats();
    document.getElementById('totalIncome').textContent = formatMoney(stats.income);
    document.getElementById('totalExpense').textContent = formatMoney(stats.expense);
    document.getElementById('totalBalance').textContent = formatMoney(stats.balance);
}

async function renderMovements() {
    const list = document.getElementById('allMovements');
    const empty = document.getElementById('emptyState');
    let movs = await getMovements();

    if (currentFilter === 'expense') movs = movs.filter(m => m.type === 'expense');
    else if (currentFilter === 'income') movs = movs.filter(m => m.type === 'income');
    else if (currentFilter !== 'all') movs = movs.filter(m => m.category === currentFilter);

    if (movs.length === 0) {
        list.innerHTML = '';
        empty.style.display = 'block';
        return;
    }

    empty.style.display = 'none';
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
                <button class="movement-delete" data-id="${m.id}" aria-label="Eliminar">
                    <svg width="14" height="14" viewBox="0 0 14 14" fill="none"><path d="M3 3l8 8M11 3l-8 8" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>
                </button>
            </li>
        `;
    }).join('');

    document.querySelectorAll('.movement-delete').forEach(btn => {
        btn.addEventListener('click', async () => {
            const id = btn.dataset.id;
            if (confirm('¿Eliminar este movimiento?')) {
                btn.disabled = true;
                await deleteMovement(id);
                await renderSummary();
                await renderMovements();
            }
        });
    });
}

// Filtros
document.querySelectorAll('.filter-chip').forEach(chip => {
    chip.addEventListener('click', async () => {
        document.querySelectorAll('.filter-chip').forEach(c => c.classList.remove('active'));
        chip.classList.add('active');
        currentFilter = chip.dataset.filter;
        await renderMovements();
    });
});

// Modal
const modal = document.getElementById('movementModal');
const openBtn = document.getElementById('addMovementBtn');
const closeBtn = document.getElementById('closeModal');
const saveBtn = document.getElementById('saveMovement');

openBtn?.addEventListener('click', () => {
    document.getElementById('movDate').value = new Date().toISOString().split('T')[0];
    modal.classList.add('open');
});
closeBtn?.addEventListener('click', () => modal.classList.remove('open'));
modal?.addEventListener('click', (e) => { if (e.target === modal) modal.classList.remove('open'); });

document.querySelectorAll('.type-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        document.querySelectorAll('.type-btn').forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        modalType = btn.dataset.type;
    });
});

saveBtn?.addEventListener('click', async () => {
    const desc = document.getElementById('movDesc').value.trim();
    const amount = parseFloat(document.getElementById('movAmount').value);
    const category = document.getElementById('movCategory').value;
    const date = document.getElementById('movDate').value;

    if (!desc || !amount || amount <= 0 || !date) {
        alert('Completa todos los campos correctamente');
        return;
    }

    saveBtn.disabled = true;
    await addMovement({
        type: modalType,
        desc,
        amount,
        category: modalType === 'income' ? 'ingreso' : category,
        date
    });

    document.getElementById('movDesc').value = '';
    document.getElementById('movAmount').value = '';
    modal.classList.remove('open');
    saveBtn.disabled = false;

    await renderSummary();
    await renderMovements();
});

// Init
(async () => {
    await loadUserInSidebar();
    await renderSummary();
    await renderMovements();
})();
