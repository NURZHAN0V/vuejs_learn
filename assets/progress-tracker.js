(function () {
  const STORAGE_KEY = "vue_learn_progress_v1";
  const LESSON_MIN = 1;
  const LESSON_MAX = 29;

  function loadState() {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      return raw ? JSON.parse(raw) : {};
    } catch {
      return {};
    }
  }

  function saveState(state) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  function getLessonNumberFromPath() {
    const match = window.location.pathname.match(/\/pages\/(\d+)-/);
    if (!match) return null;
    const num = Number(match[1]);
    if (Number.isNaN(num) || num < LESSON_MIN || num > LESSON_MAX) return null;
    return num;
  }

  function ensureLessonState(state, lesson) {
    if (!state[lesson]) state[lesson] = { topic: false, practice: false };
    return state[lesson];
  }

  function getGlobalProgress(state) {
    let points = 0;
    let topicDone = 0;
    let practiceDone = 0;
    const total = LESSON_MAX - LESSON_MIN + 1;

    for (let i = LESSON_MIN; i <= LESSON_MAX; i += 1) {
      const item = state[i] || { topic: false, practice: false };
      if (item.topic) {
        points += 1;
        topicDone += 1;
      }
      if (item.practice) {
        points += 1;
        practiceDone += 1;
      }
    }

    const percent = Math.round((points / (total * 2)) * 100);
    return { percent, topicDone, practiceDone, total };
  }

  function buildProgress(title, subtitle, percent, color) {
    return `
      <div class="tracker-card">
        <div class="tracker-title">${title}</div>
        <div class="tracker-muted">${subtitle}</div>
        <div class="tracker-progress" style="--tracker-value:${percent};--tracker-color:${color}">
          <progress max="100" value="${percent}"></progress>
          <span class="tracker-progress-value" data-value="${percent}"></span>
          <div class="tracker-progress-bg"><div class="tracker-progress-bar"></div></div>
        </div>
      </div>
    `;
  }

  function renderIndex(state) {
    const host = document.querySelector(".progress-card");
    if (!host) return;

    const global = getGlobalProgress(state);
    host.innerHTML = `
      <div class="mb-4">
        <h2 class="text-2xl font-semibold tracking-tight">Прогресс обучения</h2>
        <p class="mt-1 text-sm text-slate-600">Общий прогресс по темам и практике курса</p>
      </div>
      <div class="grid gap-4 md:grid-cols-1">
        ${buildProgress("Прогресс курса", `${global.percent}% выполнения`, global.percent, "#2563eb")}
      </div>
    `;
  }

  function decorateTocCompleted(state) {
    const tocItems = Array.from(document.querySelectorAll("#tocList li"));
    if (!tocItems.length) return;

    tocItems.forEach((item) => {
      const link = item.querySelector("a");
      if (!link) return;

      const href = link.getAttribute("href") || "";
      const match = href.match(/pages\/(\d+)-/);
      if (!match) return;

      const lesson = Number(match[1]);
      if (Number.isNaN(lesson)) return;

      const lessonState = state[lesson] || { topic: false, practice: false };
      const isCompleted = Boolean(lessonState.topic && lessonState.practice);

      link.classList.remove("border-emerald-200", "bg-emerald-50");

      if (isCompleted) {
        link.classList.add("border-emerald-200", "bg-emerald-50");
      }
    });
  }

  function renderLesson(state, lesson) {
    const main = document.querySelector("main");
    const header = main ? main.querySelector("header") : null;
    if (!main || !header) return;

    const item = ensureLessonState(state, lesson);
    const global = getGlobalProgress(state);

    const section = document.createElement("section");
    section.className = "mb-6 rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200";
    section.innerHTML = `
      <h2 class="mb-3 text-xl font-semibold">Прогресс урока</h2>
      <div class="grid gap-4 md:grid-cols-1">
        ${buildProgress("Прогресс курса", "Сохраняется автоматически", global.percent, "#2563eb")}
      </div>
      <div class="tracker-checklist">
        <label class="tracker-check">
          <input type="checkbox" id="tracker-topic" ${item.topic ? "checked" : ""} />
          <span>Тема пройдена</span>
        </label>
        <label class="tracker-check">
          <input type="checkbox" id="tracker-practice" ${item.practice ? "checked" : ""} />
          <span>Практика выполнена</span>
        </label>
      </div>
    `;

    header.insertAdjacentElement("afterend", section);

    const topicEl = section.querySelector("#tracker-topic");
    const practiceEl = section.querySelector("#tracker-practice");
    if (!topicEl || !practiceEl) return;

    const onChange = () => {
      const next = loadState();
      ensureLessonState(next, lesson);
      next[lesson].topic = topicEl.checked;
      next[lesson].practice = practiceEl.checked;
      saveState(next);
      section.remove();
      renderLesson(next, lesson);
    };

    topicEl.addEventListener("change", onChange);
    practiceEl.addEventListener("change", onChange);
  }

  document.addEventListener("DOMContentLoaded", () => {
    const state = loadState();
    const lesson = getLessonNumberFromPath();
    const isIndex = /\/index\.html$/.test(window.location.pathname) || window.location.pathname === "/" || /\/vue_learn\/$/.test(window.location.pathname);

    if (isIndex) {
      renderIndex(state);
      decorateTocCompleted(state);
      return;
    }

    if (lesson !== null) {
      renderLesson(state, lesson);
    }
  });
})();
