// Глобальное состояние + все действия

const App = (() => {
  const state = {
    classes: Storage.loadClasses(),
    settings: Storage.loadSettings(),
    activeClassId: Storage.loadActiveClassId(),
  };

  function persist() {
    Storage.saveClasses(state.classes);
    Storage.saveSettings(state.settings);
    Storage.saveActiveClassId(state.activeClassId);
  }

  function getClasses() {
    return state.classes;
  }
  function getActiveClass() {
    return state.classes.find((c) => c.id === state.activeClassId) || null;
  }
  function getClassById(id) {
    return state.classes.find((c) => c.id === id) || null;
  }
  function getActiveClassId() {
    return state.activeClassId;
  }
  function getSettings() {
    return state.settings;
  }

  function getClassLessons(cls) {
    if (!cls) return [];
    const grade = cls.grade || 3;
    return getLessonsByGrade(grade);
  }

  function getCompletedIds(cls) {
    return new Set(
      Object.entries(cls.progress)
        .filter(([, p]) => p.status === "completed")
        .map(([id]) => Number(id)),
    );
  }

  function getCurrentLesson(cls) {
    const done = getCompletedIds(cls);
    return getClassLessons(cls).find((l) => !done.has(l.id)) || null;
  }

  function setActiveClassId(id) {
    state.activeClassId = id;
    persist();
    updateSidebarActiveClass();
  }

  function addClass(name, grade) {
    const trimmed = (name || "").trim();
    const gradeNum = Number(grade) === 2 ? 2 : 3;
    if (!trimmed) return { ok: false, error: "Введите название класса." };
    if (
      state.classes.some(
        (c) => !c.archived && c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return { ok: false, error: "Класс с таким названием уже существует." };
    }
    const newClass = {
      id: `class-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`,
      name: trimmed,
      grade: gradeNum,
      planId: PLAN_ID,
      archived: false,
      createdAt: new Date().toISOString(),
      progress: {},
      notes: {},
      history: [],
    };
    state.classes.push(newClass);
    state.activeClassId = newClass.id;
    persist();
    updateSidebarActiveClass();
    return { ok: true, cls: newClass };
  }

  function renameClass(id, newName) {
    const trimmed = (newName || "").trim();
    if (!trimmed) return { ok: false, error: "Название не может быть пустым." };
    if (
      state.classes.some(
        (c) =>
          c.id !== id &&
          !c.archived &&
          c.name.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      return { ok: false, error: "Класс с таким названием уже существует." };
    }
    const cls = state.classes.find((c) => c.id === id);
    if (!cls) return { ok: false, error: "Класс не найден." };
    cls.name = trimmed;
    persist();
    updateSidebarActiveClass();
    return { ok: true };
  }

  function deleteClass(id) {
    state.classes = state.classes.filter((c) => c.id !== id);
    if (state.activeClassId === id) state.activeClassId = null;
    persist();
    updateSidebarActiveClass();
  }

  function toggleArchive(id) {
    const cls = state.classes.find((c) => c.id === id);
    if (!cls) return;
    cls.archived = !cls.archived;
    persist();
  }

  function setLessonStatus(classId, lessonId, status) {
    const cls = state.classes.find((c) => c.id === classId);
    if (!cls) return;
    if (status === "completed") {
      cls.progress[lessonId] = {
        status: "completed",
        date: new Date().toISOString(),
      };
      cls.history.unshift({ lessonId, date: new Date().toISOString() });
    } else if (status === "in_progress") {
      cls.progress[lessonId] = {
        status: "in_progress",
        date: new Date().toISOString(),
      };
    } else {
      delete cls.progress[lessonId];
      const idx = cls.history.findIndex((h) => h.lessonId === lessonId);
      if (idx >= 0) cls.history.splice(idx, 1);
    }
    persist();
  }

  function setNote(classId, lessonId, text) {
    const cls = state.classes.find((c) => c.id === classId);
    if (!cls) return;
    if (text && text.trim()) cls.notes[lessonId] = text.trim();
    else delete cls.notes[lessonId];
    persist();
  }

  function resetClassProgress(id, { keepHistory, keepNotes }) {
    const cls = state.classes.find((c) => c.id === id);
    if (!cls) return;
    cls.progress = {};
    if (!keepHistory) cls.history = [];
    if (!keepNotes) cls.notes = {};
    persist();
  }

  function setTheme(theme) {
    state.settings.theme = theme;
    document.documentElement.setAttribute("data-theme", theme);
    persist();
  }

  function importData(data) {
    const v = Storage.validateImport(data);
    if (!v.ok) return v;
    state.classes = data.classes.map((c) => c);
    if (data.settings) {
      state.settings = data.settings;
      document.documentElement.setAttribute("data-theme", state.settings.theme);
    }
    persist();
    updateSidebarActiveClass();
    return { ok: true };
  }

  function resetAll() {
    Storage.resetEverything();
    state.classes = [];
    state.settings = { theme: "light" };
    state.activeClassId = null;
    document.documentElement.setAttribute("data-theme", "light");
    updateSidebarActiveClass();
  }

  function updateSidebarActiveClass() {
    const el = document.getElementById("sidebar-active-class");
    const cls = getActiveClass();
    el.textContent = cls ? `${cls.name} (${cls.grade || 3} кл.)` : "—";
  }

  function init() {
    document.documentElement.setAttribute("data-theme", state.settings.theme);
    updateSidebarActiveClass();

    const sidebar = document.getElementById("sidebar");
    const overlay = document.getElementById("sidebar-overlay");
    document.getElementById("mobile-menu-btn").onclick = () => {
      sidebar.classList.add("open");
      overlay.classList.add("show");
    };
    document.getElementById("sidebar-close").onclick = () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };
    overlay.onclick = () => {
      sidebar.classList.remove("open");
      overlay.classList.remove("show");
    };
  }

  return {
    state,
    init,
    persist,
    getClasses,
    getActiveClass,
    getClassById,
    getActiveClassId,
    getSettings,
    getClassLessons,
    getCompletedIds,
    getCurrentLesson,
    setActiveClassId,
    addClass,
    renameClass,
    deleteClass,
    toggleArchive,
    setLessonStatus,
    setNote,
    resetClassProgress,
    setTheme,
    importData,
    resetAll,
    updateSidebarActiveClass,
  };
})();
