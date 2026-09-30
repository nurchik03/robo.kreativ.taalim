// Страница "Мои классы"

Router.register("/classes", () => {
  const classes = App.getClasses();
  const active = classes.filter((c) => !c.archived);
  const archived = classes.filter((c) => c.archived);

  const html = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>🎓 Мои классы</h1>
          <p class="page-subtitle">Управление классами и учебными планами</p>
        </div>
        <div class="page-header-actions">
          <button class="btn btn-primary" id="add-class-btn">＋ Добавить класс</button>
        </div>
      </header>

      ${
        active.length === 0 && archived.length === 0
          ? `
        <div class="empty-state">
          <div class="empty-icon">🤖</div>
          <h3>У вас пока нет классов</h3>
          <p>Создайте первый класс, чтобы начать отслеживать занятия.</p>
          <button class="btn btn-primary" id="add-class-btn-2">＋ Добавить класс</button>
        </div>
      `
          : `
        <section>
          <h2 class="section-title">Активные</h2>
          ${active.length === 0 ? '<p class="muted">Нет активных классов.</p>' : `<div class="cards-grid">${active.map((c) => renderClassCardAdmin(c)).join("")}</div>`}
        </section>
        ${
          archived.length > 0
            ? `
          <section>
            <h2 class="section-title">🗄 Архив</h2>
            <div class="cards-grid">${archived.map((c) => renderClassCardAdmin(c)).join("")}</div>
          </section>
        `
            : ""
        }
      `
      }
    </div>
  `;

  // После вставки в DOM — навешиваем обработчики
  window.__afterRender = () => {
    const openCreate = () => createClassFlow();

    const b1 = document.getElementById("add-class-btn");
    const b2 = document.getElementById("add-class-btn-2");
    if (b1) b1.onclick = openCreate;
    if (b2) b2.onclick = openCreate;

    document.querySelectorAll("[data-action-rename]").forEach((btn) => {
      btn.onclick = () =>
        renameClassFlow(btn.getAttribute("data-action-rename"));
    });
    document.querySelectorAll("[data-action-delete]").forEach((btn) => {
      btn.onclick = () =>
        deleteClassFlow(btn.getAttribute("data-action-delete"));
    });
    document.querySelectorAll("[data-action-archive]").forEach((btn) => {
      btn.onclick = () => {
        App.toggleArchive(btn.getAttribute("data-action-archive"));
        Router.render();
      };
    });

    // Меню "⋮" — открытие/закрытие
    document.querySelectorAll("[data-menu-toggle]").forEach((btn) => {
      btn.onclick = (e) => {
        e.stopPropagation();
        const id = btn.getAttribute("data-menu-toggle");
        document.querySelectorAll(".dropdown").forEach((d) => {
          if (d.getAttribute("data-menu-id") !== id) d.remove();
        });
        const existing = document.querySelector(
          `.dropdown[data-menu-id="${id}"]`,
        );
        if (existing) {
          existing.remove();
          return;
        }
        const menu = document.createElement("div");
        menu.className = "dropdown";
        menu.setAttribute("data-menu-id", id);
        const cls = App.getClassById(id);
        menu.innerHTML = `
          <button data-action-rename="${id}">✏ Переименовать</button>
          <button data-action-archive="${id}">${cls.archived ? "↩ Разархивировать" : "🗄 Архивировать"}</button>
          <button class="danger" data-action-delete="${id}">🗑 Удалить</button>
        `;
        btn.parentElement.appendChild(menu);
        menu.querySelectorAll("[data-action-rename]").forEach(
          (b) =>
            (b.onclick = () => {
              menu.remove();
              renameClassFlow(id);
            }),
        );
        menu.querySelectorAll("[data-action-archive]").forEach(
          (b) =>
            (b.onclick = () => {
              menu.remove();
              App.toggleArchive(id);
              Router.render();
            }),
        );
        menu.querySelectorAll("[data-action-delete]").forEach(
          (b) =>
            (b.onclick = () => {
              menu.remove();
              deleteClassFlow(id);
            }),
        );
      };
    });

    // Закрытие меню по клику вне
    document.addEventListener("click", () => {
      document.querySelectorAll(".dropdown").forEach((d) => d.remove());
    });
  };

  return html;
});

function renderClassCardAdmin(cls) {
  const total = LESSONS.length;
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
        <div class="class-card-menu">
          <button class="icon-btn" data-menu-toggle="${cls.id}" title="Меню">⋮</button>
        </div>
      </div>
      <div class="progress-wrap">
        <div class="progress-bar"><div class="progress-bar-fill" style="width:${total ? Math.round((completed / total) * 100) : 0}%"></div></div>
        <div class="progress-text">${completed} / ${total} — ${total ? Math.round((completed / total) * 100) : 0}%</div>
      </div>
      <div class="class-card-info">
        <div><span class="label">Последний урок:</span> ${lastLesson ? UI.escape(lastLesson.name) : "—"}</div>
        <div><span class="label">Следующий урок:</span> ${nextLesson ? `№${nextLesson.id} — ${UI.escape(nextLesson.name)}` : "Все уроки пройдены 🎉"}</div>
      </div>
      <div class="class-card-actions">
        <a class="btn btn-primary" href="#/classes/${cls.id}">Открыть</a>
        <button class="btn btn-ghost" data-action-rename="${cls.id}">✏ Переименовать</button>
      </div>
    </div>
  `;
}

function createClassFlow() {
  UI.prompt({
    title: "Создать класс",
    label: "Название класса",
    placeholder: "Например: 3 А",
    confirmLabel: "Создать класс",
    extraFieldHTML: `
      <label class="field">
        <span>Учебный план</span>
        <select disabled><option>${UI.escape(PLAN_META.title)}</option></select>
      </label>
    `,
    validate: (v) => (v ? null : "Введите название класса."),
    onSubmit: (v) => {
      const res = App.addClass(v);
      if (!res.ok) {
        UI.toast(res.error, "error");
        return;
      }
      UI.toast("Класс создан", "ok");
      Router.render();
    },
  });
}

function renameClassFlow(id) {
  const cls = App.getClassById(id);
  if (!cls) return;
  UI.prompt({
    title: "Переименовать класс",
    label: "Название класса",
    initialValue: cls.name,
    confirmLabel: "Сохранить",
    onSubmit: (v) => {
      const res = App.renameClass(id, v);
      if (!res.ok) {
        UI.toast(res.error, "error");
        return;
      }
      UI.toast("Класс переименован", "ok");
      Router.render();
    },
  });
}

function deleteClassFlow(id) {
  const cls = App.getClassById(id);
  if (!cls) return;
  UI.confirm({
    title: "Удалить класс?",
    messageHTML: `
      <p>Вы действительно хотите удалить класс <b>«${UI.escape(cls.name)}»</b>?</p>
      <p class="muted">Весь прогресс, история и заметки этого класса будут удалены.</p>
    `,
    confirmLabel: "Удалить класс",
    danger: true,
    onConfirm: () => {
      App.deleteClass(id);
      UI.toast("Класс удалён", "ok");
      Router.render();
    },
  });
}
