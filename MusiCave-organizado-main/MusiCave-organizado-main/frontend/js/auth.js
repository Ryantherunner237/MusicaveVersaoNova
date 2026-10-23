(() => {
  const SESSION_KEY = "musicaveSession";

  function getSession() {
    try {
      const session = JSON.parse(localStorage.getItem(SESSION_KEY) || "null");
      return session?.token && session.user ? session : null;
    } catch {
      return null;
    }
  }

  function saveSession(session) {
    localStorage.setItem(SESSION_KEY, JSON.stringify(session));
  }

  function updateUser(user) {
    const session = getSession();
    if (!session) return;
    session.user = user;
    saveSession(session);
  }

  function clearSession() {
    localStorage.removeItem(SESSION_KEY);
  }

  async function request(path, options = {}) {
    const session = getSession();
    const headers = new Headers(options.headers || {});

    if (session?.token) headers.set("Authorization", `Bearer ${session.token}`);

    const response = await fetch(`/api${path}`, { ...options, headers });
    const data = await response.json().catch(() => ({}));

    if (response.status === 401 && session) clearSession();
    if (!response.ok) throw new Error(data.message || "Não foi possível concluir a solicitação.");
    return data;
  }

  function renderHeader() {
    const actions = document.querySelector(".header-actions");
    const session = getSession();
    if (!actions || !session) return;

    const loginControl = actions.querySelector('a[href="entrar.html"], .btn.ghost');
    const profileLink = document.createElement("a");
    profileLink.href = "perfil.html";
    profileLink.className = "nav-profile-link";
    profileLink.setAttribute("aria-label", `Abrir perfil de ${session.user.name}`);
    profileLink.title = session.user.name;

    if (session.user.avatar) {
      const avatar = document.createElement("img");
      avatar.className = "nav-profile-avatar";
      avatar.src = session.user.avatar;
      avatar.alt = `Foto de perfil de ${session.user.name}`;
      profileLink.append(avatar);
    } else {
      const initials = String(session.user.name || "U")
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part) => part[0])
        .join("")
        .toUpperCase();
      profileLink.textContent = initials || "U";
      profileLink.classList.add("nav-profile-initials");
    }

    if (loginControl) loginControl.replaceWith(profileLink);
    else if (!actions.querySelector(".nav-profile-link")) actions.prepend(profileLink);
  }

  document.addEventListener("DOMContentLoaded", () => {
    renderHeader();

    const logoutButton = document.getElementById("logoutBtn");
    logoutButton?.addEventListener("click", async () => {
      try {
        await request("/logout", { method: "POST" });
      } catch (error) {
        console.error(error);
      } finally {
        clearSession();
        window.location.href = "entrar.html";
      }
    });
  });

  window.MusiCaveAuth = { getSession, saveSession, updateUser, clearSession, request };
})();