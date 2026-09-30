// Страница "Главная"

Router.register("/", () => {
  const classes = App.getClasses();
  const activeClasses = classes.filter((c) => !c.archived);
  const totalLessons = LESSONS.length;

  const todayStr = new Date().toDateString();
  let completedToday = 0;
  let totalCompleted = 0;
  classes.forEach((c) => {
    Object.values(c.progress).forEach((p) => {
      if (p.status === "completed") {
        totalCompleted++;
        if (new Date(p.date).toDateString() === todayStr) completedToday++;
      }
    });
  });
  const totalPossible = activeClasses.length * totalLessons;
  const overallProgress = totalPossible
    ? Math.round((totalCompleted / totalPossible) * 100)
    : 0;

  const activeClass = App.getActiveClass() || activeClasses[0] || null;
  const nextLesson = activeClass ? App.getCurrentLesson(activeClass) : null;

  let lastCompleted = null;
  if (activeClass) {
    const ids = Object.entries(activeClass.progress)
      .filter(([, p]) => p.status === "completed")
      .map(([id]) => Number(id))
      .sort((a, b) => b - a);
    if (ids[0]) lastCompleted = getLessonById(ids[0]);
  }

  const todayBlock =
    activeClass && nextLesson
      ? `
    <section class="today-block">
      <div class="today-header">
        <span>▶</span>
        <h2>Сегодняшний урок</h2>
      </div>
      <div class="today-body">
        <div>
          <div class="today-lesson-num">Урок №${nextLesson.id}</div>
          <h3>${UI.escape(nextLesson.name)}</h3>
          <div class="today-meta">
            <span>${UI.escape(nextLesson.category)}</span>
            <span>· ${UI.escape(String(nextLesson.pages))} стр.</span>
          </div>
          <div class="today-class">Класс: <b>${UI.escape(activeClass.name)}</b></div>
        </div>
        <div class="today-actions">
          ${nextLesson.link ? `<a class="btn btn-ghost" href="${UI.escape(nextLesson.link)}" target="_blank" rel="noopener">📖 Открыть инструкцию</a>` : ""}
          <a class="btn btn-success" href="#/classes/${activeClass.id}">✓ К уроку</a>
        </div>
      </div>
      ${lastCompleted ? `<div class="today-footer">Последний пройденный урок: <b>№${lastCompleted.id} — ${UI.escape(lastCompleted.name)}</b></div>` : ""}
    </section>
  `
      : "";

  const classesHTML =
    activeClasses.length === 0
      ? `
      <div class="empty-state">
        <div class="empty-icon">🤖</div>
        <h3>У вас пока нет классов</h3>
        <p>Создайте первый класс, чтобы начать отслеживать занятия.</p>
        <a class="btn btn-primary" href="#/classes">＋ Добавить класс</a>
      </div>
    `
      : `<div class="cards-grid">${activeClasses.map((cls) => renderClassCard(cls, totalLessons)).join("")}</div>`;

  return `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>Робототехника 🤖</h1>
          <p class="page-subtitle">Учебный план и прогресс занятий</p>
        </div>
      </header>

      <section class="stats-grid">
        <div class="stat-card">
          <div class="stat-icon">🎓</div>
          <div class="stat-label">Мои классы</div>
          <div class="stat-value">${activeClasses.length}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📚</div>
          <div class="stat-label">Всего занятий</div>
          <div class="stat-value">${totalLessons}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">✓</div>
          <div class="stat-label">Проведено сегодня</div>
          <div class="stat-value">${completedToday}</div>
        </div>
        <div class="stat-card">
          <div class="stat-icon">📈</div>
          <div class="stat-label">Общий прогресс</div>
          <div class="stat-value">${overallProgress}%</div>
        </div>
      </section>

      ${todayBlock}

      <section>
        <div class="section-header">
          <h2>Мои классы</h2>
          <a class="btn btn-primary" href="#/classes">＋ Добавить класс</a>
        </div>
        ${classesHTML}
      </section>
    </div>
  `;
});

// Общая функция рендера карточки класса — используется на главной и на /classes
function renderClassCard(cls, totalLessons) {
  const completed = Object.values(cls.progress).filter(
    (p) => p.status === "completed",
  ).length;
  const doneIds = new Set(
    Object.entries(cls.progress)
      .filter(([, p]) => p.status === "completed")
      .map(([id]) => Number(id)),
  );
  const lastId = [...doneIds].sort((a, b) => a - b).pop();
  const lastLesson = lastId ? getLessonById(lastId) : null;
  const nextLesson = LESSONS.find((l) => !doneIds.has(l.id));

  return `
    <div class="class-card">
      <div class="class-card-header">
        <div class="class-card-title">
          <span>🎓</span>
          <h3>${UI.escape(cls.name)}</h3>
          ${cls.archived ? '<span class="badge badge-archived">Архив</span>' : ""}
        </div>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${totalLessons ? Math.round((completed / totalLessons) * 100) : 0}%"></div></div>
        <div class="progress-text">${completed} / ${totalLessons} — ${totalLessons ? Math.round((completed / totalLessons) * 100) : 0}%</div>
      </div>
      <div class="class-card-info">
        <div><span class="label">Последний урок:</span> ${lastLesson ? UI.escape(lastLesson.name) : "—"}</div>
        <div><span class="label">Следующий урок:</span> ${nextLesson ? `№${nextLesson.id} — ${UI.escape(nextLesson.name)}` : "Все уроки пройдены 🎉"}</div>
      </div>
      <div class="class-card-actions">
        <a class="btn btn-primary" href="#/classes/${cls.id}">Открыть</a>
      </div>
    </div>
  `;
}
