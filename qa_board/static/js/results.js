

document.addEventListener('DOMContentLoaded', async () => {
  if (!requireAuth()) return;

  await syncUserProfile();
  document.getElementById('btn-logout').addEventListener('click', logout);

  const sessionId = window.SESSION_ID;
  if (!sessionId) return;

  await loadResults(sessionId);
});

async function loadResults(sessionId) {
  const container = document.getElementById('results-container');
  container.innerHTML = `<div class="loader"><div class="spinner"></div><span>Рахуємо сумісність...</span></div>`;
  try {
    const [session, results] = await Promise.all([
      apiFetch(`/sessions/${sessionId}/`),
      apiFetch(`/sessions/${sessionId}/results/`),
    ]);

    document.getElementById('session-survey-title').textContent = session.survey?.title || 'Результати';

    if (!results.length) {
      container.innerHTML = `
        <div class="empty-state">
          <span class="empty-state-icon">🐱</span>
          <h3>Результатів ще немає</h3>
          <p>Сесія ще не завершена або відповідей замало</p>
        </div>`;
      return;
    }

    container.innerHTML = results.map(r => {
      const scoreRounded = Math.round(r.score);
      const emoji = scoreRounded >= 80 ? '💜' : scoreRounded >= 60 ? '🐱' : scoreRounded >= 40 ? '😺' : '🙈';
      const label = scoreRounded >= 80 ? 'Ідеальна пара!' : scoreRounded >= 60 ? 'Дуже схожі!' : scoreRounded >= 40 ? 'Є спільне' : 'Різні характери';

      return `
      <div class="card result-card">
        <div class="compat-users">
          <div class="user-avatar" style="width:40px;height:40px;">${r.user1.username[0].toUpperCase()}</div>
          <span>${r.user1.username}</span>
          <span class="compat-heart">♥</span>
          <span>${r.user2.username}</span>
          <div class="user-avatar" style="width:40px;height:40px;">${r.user2.username[0].toUpperCase()}</div>
        </div>

        <div style="display:flex;align-items:baseline;gap:0.5rem;">
          <div class="compat-score" id="score-${r.id}">0%</div>
          <span style="font-size:1.5rem;">${emoji}</span>
        </div>
        <div style="color:var(--text-light);font-weight:600;margin-bottom:1rem;">${label}</div>

        <div class="progress-bar-wrap">
          <div class="progress-bar-fill" style="width:0%" id="bar-${r.id}"></div>
        </div>

        ${r.strengths?.length ? `
          <div style="margin-top:1rem;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-mid);margin-bottom:0.4rem;">💪 Спільне</div>
            <div class="tags-list">${r.strengths.map(s => `<span class="badge badge-success">${s}</span>`).join('')}</div>
          </div>` : ''}

        ${r.weaknesses?.length ? `
          <div style="margin-top:0.75rem;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-mid);margin-bottom:0.4rem;">🌱 Розбіжності</div>
            <div class="tags-list">${r.weaknesses.map(s => `<span class="badge badge-warning">${s}</span>`).join('')}</div>
          </div>` : ''}

        ${r.lifestyle_tags?.length ? `
          <div style="margin-top:0.75rem;">
            <div style="font-size:0.8rem;font-weight:700;color:var(--text-mid);margin-bottom:0.4rem;">🏷️ Стиль життя</div>
            <div class="tags-list">${r.lifestyle_tags.map(s => `<span class="badge">${s}</span>`).join('')}</div>
          </div>` : ''}
      </div>`;
    }).join('');

    requestAnimationFrame(() => {
      results.forEach(r => {
        animateScore(r.id, r.score);
      });
    });

  } catch (err) {
    container.innerHTML = `<div class="empty-state"><span class="empty-state-icon">😿</span><h3>${err.message}</h3></div>`;
  }
}

function animateScore(id, targetScore) {
  const scoreEl = document.getElementById(`score-${id}`);
  const barEl = document.getElementById(`bar-${id}`);
  const rounded = Math.round(targetScore);
  let current = 0;
  const step = Math.max(1, Math.floor(rounded / 60));
  const timer = setInterval(() => {
    current = Math.min(current + step, rounded);
    if (scoreEl) scoreEl.textContent = `${current}%`;
    if (barEl) barEl.style.width = `${current}%`;
    if (current >= rounded) clearInterval(timer);
  }, 16);
}

async function logout() {
  try { await apiFetch('/auth/logout/', { method: 'POST' }); } catch { }
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  window.location.href = '/';
}
