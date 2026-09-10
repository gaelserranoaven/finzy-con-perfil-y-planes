/* FINZY — Landing page auth */

const authModal = document.getElementById('authModal');
let authMode = 'login';

function switchTab(mode) {
    authMode = mode;
    const tLogin = document.getElementById('tabLogin');
    const tReg = document.getElementById('tabRegister');
    const submit = document.getElementById('authSubmit');

    if (mode === 'login') {
        tLogin.style.cssText = 'padding:10px;border:none;cursor:pointer;border-radius:9px;font-family:var(--font-display);font-size:14px;font-weight:600;background:#1A1814;color:#FBF8F3;transition:all 0.2s;';
        tReg.style.cssText = 'padding:10px;border:none;cursor:pointer;border-radius:9px;font-family:var(--font-display);font-size:14px;font-weight:600;background:transparent;color:var(--ink-muted);transition:all 0.2s;';
        submit.textContent = 'Entrar';
    } else {
        tReg.style.cssText = 'padding:10px;border:none;cursor:pointer;border-radius:9px;font-family:var(--font-display);font-size:14px;font-weight:600;background:#1A1814;color:#FBF8F3;transition:all 0.2s;';
        tLogin.style.cssText = 'padding:10px;border:none;cursor:pointer;border-radius:9px;font-family:var(--font-display);font-size:14px;font-weight:600;background:transparent;color:var(--ink-muted);transition:all 0.2s;';
        submit.textContent = 'Crear cuenta';
    }
    document.getElementById('authError').style.display = 'none';
    document.getElementById('registerFields').style.display = mode === 'register' ? 'block' : 'none';
}

async function handleAuth() {
    const email = document.getElementById('authEmail').value.trim();
    const password = document.getElementById('authPassword').value;
    const errBox = document.getElementById('authError');
    const btn = document.getElementById('authSubmit');

    errBox.style.display = 'none';

    if (!email || !password) {
        errBox.textContent = 'El email y la contraseña son obligatorios';
        errBox.style.display = 'block';
        return;
    }

    if (authMode === 'register') {
        const fullName = document.getElementById('authFullName').value.trim();
        if (!fullName) {
            errBox.textContent = 'El nombre completo es obligatorio';
            errBox.style.display = 'block';
            return;
        }
        if (password.length < 6) {
            errBox.textContent = 'La contraseña debe tener al menos 6 caracteres';
            errBox.style.display = 'block';
            return;
        }
    }

    btn.disabled = true;
    btn.textContent = 'Cargando...';

    try {
        if (authMode === 'login') {
            await login(email, password);
            window.location.href = 'dashboard.html';
        } else {
            const fullName = document.getElementById('authFullName').value.trim();
            const phone = document.getElementById('authPhone').value.trim();
            await register(email, password, fullName, phone);
            window.location.href = 'dashboard.html';
        }
    } catch (err) {
        let msg = err.message || 'Error de autenticación';
        if (msg.includes('Invalid login')) msg = 'Email o contraseña incorrectos';
        if (msg.includes('already registered')) msg = 'Este email ya está registrado. Intentá iniciar sesión.';
        if (msg.includes('Password should be')) msg = 'La contraseña debe tener al menos 6 caracteres';
        errBox.textContent = msg;
        errBox.style.display = 'block';
        btn.disabled = false;
        btn.textContent = authMode === 'login' ? 'Entrar' : 'Crear cuenta';
    }
}

// Tecla Enter para submit
document.addEventListener('keydown', (e) => {
    if (e.key === 'Enter' && authModal.classList.contains('open')) {
        handleAuth();
    }
});

// Redirigir si ya hay sesión
(async () => {
    const { data: { user } } = await _supabase.auth.getUser();
    if (user) window.location.href = 'dashboard.html';
})();