/* ===================================================================
   FINZY — Perfil de usuario, selección de plan y recompensa
   =================================================================== */

const PLAN_DESC = {
    gratis: 'Registro de gastos e ingresos, 1 meta activa y consejos básicos.',
    premium_mensual: 'Metas ilimitadas, gráficos avanzados y recordatorios inteligentes. $15.000/mes.',
    premium_anual: 'Todo lo de Premium + la alcancía física Finzy 3D de regalo. $150.000/año (~$12.500/mes).'
};

// Carga los datos personales del usuario en el formulario
async function loadProfileForm() {
    const { data: { user } } = await _supabase.auth.getUser();
    if (!user) return;

    document.getElementById('profileName').value = user.user_metadata?.full_name || '';
    document.getElementById('profileEmail').value = user.email || '';
    document.getElementById('profilePhone').value = user.user_metadata?.phone || '';
}

// Pinta el plan actual y muestra/oculta la sección de recompensa
async function renderCurrentPlan() {
    const plan = await getUserPlan();

    document.getElementById('planCurrentBadge').textContent = PLAN_LABELS[plan] || PLAN_LABELS.gratis;
    document.getElementById('planCurrentDesc').textContent = PLAN_DESC[plan] || PLAN_DESC.gratis;

    // Marcar visualmente la tarjeta del plan activo
    document.querySelectorAll('.plan-card').forEach(card => {
        card.classList.toggle('plan-card-active', card.dataset.plan === plan);
    });
    document.querySelectorAll('.plan-select-btn').forEach(btn => {
        const isActive = btn.dataset.plan === plan;
        btn.textContent = isActive ? 'Plan actual' : 'Seleccionar';
        btn.disabled = isActive;
    });

    // La alcancía 3D solo aplica al plan anual
    const rewardBlock = document.getElementById('rewardBlock');
    rewardBlock.style.display = plan === 'premium_anual' ? 'block' : 'none';
    if (plan === 'premium_anual') await renderRewardAddress();
}

// Muestra el formulario de dirección o la confirmación, según si ya guardó una
async function renderRewardAddress() {
    const address = await getShippingAddress();
    const form = document.getElementById('rewardAddressForm');
    const confirm = document.getElementById('rewardAddressConfirm');

    if (address && address.line1) {
        form.style.display = 'none';
        confirm.style.display = 'block';
        document.getElementById('rewardAddressText').textContent = address.details
            ? `${address.line1} — ${address.details}`
            : address.line1;
    } else {
        form.style.display = 'block';
        confirm.style.display = 'none';
    }
}

document.getElementById('saveRewardAddressBtn')?.addEventListener('click', async () => {
    const line1 = document.getElementById('rewardAddressLine1').value.trim();
    const details = document.getElementById('rewardAddressDetails').value.trim();
    const msg = document.getElementById('rewardAddressMsg');
    if (!line1) {
        msg.textContent = 'Escribe la dirección, es obligatoria.';
        return;
    }

    try {
        await setShippingAddress({ line1, details });
        await renderRewardAddress();
    } catch (err) {
        console.error('setShippingAddress:', err);
        msg.textContent = 'No se pudo guardar, intenta de nuevo.';
    }
});

document.getElementById('editRewardAddressBtn')?.addEventListener('click', async () => {
    const current = await getShippingAddress();
    document.getElementById('rewardAddressLine1').value = current?.line1 || '';
    document.getElementById('rewardAddressDetails').value = current?.details || '';
    document.getElementById('rewardAddressForm').style.display = 'block';
    document.getElementById('rewardAddressConfirm').style.display = 'none';
});

// Guardar cambios de teléfono
document.getElementById('savePhoneBtn')?.addEventListener('click', async () => {
    const phone = document.getElementById('profilePhone').value.trim();
    const msg = document.getElementById('profileSaveMsg');
    try {
        await updateUserPhone(phone);
        msg.textContent = 'Guardado ✓';
        msg.classList.add('profile-save-ok');
        setTimeout(() => { msg.textContent = ''; }, 2500);
    } catch (err) {
        console.error('updateUserPhone:', err);
        msg.textContent = 'No se pudo guardar, intenta de nuevo.';
        msg.classList.remove('profile-save-ok');
    }
});

// Selección de plan — esto es una SIMULACIÓN: guarda la elección en el
// perfil del usuario, pero no cobra nada de verdad. Falta integrar una
// pasarela de pago real (Wompi/ePayco) para procesar el cobro.
document.querySelectorAll('.plan-select-btn').forEach(btn => {
    btn.addEventListener('click', async () => {
        const plan = btn.dataset.plan;
        const label = PLAN_LABELS[plan] || plan;

        const confirmed = confirm(
            `Vas a cambiar a "${label}".\n\n` +
            `Esto es una simulación del flujo de suscripción: no se va a procesar ningún cobro real todavía. ` +
            `¿Confirmas el cambio de plan?`
        );
        if (!confirmed) return;

        btn.disabled = true;
        try {
            await setUserPlan(plan);
            await renderCurrentPlan();
            await loadUserInSidebar();
        } catch (err) {
            console.error('setUserPlan:', err);
            alert('No se pudo cambiar el plan, intenta de nuevo.');
            btn.disabled = false;
        }
    });
});

// Init
window.addEventListener('load', async () => {
    await requireAuth();
    await loadUserInSidebar();
    await loadProfileForm();
    await renderCurrentPlan();
});
