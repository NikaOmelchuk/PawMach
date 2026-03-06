

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    await syncUserProfile();

    document.getElementById('btn-logout').addEventListener('click', logout);

    await loadCategories();
    await loadSurveys();

    document.getElementById('join-form').addEventListener('submit', joinSession);
});

let activeCategory = null;

async function loadCategories() {
    try {
        const data = await apiFetch('/categories/');
        const results = data.results || data;
        const container = document.getElementById('category-tabs');
        container.innerHTML = `<button class="filter-tab active" data-id="">Всі</button>`;
        results.forEach(cat => {
            const btn = document.createElement('button');
            btn.className = 'filter-tab';
            btn.dataset.id = cat.id;
            btn.textContent = `${cat.icon} ${cat.name}`;
            container.appendChild(btn);
        });
        container.addEventListener('click', (e) => {
            const tab = e.target.closest('.filter-tab');
            if (!tab) return;
            container.querySelectorAll('.filter-tab').forEach(t => t.classList.remove('active'));
            tab.classList.add('active');
            activeCategory = tab.dataset.id || null;
            loadSurveys(activeCategory);
        });
    } catch (err) {
        console.error('Категорії:', err);
    }
}

async function loadSurveys(categoryId = null) {
    const container = document.getElementById('surveys-grid');
    container.innerHTML = `<div class="loader"><div class="spinner"></div><span>Завантаження...</span></div>`;
    try {
        const url = categoryId ? `/surveys/?category=${categoryId}` : '/surveys/';
        const data = await apiFetch(url);
        const results = data.results || data;

        if (!results.length) {
            container.innerHTML = `
        <div class="empty-state" style="grid-column:1/-1">
          <span class="empty-state-icon">🐱</span>
          <h3>Опитувань ще немає</h3>
          <p>Адмін може додати їх через панель або API</p>
        </div>`;
            return;
        }

        container.innerHTML = results.map(s => `
      <div class="card survey-card" data-id="${s.id}">
        <div class="survey-card-header">
          <span class="badge">${s.category?.icon || '📋'} ${s.category?.name || ''}</span>
          ${s.is_active ? '' : '<span class="badge badge-warning">Неактивне</span>'}
        </div>
        <div class="card-title">${s.title}</div>
        <div class="card-body">${s.description || 'Без опису'}</div>
        <div class="survey-card-footer">
          <div class="survey-meta">
            <span>❓ ${s.question_count} питань</span>
            <span>👥 до ${s.max_participants}</span>
          </div>
          <a href="/survey/${s.id}/" class="btn btn-primary btn-sm">Почати →</a>
        </div>
      </div>
    `).join('');
    } catch (err) {
        container.innerHTML = `<div class="empty-state" style="grid-column:1/-1"><span class="empty-state-icon">😿</span><h3>${err.message}</h3></div>`;
    }
}

async function joinSession(e) {
    e.preventDefault();
    const input = document.getElementById('join-code');
    const code = input.value.trim().toUpperCase();
    if (!code) { showToast('Введіть код сесії', 'error'); return; }
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
        const data = await apiFetch('/sessions/join/', {
            method: 'POST',
            body: JSON.stringify({ session_code: code }),
        });
        showToast(`Ви приєднались до сесії ${data.session_code}! 🎉`, 'success');
        setTimeout(() => window.location.href = `/session/${data.id}/`, 800);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
    }
}

async function logout() {
    try { await apiFetch('/auth/logout/', { method: 'POST' }); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
