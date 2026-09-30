// Страница "История"

Router.register('/history', () => {
  const classes = App.getClasses();

  const html = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>📅 История занятий</h1>
          <p class="page-subtitle">Проведённые уроки по классам</p>
        </div>
        <div class="page-header-actions">
          <select class="class-filter" id="history-filter">
            <option value="all">Все классы</option>
            ${classes.map(c => `<option value="${c.id}">${UI.escape(c.name)}</option>`).join('')}
          </select>
        </div>
      </header>
      <div id="history-content"></div>
    </div>
  `;

  window.__afterRender = () => {
    function renderHistory(classId = 'all') {
      const relevant = classId === 'all'
        ? App.getClasses()
        : App.getClasses().filter(c => c.id === classId);

      const entries = [];
      relevant.forEach(cls => {
        (cls.history || []).forEach(h => {
          entries.push({
            ...h,
            className: cls.name,
            lesson: getLessonById(h.lessonId)
          });
        });
      });
      entries.sort((a, b) => new Date(b.date) - new Date(a.date));

      const container = document.getElementById('history-content');
      if (entries.length === 0) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="empty-icon">📅</div>
            <h3>История пока пустая</h3>
            <p>Проведённые занятия появятся здесь.</p>
          </div>
        `;
        return;
      }

      container.innerHTML = `
        <ul class="history-list">
          ${entries.map(e => `
            <li class="history-item">
              <div class="history-date">📅 ${UI.formatDateTime(e.date)}</div>
              <div class="history-body">
                <div class="history-title">✓ Урок №${e.lesson ? e.lesson.id : '?'} — ${UI.escape(e.lesson ? e.lesson.name : 'Урок удалён из плана')}</div>
                <div class="history-meta">
                  <span>Класс: <b>${UI.escape(e.className)}</b></span>
                  ${e.lesson ? `<span>· ${UI.escape(e.lesson.category)}</span>` : ''}
                </div>
              </div>
            </li>
          `).join('')}
        </ul>
      `;
    }

    document.getElementById('history-filter').onchange = e => renderHistory(e.target.value);
    renderHistory();
  };

  return html;
});
