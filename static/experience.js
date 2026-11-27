(() => {
  const app = document.querySelector(".app");
  if (!app) return;

  // Separate full-screen pages with a real back stack.
  const pageStack = [];
  let activePage = null;

  function activatePage(id) {
    const page = document.getElementById(id);
    if (!page) return;
    if (activePage !== id) pageStack.push(activePage);
    app.classList.add("page-mode");
    app.querySelectorAll(".page-active").forEach(el => el.classList.remove("page-active"));
    page.classList.add("page-active");
    activePage = id;
    syncTelegramBackButton();
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack() {
    const previous = pageStack.pop();
    app.querySelectorAll(".page-active").forEach(el => el.classList.remove("page-active"));
    if (previous && document.getElementById(previous)) {
      const page = document.getElementById(previous);
      page.classList.add("page-active");
      activePage = previous;
      syncTelegramBackButton();
      app.classList.add("page-mode");
    } else {
      activePage = null;
      syncTelegramBackButton();
      app.classList.remove("page-mode");
    }
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  const wrapOpen = (name, id) => {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function(...args) {
      original.apply(this, args);
      activatePage(id);
    };
  };
  const wrapClose = (name) => {
    const original = window[name];
    if (typeof original !== "function") return;
    window[name] = function(...args) {
      original.apply(this, args);
      goBack();
    };
  };

  wrapOpen("openCase", "caseScreen");
  wrapOpen("openTasks", "tasksScreen");
  wrapOpen("openProfile", "profileScreen");
  wrapOpen("openReferrals", "referralScreen");
  wrapOpen("openCommentTasks", "commentTaskScreen");
  wrapClose("closeCase");
  wrapClose("closeTasks");
  wrapClose("closeProfile");
  wrapClose("closeReferrals");
  wrapClose("closeCommentTasks");

  // Theme selection is local to this device.
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll(".theme-dot")];
  const applyTheme = (theme) => {
    const allowed = ["red", "blue", "purple", "emerald"];
    const value = allowed.includes(theme) ? theme : "red";
    root.dataset.theme = value;
    themeButtons.forEach(btn => btn.classList.toggle("is-active", btn.dataset.theme === value));
    try { localStorage.setItem("morozway_theme", value); } catch (_) {}
  };
  let savedTheme = "red";
  try { savedTheme = localStorage.getItem("morozway_theme") || "red"; } catch (_) {}
  applyTheme(savedTheme);
  themeButtons.forEach(btn => btn.addEventListener("click", () => applyTheme(btn.dataset.theme)));

  // Layered snowfall across full width with depth tiers and smooth drift.
  const snow = document.getElementById("snowfield");
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const flakes = [];

  function buildSnowfield() {
    if (!snow || reducedMotion) return;
    snow.replaceChildren();
    flakes.length = 0;

    // Distribute across horizontal buckets so snow is evenly visible across the screen.
    const totalFlakes = 42;
    const fragment = document.createDocumentFragment();

    for (let i = 0; i < totalFlakes; i++) {
      const layer = i < 16 ? 0 : i < 30 ? 1 : 2; // 0 = far, 1 = mid, 2 = near
      const flake = document.createElement("i");
      const inner = document.createElement("i");

      flake.className = `snowflake ${layer === 0 ? "snowflake--far" : layer === 1 ? "snowflake--mid" : "snowflake--near"}`;

      const bucketStart = (i / totalFlakes) * 100;
      const bucketWidth = 100 / totalFlakes;
      const leftPct = Math.min(98.5, Math.max(1, bucketStart + Math.random() * bucketWidth));

      const size =
        layer === 0 ? 2.0 + Math.random() * 1.3 :
        layer === 1 ? 3.5 + Math.random() * 1.6 :
        5.2 + Math.random() * 2.2;

      const dur =
        layer === 0 ? 19 + Math.random() * 9 :
        layer === 1 ? 13.5 + Math.random() * 6 :
        9.5 + Math.random() * 4.2;

      const opacity =
        layer === 0 ? 0.34 + Math.random() * 0.16 :
        layer === 1 ? 0.56 + Math.random() * 0.2 :
        0.78 + Math.random() * 0.18;

      const drift =
        layer === 0 ? 6 + Math.random() * 5 :
        layer === 1 ? 11 + Math.random() * 7 :
        16 + Math.random() * 9;

      flake.style.left = `${leftPct.toFixed(2)}%`;
      flake.style.width = `${size.toFixed(1)}px`;
      flake.style.height = `${size.toFixed(1)}px`;
      flake.style.setProperty("--dur", `${dur.toFixed(1)}s`);
      flake.style.setProperty("--delay", `${(-Math.random() * dur).toFixed(1)}s`);

      inner.style.setProperty("--o", opacity.toFixed(2));
      inner.style.setProperty("--drift", `${drift.toFixed(1)}px`);
      inner.style.setProperty("--drift-dur", `${(3.6 + Math.random() * 2.2).toFixed(1)}s`);
      inner.style.setProperty("--drift-delay", `${(-Math.random() * 4).toFixed(1)}s`);

      flake.appendChild(inner);
      fragment.appendChild(flake);
      flakes.push(flake);
    }

    snow.appendChild(fragment);
  }

  buildSnowfield();

  if (!reducedMotion && flakes.length > 0) {
    let resizeTimer = null;
    window.addEventListener("resize", () => {
      clearTimeout(resizeTimer);
      resizeTimer = setTimeout(buildSnowfield, 200);
    }, { passive: true });

    document.addEventListener("visibilitychange", () => {
      const state = document.hidden ? "paused" : "running";
      for (let i = 0; i < flakes.length; i++) {
        flakes[i].style.animationPlayState = state;
      }
    }, { passive: true });
  }

  // Tactile feedback and value bump on balance or stat changes.
  const bumpElement = (el) => {
    if (!el || reducedMotion) return;
    el.classList.remove("is-updated");
    void el.offsetWidth;
    el.classList.add("is-updated");
  };

  let snapshot = "";
  const collectSnapshot = () => {
    const amountEl = document.querySelector(".amount");
    const caseBalEl = document.getElementById("caseBalance");
    const statVals = [...document.querySelectorAll(".stats .stat b")].map(n => n.textContent).join(",");
    return `${amountEl ? amountEl.textContent : ""}|${caseBalEl ? caseBalEl.textContent : ""}|${statVals}`;
  };

  snapshot = collectSnapshot();
  if (typeof MutationObserver !== "undefined") {
    const observer = new MutationObserver(() => {
      const next = collectSnapshot();
      if (next !== snapshot) {
        snapshot = next;
        bumpElement(document.querySelector(".amount"));
        bumpElement(document.getElementById("caseBalance"));
        document.querySelectorAll(".stats .stat b").forEach(bumpElement);
      }
    });
    observer.observe(app, { childList: true, subtree: true, characterData: true });
  }

  document.addEventListener("click", (event) => {
    const button = event.target.closest("button");
    if (!button || button.disabled || reducedMotion) return;
    button.classList.remove("tap-pop");
    void button.offsetWidth;
    button.classList.add("tap-pop");
  }, { passive: true });

  // Telegram Mini App integration.
  let tg = null;
  try {
    tg = window.Telegram && window.Telegram.WebApp;
    if (tg) {
      tg.ready();
      tg.expand();

      const user = tg.initDataUnsafe && tg.initDataUnsafe.user;
      if (user) {
        window.MOROZWAY_TG_USER = {
          id: user.id,
          first_name: user.first_name || "",
          last_name: user.last_name || "",
          username: user.username || ""
        };
      }

      if (tg.BackButton) {
        tg.BackButton.onClick(goBack);
        tg.BackButton.hide();
      }
    }
  } catch (error) {
    console.warn("Telegram WebApp integration:", error);
  }

  function syncTelegramBackButton() {
    if (!tg || !tg.BackButton) return;
    if (activePage) tg.BackButton.show();
    else tg.BackButton.hide();
  }
})();
