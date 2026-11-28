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
    window.scrollTo({ top: 0, behavior: "auto" });
  }

  function goBack() {
    const previous = pageStack.pop();
    app.querySelectorAll(".page-active").forEach(el => el.classList.remove("page-active"));
    if (previous && document.getElementById(previous)) {
      const page = document.getElementById(previous);
      page.classList.add("page-active");
      activePage = previous;
      app.classList.add("page-mode");
    } else {
      activePage = null;
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
  wrapOpen("openWithdraw", "withdrawScreen");
  wrapOpen("openCommentTasks", "commentTaskScreen");
  wrapClose("closeCase");
  wrapClose("closeTasks");
  wrapClose("closeProfile");
  wrapClose("closeReferrals");
  wrapClose("closeWithdraw");
  wrapClose("closeCommentTasks");

  // Theme picker: 12 local color themes.
  const root = document.documentElement;
  const themeButtons = [...document.querySelectorAll(".theme-dot")];
  const allowedThemes = ["red","blue","purple","emerald","pink","cyan","orange","gold","violet","ice","mint","rose"];
  const popover = document.getElementById("themePopover");
  const trigger = document.querySelector(".theme-trigger");

  const applyTheme = (theme) => {
    const value = allowedThemes.includes(theme) ? theme : "red";
    root.dataset.theme = value;
    themeButtons.forEach(btn => btn.classList.toggle("is-active", btn.dataset.theme === value));
    try { localStorage.setItem("morozway_theme", value); } catch (_) {}
  };

  let savedTheme = "red";
  try { savedTheme = localStorage.getItem("morozway_theme") || "red"; } catch (_) {}
  applyTheme(savedTheme);

  themeButtons.forEach(btn => btn.addEventListener("click", () => {
    applyTheme(btn.dataset.theme);
    if (popover) popover.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  }));

  window.toggleThemePicker = () => {
    if (!popover) return;
    popover.hidden = !popover.hidden;
    if (trigger) trigger.setAttribute("aria-expanded", String(!popover.hidden));
  };

  document.addEventListener("click", event => {
    if (!popover || popover.hidden) return;
    if (popover.contains(event.target) || (trigger && trigger.contains(event.target))) return;
    popover.hidden = true;
    if (trigger) trigger.setAttribute("aria-expanded", "false");
  });

  // Custom crystal snowfall with depth, rotation and gentle sideways drift.
  const snow = document.getElementById("snowfield");
  const reducedMotion = window.matchMedia && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  let canvas, ctx, flakes = [], frame = 0, width = 0, height = 0, lastTime = 0;

  function resizeSnow() {
    if (!snow) return;
    if (!canvas) {
      canvas = document.createElement("canvas");
      snow.replaceChildren(canvas);
      ctx = canvas.getContext("2d");
      if (!ctx) return;
    }
    const rect = snow.getBoundingClientRect();
    width = Math.max(1, rect.width);
    height = Math.max(1, rect.height);
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    canvas.width = Math.round(width * dpr);
    canvas.height = Math.round(height * dpr);
    canvas.style.width = width + "px";
    canvas.style.height = height + "px";
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    flakes = Array.from({length:48}, () => ({
      x: Math.random() * width,
      y: Math.random() * height,
      r: 1.2 + Math.random() * 2.7,
      speed: 13 + Math.random() * 29,
      drift: 5 + Math.random() * 17,
      phase: Math.random() * Math.PI * 2,
      spin: (Math.random() - .5) * 1.4,
      angle: Math.random() * Math.PI * 2,
      alpha: .25 + Math.random() * .6
    }));
    drawSnow(0, true);
  }

  function drawCrystal(f) {
    ctx.save();
    ctx.translate(f.x, f.y);
    ctx.rotate(f.angle);
    ctx.strokeStyle = `rgba(225,240,255,${f.alpha})`;
    ctx.lineWidth = Math.max(.65, f.r * .28);
    ctx.lineCap = "round";
    for (let arm = 0; arm < 6; arm++) {
      ctx.rotate(Math.PI / 3);
      ctx.beginPath();
      ctx.moveTo(0, 0);
      ctx.lineTo(0, -f.r * 2.2);
      ctx.moveTo(0, -f.r * 1.25);
      ctx.lineTo(-f.r * .55, -f.r * 1.75);
      ctx.moveTo(0, -f.r * 1.25);
      ctx.lineTo(f.r * .55, -f.r * 1.75);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawSnow(time, staticFrame = false) {
    if (!ctx) return;
    const dt = lastTime ? Math.min((time - lastTime) / 1000, .04) : 0;
    lastTime = time;
    ctx.clearRect(0, 0, width, height);
    flakes.forEach(f => {
      if (!staticFrame) {
        f.y += f.speed * dt;
        f.x += Math.sin(time / 1300 + f.phase) * f.drift * dt;
        f.angle += f.spin * dt;
        if (f.y > height + 12) { f.y = -12; f.x = Math.random() * width; }
        if (f.x < -12) f.x = width + 8;
        if (f.x > width + 12) f.x = -8;
      }
      drawCrystal(f);
    });
    if (!reducedMotion) frame = requestAnimationFrame(drawSnow);
  }

  if (snow) {
    resizeSnow();
    if (!reducedMotion) {
      window.addEventListener("resize", resizeSnow, {passive:true});
      document.addEventListener("visibilitychange", () => {
        if (document.hidden) {
          cancelAnimationFrame(frame);
          lastTime = 0;
        } else {
          lastTime = 0;
          frame = requestAnimationFrame(drawSnow);
        }
      });
    }
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

  // Telegram expands the mini app to its comfortable full height.
  try {
    const tg = window.Telegram && window.Telegram.WebApp;
    if (tg) { tg.ready(); tg.expand(); }
  } catch (_) {}
})();
