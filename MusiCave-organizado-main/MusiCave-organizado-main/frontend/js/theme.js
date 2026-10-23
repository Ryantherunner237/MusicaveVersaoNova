(() => {
  const storageKey = "musicave-theme";
  const savedTheme = localStorage.getItem(storageKey);

  function applyTheme(theme) {
    document.documentElement.dataset.theme = theme;
    localStorage.setItem(storageKey, theme);
  }

  applyTheme(savedTheme === "light" ? "light" : "dark");

  document.addEventListener("DOMContentLoaded", () => {
    const actions = document.querySelector(".header-actions");
    const headerInner = document.querySelector(".header-inner");
    const logo = headerInner?.querySelector(".logo");
    if (!actions || !logo) return;

    actions.style.visibility = "visible";

    const button = document.createElement("button");
    button.type = "button";
    button.className = "theme-toggle";
    button.innerHTML = `
      <svg class="bat-icon" viewBox="0 0 40 28" aria-hidden="true" focusable="false">
        <path class="bat-wings-open" d="M20 7 17 2l-2 7C11 5 6 4 1 5c3 3 2 7 0 10 5-1 8 2 11 5 2-2 5-1 8 3 3-4 6-5 8-3 3-3 6-6 11-5-2-3-3-7 0-10-5-1-10 0-14 4l-2-7z" />
        <path class="bat-wings-folded" d="M20 7 17 2l-2 7c-3-3-6-3-9-1 3 3 4 6 5 10 3-1 6 1 9 5 3-4 6-6 9-5 1-4 2-7 5-10-3-2-6-2-9 1l-2-7z" />
      </svg>`;

    function updateButton() {
      const isDark = document.documentElement.dataset.theme === "dark";
      button.setAttribute("aria-label", `Alternar tema, atualmente ${isDark ? "escuro" : "claro"}`);
      button.setAttribute("aria-pressed", String(isDark));
      button.title = `Alternar para o modo ${isDark ? "claro" : "escuro"}`;
    }

    updateButton();
    button.addEventListener("click", () => {
      const nextTheme = document.documentElement.dataset.theme === "dark" ? "light" : "dark";
      applyTheme(nextTheme);
      updateButton();
    });

    headerInner.insertBefore(button, logo);
  });
})();