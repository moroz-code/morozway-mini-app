(() => {
  const base = String(window.MOROZWAY_API_URL || "").replace(/\/+$/, "");
  let lastData = null;
  let selectedTaskId = null;
  let selectedTask = null;

  function initData() {
    return window.Telegram?.WebApp?.initData || "";
  }

  async function api(path, options = {}) {
    if (!base) {
      throw new Error("Сервер ещё не подключён. Нужен HTTPS-адрес VPS.");
    }
    const raw = initData();
    if (!raw) throw new Error("Открой Mini App через Telegram.");
    const headers = {
      "X-Telegram-Init-Data": raw,
      ...(options.headers || {})
    };
    return fetch(base + path, { ...options, headers });
  }

  function applyData(data) {
    lastData = data;

    const profileName = document.getElementById("profileName");
    const profileId = document.getElementById("profileId");

    if (profileName && data.user) {
      profileName.textContent =
        data.user.first_name || data.user.username || "Пользователь";
    }

    if (profileId && data.user) {
      profileId.textContent = "Telegram ID: " + data.user.id;
    }

    if (typeof balance !== "undefined") {
      balance = Number(data.stats.balance || 0);
      if (typeof updateBalance === "function") updateBalance();
    }

    const homeFriends = document.getElementById("homeFriends");
    if (homeFriends) {
      homeFriends.textContent = Number(data.stats.referral_count || 0);
    }

    const homeDays = document.getElementById("homeDays");
    const daysValue = data.stats.days_in_bot ?? data.stats.days ?? data.stats.days_active;
    if (homeDays && daysValue !== undefined && Number.isFinite(Number(daysValue))) {
      homeDays.textContent = Number(daysValue);
    }

    const homeReward = document.getElementById("homeReferralReward");
    if (homeReward && data.stats.referral_reward !== undefined) {
      homeReward.textContent = "+" + Number(data.stats.referral_reward);
    }

    const profileBalance = document.getElementById("profileBalance");
    const profileStars = document.getElementById("profileStars");
    const referralCount = document.getElementById("referralCount");
    const referralEarned = document.getElementById("referralEarned");
    const referralLink = document.getElementById("referralLink");

    if (profileBalance) profileBalance.textContent = data.stats.balance + " ⭐";
    if (profileStars) profileStars.textContent = data.stats.balance;
    if (referralCount) referralCount.textContent = data.stats.referral_count;
    if (referralEarned) referralEarned.textContent = data.stats.referral_earned + " ⭐";
    if (referralLink) referralLink.textContent = data.referral_link;

    renderTasks();
  }

  async function refresh() {
    if (!base || !initData()) return;
    try {
      const response = await api("/api/me");
      if (!response.ok) throw new Error(await response.text());
      applyData(await response.json());
    } catch (error) {
      console.warn("MOROZWAY API:", error.message);
    }
  }

  function ensureTaskContainer() {
    const screen = document.getElementById("tasksScreen");
    if (!screen) return null;

    let container = document.getElementById("morozwayTaskList");
    if (!container) {
      container = document.createElement("div");
      container.id = "morozwayTaskList";
      container.style.padding = "10px 0";
      screen.appendChild(container);
    }
    return container;
  }

  function renderTasks() {
    const container = ensureTaskContainer();
    if (!container) return;

    const tasks = lastData?.tasks || [];
    container.innerHTML = `
      <h3 style="margin:12px 0">📋 Доступные задания</h3>
      ${
        tasks.length
          ? tasks.map(task => `
            <div class="card" style="padding:16px;margin:10px 0">
              <h3>${escapeHTML(task.title)}</h3>
              <p>Награда: <b>+${Number(task.reward)} ⭐</b></p>
              <p>Скриншотов: ${Number(task.required_screenshots)}</p>
              <button class="case-spin" data-task-id="${Number(task.id)}">
                Открыть задание
              </button>
            </div>
          `).join("")
          : `<p>Пока нет активных заданий. Загляни позже.</p>`
      }
    `;

    container.querySelectorAll("[data-task-id]").forEach(button => {
      button.addEventListener("click", () => {
        const id = Number(button.dataset.taskId);
        const task = tasks.find(item => Number(item.id) === id);
        if (!task) return;
        selectTask(task);
      });
    });
  }

  function escapeHTML(value) {
    return String(value ?? "").replace(/[&<>"']/g, char => ({
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#39;"
    })[char]);
  }

  function selectTask(task) {
    selectedTaskId = Number(task.id);
    selectedTask = task;

    window.commentTaskConfig = {
      title: task.title,
      reward: Number(task.reward),
      requiredScreenshots: Number(task.required_screenshots),
      description: task.description || "",
      commentText: task.comment || "",
      imageUrl: ""
    };

    if (typeof window.openCommentTasks === "function") {
      window.openCommentTasks();
    }
  }

  window.MOROZWAY_REFRESH = refresh;
  window.MOROZWAY_RENDER_TASKS = renderTasks;

  if (typeof window.openTasks === "function") {
    const original = window.openTasks;
    window.openTasks = function() {
      original();
      refresh().then(renderTasks);
    };
  }

  if (typeof window.openTaskCategory === "function") {
    window.openTaskCategory = function(category) {
      if (category === "comments") {
        const screen = document.getElementById("tasksScreen");
        if (screen) screen.style.display = "block";
        refresh().then(renderTasks);
        return;
      }
      alert("Этот раздел добавим следующим этапом.");
    };
  }

  if (typeof window.openProfile === "function") {
    const original = window.openProfile;
    window.openProfile = function() {
      original();
      refresh();
    };
  }

  if (typeof window.openReferrals === "function") {
    const original = window.openReferrals;
    window.openReferrals = function() {
      original();
      refresh();
    };
  }

  if (typeof window.openCommentTasks === "function") {
    const original = window.openCommentTasks;
    window.openCommentTasks = function() {
      original();

      const button = document.getElementById("submitCommentTask");
      const input = document.getElementById("commentScreenshots");
      const notice = document.getElementById("commentSubmitNotice");
      if (!button || !input || !notice) return;

      const config = window.commentTaskConfig || {};
      const required = Number(config.requiredScreenshots || 1);

      const reward = document.getElementById("commentReward");
      const description = document.getElementById("commentDescription");
      const comment = document.getElementById("commentText");
      const counter = document.getElementById("screenshotCounter");

      if (reward) reward.textContent = "+" + Number(config.reward || 0) + " ⭐";
      if (description) description.textContent = config.description || "";
      if (comment) comment.textContent = config.commentText || "";
      if (counter) counter.textContent = "Выбрано: 0 из " + required;

      input.value = "";
      document.getElementById("commentPreview").innerHTML = "";
      button.disabled = true;
      notice.textContent = "";

      input.onchange = () => {
        const files = Array.from(input.files || []);
        const currentRequired = Number(
          window.commentTaskConfig?.requiredScreenshots || 1
        );
        const preview = document.getElementById("commentPreview");
        preview.innerHTML = "";

        files.slice(0, currentRequired).forEach(file => {
          if (!file.type.startsWith("image/")) return;
          const img = document.createElement("img");
          img.src = URL.createObjectURL(file);
          img.style.width = "100%";
          img.style.borderRadius = "10px";
          preview.appendChild(img);
        });

        counter.textContent =
          `Выбрано: ${files.length} из ${currentRequired}`;

        button.disabled =
          files.length !== currentRequired ||
          files.some(file => !file.type.startsWith("image/"));
      };

      const copyButton = document.getElementById("copyCommentButton");
      if (copyButton) {
        copyButton.onclick = async () => {
          try {
            await navigator.clipboard.writeText(
              window.commentTaskConfig?.commentText || ""
            );
            notice.textContent = "Текст скопирован!";
          } catch {
            notice.textContent = "Не удалось скопировать текст.";
          }
        };
      }

      button.onclick = async () => {
        const files = Array.from(input.files || []);
        const currentTaskId = selectedTaskId;
        const currentRequired = Number(
          window.commentTaskConfig?.requiredScreenshots || 1
        );

        if (!currentTaskId) {
          notice.textContent = "Сначала выбери задание из списка.";
          return;
        }
        if (files.length !== currentRequired) {
          notice.textContent =
            `Нужно выбрать ${currentRequired} скриншотов.`;
          return;
        }

        button.disabled = true;
        button.textContent = "Отправляем...";

        try {
          const form = new FormData();
          form.append("task_id", String(currentTaskId));
          files.forEach(file => {
            form.append("screenshots", file, file.name);
          });

          const response = await api("/api/submit", {
            method: "POST",
            body: form
          });

          if (!response.ok) {
            let message = await response.text();
            try {
              const parsed = JSON.parse(message);
              message = parsed.message || parsed.error || message;
            } catch {}
            throw new Error(message);
          }

          const result = await response.json();
          notice.textContent =
            "✅ Заявка #" + result.submission_id +
            " отправлена администратору на проверку.";

          input.value = "";
          document.getElementById("commentPreview").innerHTML = "";
          counter.textContent = "Заявка отправлена";
        } catch (error) {
          notice.textContent = "Не удалось отправить: " + error.message;
        } finally {
          button.disabled = false;
          button.textContent = "Отправить на проверку";
        }
      };
    };
  }

  refresh();
})();
