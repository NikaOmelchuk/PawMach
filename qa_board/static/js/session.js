

let session = null;
let questions = [];
let answers = {};
let currentQ = 0;

document.addEventListener('DOMContentLoaded', async () => {
    if (!requireAuth()) return;

    await syncUserProfile();
    document.getElementById('btn-logout').addEventListener('click', logout);

    const sessionId = window.SESSION_ID;
    if (!sessionId) return;

    await loadSession(sessionId);
});

async function loadSession(id) {
    try {
        session = await apiFetch(`/sessions/${id}/`);
        const survey = await apiFetch(`/surveys/${session.survey.id}/`);
        questions = survey.questions || [];

        document.getElementById('session-title').textContent = session.survey.title;
        document.getElementById('session-code-display').textContent = session.session_code;

        renderParticipants();

        const isOwner = session.created_by?.id === getCurrentUser()?.id;
        if (isOwner && session.status !== 'completed') {
            document.getElementById('complete-section').classList.remove('hidden');
            document.getElementById('btn-complete').addEventListener('click', () => completeSession(id));
        }

        if (questions.length) {
            renderQuestion();
        } else {
            document.getElementById('quiz-area').innerHTML =
                '<div class="empty-state"><span class="empty-state-icon">🐱</span><h3>Питань немає</h3></div>';
        }

        document.getElementById('btn-prev').addEventListener('click', () => navigate(-1));
        document.getElementById('btn-next').addEventListener('click', () => navigate(1));
        document.getElementById('btn-submit').addEventListener('click', () => submitAnswers(id));

        document.getElementById('session-code-display').addEventListener('click', () => {
            navigator.clipboard.writeText(session.session_code);
            showToast('Код скопійовано! 📋', 'info');
        });
    } catch (err) {
        showToast(err.message, 'error');
    }
}

function renderParticipants() {
    const el = document.getElementById('participants-list');
    el.innerHTML = session.participants.map(p => `
    <div style="display:flex;align-items:center;gap:0.5rem;padding:0.3rem 0;">
      <div class="user-avatar" style="width:28px;height:28px;font-size:0.75rem;">${p.username[0].toUpperCase()}</div>
      <span style="font-size:0.875rem;font-weight:600;color:var(--text-mid);">${p.username}</span>
      ${p.id === session.created_by?.id ? '<span class="badge" style="font-size:0.65rem;">Орг.</span>' : ''}
    </div>
  `).join('');
}

function renderQuestion() {
    const q = questions[currentQ];
    const total = questions.length;
    const progress = ((currentQ + 1) / total) * 100;

    document.getElementById('progress-bar').style.width = `${progress}%`;
    document.getElementById('progress-text').textContent = `${currentQ + 1} / ${total}`;
    document.getElementById('question-number').textContent = `Питання ${currentQ + 1}`;
    document.getElementById('question-text').textContent = q.text;

    const body = document.getElementById('question-body');

    if (q.question_type === 'scale') {
        const saved = answers[q.id]?.scale_value || 5;
        body.innerHTML = `
      <div class="scale-wrap">
        <div class="scale-value-display" id="scale-val">${saved}</div>
        <input type="range" id="scale-input" min="1" max="10" value="${saved}">
        <div class="scale-labels"><span>1 — Зовсім ні</span><span>10 — Повністю так</span></div>
      </div>`;
        document.getElementById('scale-input').addEventListener('input', (e) => {
            document.getElementById('scale-val').textContent = e.target.value;
            answers[q.id] = { question_id: q.id, scale_value: parseInt(e.target.value) };
        });
        if (!answers[q.id]) answers[q.id] = { question_id: q.id, scale_value: saved };
    } else {
        const savedOpt = answers[q.id]?.selected_option_id;
        body.innerHTML = `<div class="options-grid">${(q.options || []).map(opt => `
        <button class="option-btn${savedOpt === opt.id ? ' selected' : ''}"
                data-id="${opt.id}" data-qid="${q.id}">
          ${opt.text}
        </button>`).join('')
            }</div>`;
        body.querySelectorAll('.option-btn').forEach(btn => {
            btn.addEventListener('click', () => {
                body.querySelectorAll('.option-btn').forEach(b => b.classList.remove('selected'));
                btn.classList.add('selected');
                answers[q.id] = { question_id: q.id, selected_option_id: parseInt(btn.dataset.id) };
            });
        });
    }

    document.getElementById('btn-prev').disabled = currentQ === 0;
    const isLast = currentQ === total - 1;
    document.getElementById('btn-next').classList.toggle('hidden', isLast);
    document.getElementById('btn-submit').classList.toggle('hidden', !isLast);
}

function navigate(dir) {
    currentQ = Math.max(0, Math.min(questions.length - 1, currentQ + dir));
    renderQuestion();
}

async function submitAnswers(sessionId) {
    const btn = document.getElementById('btn-submit');
    const payload = Object.values(answers);
    if (!payload.length) { showToast('Дайте хоча б одну відповідь', 'error'); return; }
    btn.disabled = true;
    btn.textContent = 'Відправка...';
    try {
        const res = await apiFetch(`/sessions/${sessionId}/submit/`, {
            method: 'POST',
            body: JSON.stringify({ answers: payload }),
        });
        showToast(`Збережено ${res.saved} відповідей! ✅`, 'success');
        document.getElementById('submit-done').classList.remove('hidden');
        btn.classList.add('hidden');
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = '✅ Надіслати відповіді';
    }
}

async function completeSession(sessionId) {
    const btn = document.getElementById('btn-complete');
    btn.disabled = true;
    btn.textContent = 'Завершення...';
    try {
        await apiFetch(`/sessions/${sessionId}/complete/`, { method: 'POST' });
        showToast('Сесію завершено! Рахуємо сумісність... 🐱', 'success');
        setTimeout(() => window.location.href = `/results/${sessionId}/`, 1200);
    } catch (err) {
        showToast(err.message, 'error');
        btn.disabled = false;
        btn.textContent = '🏁 Завершити та побачити результати';
    }
}

async function logout() {
    try { await apiFetch('/auth/logout/', { method: 'POST' }); } catch { }
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    window.location.href = '/';
}
