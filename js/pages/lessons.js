// Страница "Учебный план"

Router.register("/lessons", () => {
  const html = `
    <div class="page">
      <header class="page-header">
        <div>
          <h1>📚 Учебный план</h1>
          <p class="page-subtitle">Всего уроков: ${LESSONS.length}</p>
        </div>
      </header>

      <section class="filters-row">
        <div class="search-bar">
          🔍 <input type="text" id="lessons-search" placeholder="Поиск модели..." />
        </div>
        <select class="category-filter" id="lessons-category">
          <option value="">Все категории</option>
          ${CATEGORIES.map((c) => `<option value="${UI.escape(c)}">${UI.escape(c)}</option>`).join("")}
        </select>
      </section>

      <div class="table-wrap">
        <table class="lessons-table">
          <thead>
            <tr><th>№</th><th>Категория</th><th>Модель</th><th>Страниц</th><th>Инструкция</th></tr>
          </thead>
          <tbody id="lessons-tbody"></tbody>
        </table>
      </div>
    </div>
  `;

  window.__afterRender = () => {
    const state = { search: "", category: "" };
    function renderTable() {
      const filtered = LESSONS.filter((l) => {
        if (state.category && l.category !== state.category) return false;
        if (state.search) {
          const q = state.search.toLowerCase();
          return (
            l.name.toLowerCase().includes(q) ||
            l.category.toLowerCase().includes(q) ||
            String(l.id).includes(q)
          );
        }
        return true;
      });
      const tbody = document.getElementById("lessons-tbody");
      if (filtered.length === 0) {
        tbody.innerHTML = `<tr><td colspan="5" style="text-align:center;padding:24px" class="muted">Ничего не найдено</td></tr>`;
        return;
      }
      tbody.innerHTML = filtered
        .map(
          (l) => `
        <tr>
          <td>${l.id}</td>
          <td>${UI.escape(l.category)}</td>
          <td><b>${UI.escape(l.name)}</b></td>
          <td>${UI.escape(String(l.pages))}</td>
          <td>${l.link ? `<a class="link" href="${UI.escape(l.link)}" target="_blank" rel="noopener">📖 PDF</a>` : '<span class="muted">—</span>'}</td>
        </tr>
      `,
        )
        .join("");
    }
    document.getElementById("lessons-search").oninput = (e) => {
      state.search = e.target.value;
      renderTable();
    };
    document.getElementById("lessons-category").onchange = (e) => {
      state.category = e.target.value;
      renderTable();
    };
    renderTable();
  };

  return html;
});
