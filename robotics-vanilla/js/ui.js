// Утилиты: HTML-эскейп, модалки, toast, форматирование дат

const UI = {
  escape(str) {
    if (str === null || str === undefined) return "";
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#039;");
  },

  toast(message, type = "info") {
    const root = document.getElementById("toast-root");
    const el = document.createElement("div");
    el.className = `toast ${type}`;
    el.textContent = message;
    root.appendChild(el);
    setTimeout(() => {
      el.style.opacity = "0";
      el.style.transition = "opacity .3s";
      setTimeout(() => el.remove(), 300);
    }, 2500);
  },

  confirm({
    title,
    messageHTML,
    confirmLabel = "Подтвердить",
    danger = false,
    onConfirm,
  }) {
    const root = document.getElementById("modal-root");
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${UI.escape(title)}</h3>
        <div class="modal-message">${messageHTML}</div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-action="cancel">Отмена</button>
          <button class="btn ${danger ? "btn-danger" : "btn-primary"}" data-action="confirm">${UI.escape(confirmLabel)}</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);

    function close() {
      overlay.remove();
    }
    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.querySelector('[data-action="confirm"]').onclick = () => {
      close();
      onConfirm();
    };
  },

  prompt({
    title,
    label,
    initialValue = "",
    placeholder = "",
    confirmLabel = "Сохранить",
    extraFieldHTML = "",
    validate,
    onSubmit,
  }) {
    const root = document.getElementById("modal-root");
    const overlay = document.createElement("div");
    overlay.className = "modal-overlay";
    overlay.innerHTML = `
      <div class="modal">
        <h3>${UI.escape(title)}</h3>
        <label class="field">
          <span>${UI.escape(label)}</span>
          <input type="text" data-input value="${UI.escape(initialValue)}" placeholder="${UI.escape(placeholder)}" />
        </label>
        ${extraFieldHTML}
        <div class="form-error" data-error style="display:none"></div>
        <div class="modal-actions">
          <button class="btn btn-ghost" data-action="cancel">Отмена</button>
          <button class="btn btn-primary" data-action="confirm">${UI.escape(confirmLabel)}</button>
        </div>
      </div>
    `;
    root.appendChild(overlay);

    const input = overlay.querySelector("[data-input]");
    const errorEl = overlay.querySelector("[data-error]");
    setTimeout(() => {
      input.focus();
      input.select();
    }, 30);

    function close() {
      overlay.remove();
    }
    function submit() {
      const value = input.value.trim();
      const err = validate ? validate(value, overlay) : null;
      if (err) {
        errorEl.textContent = err;
        errorEl.style.display = "block";
        return;
      }
      close();
      onSubmit(value, overlay);
    }

    overlay.addEventListener("click", (e) => {
      if (e.target === overlay) close();
    });
    overlay.querySelector('[data-action="cancel"]').onclick = close;
    overlay.querySelector('[data-action="confirm"]').onclick = submit;
    input.addEventListener("keydown", (e) => {
      if (e.key === "Enter") submit();
    });
  },

  formatDateTime(iso) {
    const d = new Date(iso);
    return d.toLocaleString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  },

  formatDate(iso) {
    const d = new Date(iso);
    return d.toLocaleDateString("ru-RU", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  },
};
