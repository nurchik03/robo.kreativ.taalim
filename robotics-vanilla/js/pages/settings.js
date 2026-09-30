// Страница "Настройки"

Router.register("/settings", () => {
  const settings = App.getSettings();

  const html = `
    <div class="page">
      <header class="page-header">
        <div><h1>⚙ Настройки</h1><p class="page-subtitle">Тема, данные, резервные копии</p></div>
      </header>

      <section class="settings-section">
        <h2>Тема оформления</h2>
        <div class="theme-switch">
          <button class="theme-btn ${settings.theme === "light" ? "active" : ""}" data-theme-btn="light">☀ Светлая</button>
          <button class="theme-btn ${settings.theme === "dark" ? "active" : ""}" data-theme-btn="dark">🌙 Тёмная</button>
        </div>
      </section>

      <section class="settings-section">
        <h2>Данные</h2>
        <div class="settings-actions">
          <button class="btn btn-ghost" id="export-btn">⬇ Экспорт данных</button>
          <button class="btn btn-ghost" id="import-btn">⬆ Импорт данных</button>
          <input type="file" id="import-file" accept="application/json" style="display:none" />
        </div>
        <div id="settings-message"></div>
      </section>

      <section class="settings-section danger-zone">
        <h2>⚠ Сброс</h2>
        <p class="muted">Полное удаление всех классов, прогресса, истории и заметок.</p>
        <button class="btn btn-danger" id="reset-all-btn">↺ Сбросить всё</button>
      </section>
    </div>
  `;

  window.__afterRender = () => {
    function showMessage(text, type) {
      const el = document.getElementById("settings-message");
      el.innerHTML = `<div class="message ${type}">${UI.escape(text)}</div>`;
      setTimeout(() => {
        el.innerHTML = "";
      }, 3500);
    }

    document.querySelectorAll("[data-theme-btn]").forEach(
      (b) =>
        (b.onclick = () => {
          const theme = b.getAttribute("data-theme-btn");
          App.setTheme(theme);
          Router.render();
        }),
    );

    document.getElementById("export-btn").onclick = () => {
      const data = Storage.exportAllData(App.getClasses(), App.getSettings());
      const blob = new Blob([JSON.stringify(data, null, 2)], {
        type: "application/json",
      });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `robotics-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      showMessage("Данные экспортированы.", "ok");
    };

    document.getElementById("import-btn").onclick = () => {
      document.getElementById("import-file").click();
    };

    document.getElementById("import-file").onchange = (e) => {
      const file = e.target.files[0];
      if (!file) return;
      const reader = new FileReader();
      reader.onload = () => {
        try {
          const data = JSON.parse(reader.result);
          const res = App.importData(data);
          if (!res.ok) {
            showMessage(res.error, "error");
            return;
          }
          showMessage("Данные успешно импортированы.", "ok");
          Router.render();
        } catch (err) {
          showMessage("Не удалось прочитать JSON-файл.", "error");
        }
      };
      reader.readAsText(file);
      e.target.value = "";
    };

    document.getElementById("reset-all-btn").onclick = () => {
      UI.confirm({
        title: "Сбросить все данные?",
        messageHTML: `
          <p>Все классы, прогресс, история и заметки будут <b>безвозвратно удалены</b>.</p>
          <p class="muted">Рекомендуем сначала сделать экспорт.</p>
        `,
        confirmLabel: "Сбросить всё",
        danger: true,
        onConfirm: () => {
          App.resetAll();
          UI.toast("Все данные сброшены", "ok");
          window.location.hash = "#/";
          Router.render();
        },
      });
    };
  };

  return html;
});
