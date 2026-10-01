// Простой hash-роутер

const Router = (() => {
  const routes = [];

  function register(path, handler) {
    const keys = [];
    const pattern = path
      .replace(/\//g, "\\/")
      .replace(/:([a-zA-Z]+)/g, (_, key) => {
        keys.push(key);
        return "([^/]+)";
      });
    routes.push({ pattern: new RegExp("^" + pattern + "$"), keys, handler });
  }

  function parseHash() {
    const raw = window.location.hash.replace(/^#/, "") || "/";
    return raw.startsWith("/") ? raw : "/" + raw;
  }

  function render() {
    const path = parseHash();
    for (const r of routes) {
      const m = path.match(r.pattern);
      if (m) {
        const params = {};
        r.keys.forEach((k, i) => {
          params[k] = decodeURIComponent(m[i + 1]);
        });
        const main = document.getElementById("app-main");
        main.innerHTML = r.handler(params) || "";
        if (typeof window.__afterRender === "function") {
          window.__afterRender(params, path);
          window.__afterRender = null;
        }
        updateActiveNav(path);
        window.scrollTo(0, 0);
        return;
      }
    }
    document.getElementById("app-main").innerHTML = `
      <div class="page">
        <div class="empty-state">
          <div class="empty-icon">🔍</div>
          <h3>Страница не найдена</h3>
          <p>Проверьте адрес или вернитесь на <a href="#/">главную</a>.</p>
        </div>
      </div>
    `;
  }

  function updateActiveNav(path) {
    const items = document.querySelectorAll(".nav-item");
    items.forEach((el) => {
      const route = el.getAttribute("data-route");
      let active = false;
      if (route === "/") active = path === "/" || path === "";
      else active = path === route || path.startsWith(route + "/");
      el.classList.toggle("active", active);
    });
  }

  function start() {
    window.addEventListener("hashchange", render);
    if (!window.location.hash) {
      window.location.hash = "#/";
    } else {
      render();
    }
  }

  return { register, start, render };
})();
