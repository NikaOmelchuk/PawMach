

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    await syncUserProfile();
    document.getElementById('btn-logout').addEventListener('click', logout);

    const surveyId = window.SURVEY_ID;
    if (!surveyId) return;

    await loadSurveyDetail(surveyId);

    document.getElementById('btn-create-session')?.addEventListener('click', () => createSession(surveyId));
    document.getElementById('join-form')?.addEventListener('submit', joinSession);
});

async function loadSurveyDetail(id) {
    const container = document.getElementById('survey-detail');
    try {
        const s = await apiFetch(`/surveys/${id}/`);
        document.title = `${s.title} — PawMatch`;

        document.getElementById('survey-title').textContent = s.title;
        document.getElementById('survey-category').innerHTML =
            `<span class="badge">${s.category?.icon || '📋'} ${s.category?.name}</span>`;
        document.getElementById('survey-description').textContent = s.description || '';
        document.getElementById('survey-meta').innerHTML = `
      <span>❓ ${s.questions?.length || 0} питань</span>
      <span>👥 до ${s.max_participants} учасників</span>
    `;

        const qList = document.getElementById('questions-preview');
        if (s.questions?.length) {
            qList.innerHTML = s.questions.map((q, i) => `
        <div style="padding:0.75rem 0; border-bottom:1px solid var(--lavender-soft);">
          <div style="font-size:0.78rem; color:var(--lavender-mid); font-weight:700; margin-bottom:0.2rem;">
            ${i + 1}. ${q.question_type === 'scale' ? '🔢 Шкала' : '☑️ Вибір'}
          </div>
          <div style="font-weight:600; color:var(--text-dark);">${q.text}</div>
        </div>
      `).join('');
        } else {
            qList.innerHTML = '<p style="color:var(--text-muted)">Питання не завантажено</p>';
        }
    } catch (err) {
        container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">😿</span><h3>${err.message}</h3></div>`;
    }
}

async function createSession(surveyId) {
    const btn = document.getElementById('btn-create-session');
    btn.disabled = true;
    btn.textContent = 'Створення...';
    try {
        const session = await apiFetch('/sessions/', {
            method: 'POST',
            body: JSON.stringify({ survey_id: parseInt(surveyId) }),
        });
        showToast('Сесію створено! 🎉', 'success');
        setTimeout(() => window.location.href = `/session/${session.id}/`, 600);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = '🚀 Створити сесію';
    }
}

async function joinSession(e) {
    e.preventDefault();
    const code = document.getElementById('join-code').value.trim().toUpperCase();
    if (!code) { showToast('Введіть код', 'error'); return; }
    const btn = e.target.querySelector('button');
    btn.disabled = true;
    try {
        const data = await apiFetch('/sessions/join/', {
            method: 'POST',
            body: JSON.stringify({ session_code: code }),
        });
        showToast('Приєдналися! 🐱', 'success');
        setTimeout(() => window.location.href = `/session/${data.id}/`, 600);
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
