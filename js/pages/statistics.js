// Страница "Статистика"

Router.register("/statistics", () => {
  const classes = App.getClasses();
  if (classes.length === 0) {
    return `
      <div class="page">
        <header class="page-header"><div><h1>📊 Статистика</h1></div></header>
        <div class="empty-state">
          <div class="empty-icon">📊</div>
          <h3>Нет данных</h3>
          <p>Создайте класс, чтобы увидеть статистику.</p>
        </div>
      </div>
    `;
  }

  const html = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>📊 Статистика</h1>
          <p class="page-subtitle">Прогресс по классам и категориям</p>
        </div>
        <div class="page-header-actions">
          <select class="class-filter" id="stats-class">
            ${classes.map((c) => `<option value="${c.id}">${UI.escape(c.name)} (${c.grade || 3} кл.)</option>`).join("")}
          </select>
        </div>
      </header>
      <div id="stats-content"></div>
    </div>
  `;

  window.__afterRender = () => {
    function renderStats(classId) {
      const cls = App.getClassById(classId) || classes[0];
      const classLessons = App.getClassLessons(cls);
      const total = classLessons.length;
      const completedIds = App.getCompletedIds(cls);
      const completed = completedIds.size;
      const remaining = total - completed;

      const byCategory = {};
      classLessons.forEach((l) => {
        if (!byCategory[l.category])
          byCategory[l.category] = { total: 0, done: 0 };
        byCategory[l.category].total++;
        if (completedIds.has(l.id)) byCategory[l.category].done++;
      });

      const container = document.getElementById("stats-content");
      container.innerHTML = `
        <section class="stats-grid">
          <div class="stat-card"><div class="stat-label">Всего уроков</div><div class="stat-value">${total}</div></div>
          <div class="stat-card accent-green"><div class="stat-label">Пройдено</div><div class="stat-value">${completed}</div></div>
          <div class="stat-card accent-orange"><div class="stat-label">Осталось</div><div class="stat-value">${remaining}</div></div>
          <div class="stat-card accent-blue"><div class="stat-label">Прогресс</div><div class="stat-value">${total ? Math.round((completed / total) * 100) : 0}%</div></div>
        </section>

        <div class="progress-wrap" style="margin-bottom:24px">
          <div class="progress-label">Класс: ${UI.escape(cls.name)} (${cls.grade || 3} кл.)</div>
          <div class="progress-bar"><div class="progress-bar-fill" style="width:${total ? Math.round((completed / total) * 100) : 0}%"></div></div>
          <div class="progress-text">${completed} / ${total} — ${total ? Math.round((completed / total) * 100) : 0}%</div>
        </div>

        <h2 class="section-title">📊 По категориям</h2>
        <div class="category-stats">
          ${Object.entries(byCategory)
            .map(([cat, { total, done }]) => {
              const pct = total ? Math.round((done / total) * 100) : 0;
              return `
              <div class="category-stat-row">
                <div class="category-stat-name">${UI.escape(cat)}</div>
                <div class="category-stat-bar"><div class="category-stat-fill" style="width:${pct}%"></div></div>
                <div class="category-stat-value">${done} / ${total}</div>
              </div>
            `;
            })
            .join("")}
        </div>

        <h2 class="section-title">Все классы</h2>
        <div class="all-classes-stats">
          ${App.getClasses()
            .map((c) => {
              const cLessons = App.getClassLessons(c);
              const done = Object.values(c.progress).filter(
                (p) => p.status === "completed",
              ).length;
              const pct = cLessons.length
                ? Math.round((done / cLessons.length) * 100)
                : 0;
              return `
              <div class="class-stat-row">
                <div class="class-stat-name">${UI.escape(c.name)} (${c.grade || 3} кл.)</div>
                <div class="class-stat-bar"><div class="class-stat-fill" style="width:${pct}%"></div></div>
                <div class="class-stat-value">${pct}%</div>
              </div>
            `;
            })
            .join("")}
        </div>
      `;
    }

    document.getElementById("stats-class").onchange = (e) =>
      renderStats(e.target.value);
    renderStats(App.getActiveClassId() || classes[0].id);
  };

  return html;
});
