

document.addEventListener('DOMContentLoaded', () => {
    if (isLoggedIn()) {
        window.location.href = '/dashboard/';
        return;
    }

    const tabLogin = document.getElementById('tab-login');
    const tabRegister = document.getElementById('tab-register');
    const formLogin = document.getElementById('form-login');
    const formReg = document.getElementById('form-register');

    tabLogin?.addEventListener('click', () => switchTab('login'));
    tabRegister?.addEventListener('click', () => switchTab('register'));

    function switchTab(tab) {
        if (tab === 'login') {
            tabLogin.classList.add('active');
            tabRegister.classList.remove('active');
            formLogin.classList.remove('hidden');
            formReg.classList.add('hidden');
        } else {
            tabRegister.classList.add('active');
            tabLogin.classList.remove('active');
            formReg.classList.remove('hidden');
            formLogin.classList.add('hidden');
        }
    }

    formLogin?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formLogin.querySelector('button[type=submit]');
        btn.disabled = true;
        btn.textContent = 'Вхід...';
        try {
            const data = await apiFetch('/auth/login/', {
                method: 'POST',
                body: JSON.stringify({
                    email: formLogin.email.value.trim(),
                    password: formLogin.password.value,
                }),
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast(`Ласкаво просимо, ${data.user.username}! 🐱`, 'success');
            setTimeout(() => window.location.href = '/dashboard/', 600);
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Увійти';
        }
    });

    formReg?.addEventListener('submit', async (e) => {
        e.preventDefault();
        const btn = formReg.querySelector('button[type=submit]');
        if (formReg.password.value !== formReg.password2.value) {
            showToast('Паролі не збігаються', 'error');
            return;
        }
        btn.disabled = true;
        btn.textContent = 'Реєстрація...';
        try {
            const data = await apiFetch('/auth/register/', {
                method: 'POST',
                body: JSON.stringify({
                    username: formReg.username.value.trim(),
                    email: formReg.email.value.trim(),
                    password: formReg.password.value,
                    password2: formReg.password2.value,
                }),
            });
            localStorage.setItem('token', data.token);
            localStorage.setItem('user', JSON.stringify(data.user));
            showToast('Акаунт створено! 🎉', 'success');
            setTimeout(() => window.location.href = '/dashboard/', 600);
        } catch (err) {
            showToast(err.message, 'error');
            btn.disabled = false;
            btn.textContent = 'Зареєструватись';
        }
    });
});
