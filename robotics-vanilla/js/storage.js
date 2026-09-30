// Хранилище. Легко заменить на API.

const Storage = (() => {
  const KEYS = {
    CLASSES: "robotics_classes",
    SETTINGS: "robotics_settings",
    ACTIVE_CLASS: "robotics_active_class",
  };

  function normalizeClass(c) {
    if (!c || typeof c !== "object") return null;
    return {
      id:
        c.id || `class-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      name: c.name || "Без названия",
      planId: c.planId || "robotics-2026",
      archived: Boolean(c.archived),
      createdAt: c.createdAt || new Date().toISOString(),
      progress: c.progress && typeof c.progress === "object" ? c.progress : {},
      notes: c.notes && typeof c.notes === "object" ? c.notes : {},
      history: Array.isArray(c.history) ? c.history : [],
    };
  }

  return {
    loadClasses() {
      try {
        const raw = localStorage.getItem(KEYS.CLASSES);
        if (!raw) return [];
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map(normalizeClass).filter(Boolean);
      } catch (e) {
        console.error("Ошибка чтения классов:", e);
        return [];
      }
    },
    saveClasses(classes) {
      try {
        localStorage.setItem(KEYS.CLASSES, JSON.stringify(classes));
      } catch (e) {
        console.error("Ошибка сохранения классов:", e);
      }
    },
    loadSettings() {
      try {
        const raw = localStorage.getItem(KEYS.SETTINGS);
        if (!raw) return { theme: "light" };
        const parsed = JSON.parse(raw);
        return { theme: parsed.theme === "dark" ? "dark" : "light" };
      } catch {
        return { theme: "light" };
      }
    },
    saveSettings(settings) {
      try {
        localStorage.setItem(KEYS.SETTINGS, JSON.stringify(settings));
      } catch (e) {
        console.error("Ошибка сохранения настроек:", e);
      }
    },
    loadActiveClassId() {
      return localStorage.getItem(KEYS.ACTIVE_CLASS) || null;
    },
    saveActiveClassId(id) {
      if (id) localStorage.setItem(KEYS.ACTIVE_CLASS, id);
      else localStorage.removeItem(KEYS.ACTIVE_CLASS);
    },
    exportAllData(classes, settings) {
      return {
        version: 1,
        exportedAt: new Date().toISOString(),
        classes,
        settings,
      };
    },
    validateImport(data) {
      if (!data || typeof data !== "object")
        return { ok: false, error: "Файл не является JSON-объектом." };
      if (!Array.isArray(data.classes))
        return { ok: false, error: 'В файле отсутствует массив "classes".' };
      return { ok: true };
    },
    resetEverything() {
      localStorage.removeItem(KEYS.CLASSES);
      localStorage.removeItem(KEYS.SETTINGS);
      localStorage.removeItem(KEYS.ACTIVE_CLASS);
    },
  };
})();
