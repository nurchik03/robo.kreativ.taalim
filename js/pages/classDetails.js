// Страница конкретного класса

Router.register("/classes/:id", (params) => {
  const cls = App.getClassById(params.id);
  if (!cls) {
    return `
      <div class="page">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Класс не найден</h3>
          <p>Возможно, он был удалён.</p>
          <a class="btn btn-primary" href="#/classes">К списку классов</a>
        </div>
      </div>
    `;
  }

  App.setActiveClassId(cls.id);

  const total = LESSONS.length;
  const completedIds = App.getCompletedIds(cls);
  const completed = completedIds.size;
  const currentLesson = App.getCurrentLesson(cls);

  const switcherHTML = `
    <div class="page-header-actions">
      <select class="class-filter" id="class-switcher">
        ${App.getClasses()
          .filter((c) => !c.archived || c.id === cls.id)
          .map(
            (c) =>
              `<option value="${c.id}" ${c.id === cls.id ? "selected" : ""}>${UI.escape(c.name)}${c.archived ? " (архив)" : ""}</option>`,
          )
          .join("")}
      </select>
      <button class="btn btn-ghost btn-sm" id="rename-btn">✏ Переименовать</button>
    </div>
  `;

  const currentBlock = currentLesson
    ? `
    <section class="current-lesson-block">
      <div class="current-lesson-header"><span>▶</span> Текущий урок</div>
      <div class="current-lesson-body">
        <div class="current-lesson-num">Урок №${currentLesson.id}</div>
        <h3>${UI.escape(currentLesson.name)}</h3>
        <div class="current-lesson-meta">
          <span>${UI.escape(currentLesson.category)}</span>
          <span>· ${UI.escape(String(currentLesson.pages))} стр.</span>
        </div>
        <div class="current-lesson-actions">
          ${currentLesson.link ? `<a class="btn btn-ghost" href="${UI.escape(currentLesson.link)}" target="_blank" rel="noopener">📖 Открыть инструкцию</a>` : ""}
          <button class="btn btn-success" id="complete-current">✓ Завершить урок</button>
        </div>
      </div>
    </section>
  `
    : `
    <section class="current-lesson-block done">
      <div class="current-lesson-header">✓ Все уроки пройдены! 🎉</div>
    </section>
  `;

  const html = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>🎓 ${UI.escape(cls.name)}</h1>
          <p class="page-subtitle">Учебный план: ${UI.escape(PLAN_META.title)}</p>
        </div>
        ${switcherHTML}
      </header>

      <div class="progress-wrap">
        <div class="progress-label">Прогресс класса</div>
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${total ? Math.round((completed / total) * 100) : 0}%"></div></div>
        <div class="progress-text">${completed} / ${total} — ${total ? Math.round((completed / total) * 100) : 0}%</div>
      </div>

      ${currentBlock}

      <section class="filters-row">
        <div class="search-bar">
          🔍 <input type="text" id="search-input" placeholder="Поиск модели..." />
        </div>
        <select class="category-filter" id="category-filter">
          <option value="">Все категории</option>
          ${CATEGORIES.map((c) => `<option value="${UI.escape(c)}">${UI.escape(c)}</option>`).join("")}
        </select>
        <div class="status-tabs">
          <button class="tab active" data-status="all">Все</button>
          <button class="tab" data-status="completed">Пройдено</button>
          <button class="tab" data-status="not_completed">Не пройдено</button>
        </div>
      </section>

      <section>
        <div class="section-header">
          <h2>Учебный план</h2>
          <span class="muted" id="lessons-count">${LESSONS.length} из ${LESSONS.length}</span>
        </div>
        <div class="lessons-list" id="lessons-list"></div>
      </section>

      <section class="settings-section danger-zone" style="margin-top:24px">
        <h2>⚠ Опасная зона</h2>
        <p class="muted">Сброс прогресса класса. История и заметки можно сохранить.</p>
        <button class="btn btn-danger" id="reset-btn">↺ Сбросить прогресс</button>
      </section>
    </div>
  `;

  window.__afterRender = () => {
    const filterState = { search: "", category: "", status: "all" };

    function renderLessons() {
      const clsNow = App.getClassById(cls.id);
      const doneNow = App.getCompletedIds(clsNow);
      const currentNow = App.getCurrentLesson(clsNow);

      const filtered = LESSONS.filter((l) => {
        if (filterState.category && l.category !== filterState.category)
          return false;
        if (filterState.status === "completed" && !doneNow.has(l.id))
          return false;
        if (filterState.status === "not_completed" && doneNow.has(l.id))
          return false;
        if (filterState.search) {
          const q = filterState.search.toLowerCase();
          const ok =
            l.name.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            String(l.id).includes(q);
          if (!ok) return false;
        }
        return true;
      });

      document.getElementById("lessons-count").textContent =
        `${filtered.length} из ${LESSONS.length}`;
      const list = document.getElementById("lessons-list");

      if (filtered.length === 0) {
        list.innerHTML = `<div class="empty-state"><div class="empty-icon">📚</div><h3>Ничего не найдено</h3><p>Попробуйте изменить фильтры.</p></div>`;
        return;
      }

      list.innerHTML = filtered
        .map((l) => {
          let status = "todo";
          if (doneNow.has(l.id)) status = "done";
          else if (currentNow && currentNow.id === l.id) status = "current";
          else if (clsNow.progress[l.id]?.status === "in_progress")
            status = "progress";

          const stateLabel = {
            done: "✓ Пройдено",
            current: "▶ Текущий урок",
            progress: "🟡 В процессе",
            todo: "○ Не пройдено",
          }[status];

          const stateClass = {
            done: "state-done",
            current: "state-current",
            progress: "state-progress",
            todo: "state-todo",
          }[status];

          const note = clsNow.notes[l.id] || "";

          return `
          <div class="lesson-card ${status === "current" ? "state-current" : ""} ${status === "done" ? "state-done" : ""} ${status === "progress" ? "state-progress" : ""}">
            <div class="lesson-card-top">
              <div class="lesson-card-number">Урок ${l.id}</div>
              <div class="lesson-state ${stateClass}">${stateLabel}</div>
            </div>
            <div class="lesson-card-body">
              <h4>${UI.escape(l.name)}</h4>
              <div class="lesson-card-meta">
                <span>${UI.escape(l.category)}</span>
                <span>· ${UI.escape(String(l.pages))} стр.</span>
              </div>
            </div>
            <div class="lesson-card-actions">
              ${l.link ? `<a class="btn btn-ghost btn-sm" href="${UI.escape(l.link)}" target="_blank" rel="noopener">📖 Инструкция</a>` : `<button class="btn btn-ghost btn-sm" disabled>Инструкция недоступна</button>`}
              ${
                status === "done"
                  ? `<button class="btn btn-ghost btn-sm" data-undo="${l.id}">↩ Вернуть</button>`
                  : `<button class="btn btn-ghost btn-sm" data-progress="${l.id}">🟡 В процессе</button>
                   <button class="btn btn-success btn-sm" data-complete="${l.id}">✓ Пройдено</button>`
              }
              <button class="btn btn-ghost btn-sm ${note ? "has-note" : ""}" data-note="${l.id}">📝 Заметка</button>
            </div>
            ${note ? `<div class="lesson-note-preview">📝 ${UI.escape(note)}</div>` : ""}
          </div>
        `;
        })
        .join("");

      // Обработчики
      list.querySelectorAll("[data-complete]").forEach(
        (b) =>
          (b.onclick = () => {
            App.setLessonStatus(
              cls.id,
              Number(b.getAttribute("data-complete")),
              "completed",
            );
            UI.toast("Урок отмечен как пройденный", "ok");
            Router.render();
          }),
      );
      list.querySelectorAll("[data-undo]").forEach(
        (b) =>
          (b.onclick = () => {
            App.setLessonStatus(
              cls.id,
              Number(b.getAttribute("data-undo")),
              "todo",
            );
            Router.render();
          }),
      );
      list.querySelectorAll("[data-progress]").forEach(
        (b) =>
          (b.onclick = () => {
            App.setLessonStatus(
              cls.id,
              Number(b.getAttribute("data-progress")),
              "in_progress",
            );
            UI.toast("Отмечено как «в процессе»", "ok");
            Router.render();
          }),
      );
      list.querySelectorAll("[data-note]").forEach(
        (b) =>
          (b.onclick = () => {
            const lessonId = Number(b.getAttribute("data-note"));
            const clsNow2 = App.getClassById(cls.id);
            const current = clsNow2.notes[lessonId] || "";
            UI.prompt({
              title: `Заметка к уроку №${lessonId}`,
              label: "Текст заметки",
              initialValue: current,
              placeholder: "Например: детям понравилась модель...",
              confirmLabel: "Сохранить",
              onSubmit: (v) => {
                App.setNote(cls.id, lessonId, v);
                UI.toast("Заметка сохранена", "ok");
                Router.render();
              },
            });
          }),
      );
    }

    // Фильтры
    document.getElementById("search-input").oninput = (e) => {
      filterState.search = e.target.value;
      renderLessons();
    };
    document.getElementById("category-filter").onchange = (e) => {
      filterState.category = e.target.value;
      renderLessons();
    };
    document.querySelectorAll(".tab").forEach(
      (t) =>
        (t.onclick = () => {
          document
            .querySelectorAll(".tab")
            .forEach((x) => x.classList.remove("active"));
          t.classList.add("active");
          filterState.status = t.getAttribute("data-status");
          renderLessons();
        }),
    );

    // Переключатель класса
    document.getElementById("class-switcher").onchange = (e) => {
      window.location.hash = `#/classes/${e.target.value}`;
    };

    // Переименование
    document.getElementById("rename-btn").onclick = () => {
      UI.prompt({
        title: "Переименовать класс",
        label: "Название класса",
        initialValue: cls.name,
        confirmLabel: "Сохранить",
        onSubmit: (v) => {
          const res = App.renameClass(cls.id, v);
          if (!res.ok) {
            UI.toast(res.error, "error");
            return;
          }
          UI.toast("Класс переименован", "ok");
          Router.render();
        },
      });
    };

    // Завершить текущий
    const completeCurrentBtn = document.getElementById("complete-current");
    if (completeCurrentBtn && currentLesson) {
      completeCurrentBtn.onclick = () => {
        App.setLessonStatus(cls.id, currentLesson.id, "completed");
        UI.toast("Урок завершён", "ok");
        Router.render();
      };
    }

    // Сброс прогресса
    document.getElementById("reset-btn").onclick = () => {
      UI.confirm({
        title: "Сбросить прогресс?",
        messageHTML: `
          <p>Прогресс класса <b>«${UI.escape(cls.name)}»</b> будет сброшен.</p>
          <label class="check"><input type="checkbox" id="keep-history" checked /> Сохранить историю занятий</label>
          <label class="check"><input type="checkbox" id="keep-notes" checked /> Сохранить заметки</label>
        `,
        confirmLabel: "Сбросить",
        danger: true,
        onConfirm: () => {
          // чекбоксы уже удалены вместе с модалкой, поэтому по умолчанию сохраняем
          App.resetClassProgress(cls.id, {
            keepHistory: true,
            keepNotes: true,
          });
          UI.toast("Прогресс сброшен", "ok");
          Router.render();
        },
      });
    };

    renderLessons();
  };

  return html;
});
