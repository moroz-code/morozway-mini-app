let balance = 0;
let caseHistory = [];

function showSection(section) {
  if (section === "Задания") {
    openTasks();
    return;
  }

  if (section === "Рефералы") {
    openReferrals();
    return;
  }

  if (section === "Профиль") {
    openProfile();
    return;
  }

  if (section === "Кейс") {
    openCase();
    return;
  }

  const notice = document.getElementById("notice");
  notice.textContent = "Раздел «" + section + "» скоро появится";
}

function openCase() {
  let screen = document.getElementById("caseScreen");

  if (!screen) {
    screen = document.createElement("section");
    screen.id = "caseScreen";
    screen.className = "case-screen";

    screen.innerHTML = `
      <button class="case-back" onclick="closeCase()">‹</button>
      <h2>Кейс</h2>

      <div class="case-brand">MOROZ<span>WAY</span></div>

      <div class="case-balance" id="caseBalance">0 ⭐</div>
      <p class="case-cost">0 ⭐ · Бесплатный прокрут</p>

      <div class="case-roulette">
        <div class="case-pointer"></div>
        <div class="case-track" id="caseTrack">
          <div class="case-prize">🧸<small>Мишка</small></div>
          <div class="case-prize">💐<small>Букет</small></div>
          <div class="case-prize">🎂<small>Торт</small></div>
          <div class="case-prize">💍<small>Кольцо</small></div>
          <div class="case-prize">🚀<small>Ракета</small></div>
          <div class="case-prize">⚪<small>Пусто</small></div>
        </div>
      </div>

      <h3>🎁 Призы</h3>

      <div class="case-odds">
        <div>🧸<b>Мишка</b></div>
        <div>🚀<b>Ракета</b></div>
        <div>💐<b>Букет</b></div>
        <div>🎂<b>Торт</b></div>
        <div>💍<b>Кольцо</b></div>
        <div>⚪<b>Пусто</b></div>
      </div>

      <button class="case-spin" id="spinButton" onclick="spinCase()">
        Крутить
      </button>

      <p id="caseResult"></p>

      <h3>📜 История</h3>
      <div id="caseHistory" class="case-history">
        <p>Пока пусто</p>
      </div>
    `;

    document.querySelector(".app").appendChild(screen);
  }

  updateBalance();
  screen.style.display = "block";
  screen.scrollIntoView({behavior:"smooth"});
}

function closeCase() {
  document.getElementById("caseScreen").style.display = "none";
  window.scrollTo({top:0,behavior:"smooth"});
}

function spinCase() {
  const button = document.getElementById("spinButton");
  const track = document.getElementById("caseTrack");
  const result = document.getElementById("caseResult");

  if (button.disabled) return;

  button.disabled = true;
  result.textContent = "Рулетка крутится...";

  const prizes = [
    "Мишка 🧸",
    "Ракета 🚀",
    "Букет 💐",
    "Торт 🎂",
    "Кольцо 💍",
    "Пусто ⚪"
  ];

  const prize = prizes[Math.floor(Math.random() * prizes.length)];

  track.style.transition = "none";
  track.style.transform = "translateX(0)";
  void track.offsetWidth;

  track.style.transition = "transform 3s cubic-bezier(.12,.75,.15,1)";
  track.style.transform = "translateX(-500px)";

  setTimeout(() => {
    result.textContent = "Результат: " + prize;
    caseHistory.unshift({
      prize: prize,
      date: new Date().toLocaleString("ru-RU")
    });
    renderCaseHistory();
    saveGameData();
    button.disabled = false;
  }, 3100);
}


function updateBalance() {
  const mainBalance = document.querySelector(".amount");
  const caseBalance = document.getElementById("caseBalance");

  if (mainBalance) mainBalance.textContent = balance + " ⭐";
  if (caseBalance) caseBalance.textContent = balance + " ⭐";
}


function renderCaseHistory() {
  const history = document.getElementById("caseHistory");
  if (!history) return;

  if (caseHistory.length === 0) {
    history.innerHTML = "<p>Пока пусто</p>";
    return;
  }

  history.innerHTML = caseHistory.map(item => `
    <div class="history-item">
      <b>${item.prize}</b>
      <small>${item.date}</small>
    </div>
  `).join("");
}


function saveGameData() {
  localStorage.setItem("morozway_balance", String(balance));
  localStorage.setItem("morozway_history", JSON.stringify(caseHistory));
}

function loadGameData() {
  const savedBalance = localStorage.getItem("morozway_balance");
  const savedHistory = localStorage.getItem("morozway_history");

  if (savedBalance !== null) {
    balance = Math.max(0, Number(savedBalance) || 0);
  }

  if (savedHistory !== null) {
    try {
      const parsed = JSON.parse(savedHistory);
      if (Array.isArray(parsed)) caseHistory = parsed;
    } catch (e) {
      caseHistory = [];
    }
  }

  updateBalance();
  renderCaseHistory();
}

loadGameData();


function openProfile() {
  const app = document.querySelector(".app");
  let profile = document.getElementById("profileScreen");

  if (!profile) {
    profile = document.createElement("section");
    profile.id = "profileScreen";
    profile.className = "case-screen";

    profile.innerHTML = `
      <button class="case-back" onclick="closeProfile()">‹</button>
      <h2>Профиль</h2>

      <div class="case-brand">MOROZ<span>WAY</span></div>

      <div class="card">
        <h3 id="profileName">Пользователь</h3>
        <p id="profileId">Telegram ID: ожидает подключения</p>
        <h2 id="profileBalance">0 ⭐</h2>
      </div>

      <div class="stats card">
        <div>👥<b>0</b><small>Друзей</small></div>
        <div>🎁<b id="profilePrizes">0</b><small>Призов</small></div>
        <div>⭐<b id="profileStars">0</b><small>Баланс</small></div>
      </div>
    `;

    app.appendChild(profile);
  }

  profile.style.display = "block";
  document.getElementById("profileBalance").textContent = balance + " ⭐";
  document.getElementById("profileStars").textContent = balance;
  document.getElementById("profilePrizes").textContent = caseHistory.length;
  profile.scrollIntoView({behavior:"smooth"});
}

function closeProfile() {
  document.getElementById("profileScreen").style.display = "none";
  window.scrollTo({top:0,behavior:"smooth"});
}


function openReferrals() {
  let screen = document.getElementById("referralScreen");

  if (!screen) {
    screen = document.createElement("section");
    screen.id = "referralScreen";
    screen.className = "case-screen";

    screen.innerHTML = `
      <button class="case-back" onclick="closeReferrals()">‹</button>
      <h2>Рефералы</h2>

      <div class="case-brand">MOROZ<span>WAY</span></div>

      <div class="card">
        <h3>Приглашай друзей</h3>
        <p>Получай ⭐ за каждого активного приглашённого друга</p>
        <div class="case-balance">+3 ⭐</div>
      </div>

      <div class="card">
        <small>ВАШИ ПРИГЛАШЁННЫЕ</small>
        <h2 id="referralCount">0</h2>
      </div>

      <div class="card">
        <small>ЗАРАБОТАНО ЗА ДРУЗЕЙ</small>
        <h2 id="referralEarned">0 ⭐</h2>
      </div>

      <div class="card">
        <h3>Ваша ссылка</h3>
        <p id="referralLink">Появится после подключения Telegram</p>
      </div>

      <p>Приглашённые друзья появятся здесь после запуска реферальной системы.</p>
    `;

    document.querySelector(".app").appendChild(screen);
  }

  screen.style.display = "block";
  screen.scrollIntoView({behavior:"smooth"});
}

function closeReferrals() {
  document.getElementById("referralScreen").style.display = "none";
  window.scrollTo({top:0,behavior:"smooth"});
}

function openTasks() {
  let screen = document.getElementById("tasksScreen");

  if (!screen) {
    screen = document.createElement("section");
    screen.id = "tasksScreen";
    screen.className = "case-screen";

    screen.innerHTML = `
      <button class="case-back" onclick="closeTasks()">‹</button>
      <h2>Задания</h2>

      <div class="case-brand">MOROZ<span>WAY</span></div>

      <p>Выбери категорию заданий</p>

      <div class="card" onclick="openTaskCategory('comments')" style="padding:20px;margin-bottom:12px;cursor:pointer">
        <h3>💬 Рассылка комментариев</h3>
        <p>Выполняй задания и отправляй скриншоты на проверку</p>
        <b>Перейти ›</b>
      </div>

      <div class="card" onclick="openTaskCategory('boosts')" style="padding:20px;margin-bottom:12px;cursor:pointer">
        <h3>🚀 Буст Telegram</h3>
        <p>Задания для каналов и групп</p>
        <b>Перейти ›</b>
      </div>

      <div class="card" onclick="openTaskCategory('ordinary')" style="padding:20px;margin-bottom:12px;cursor:pointer">
        <h3>📋 Обычные задания</h3>
        <p>Подписки, вступления и другие задания</p>
        <b>Перейти ›</b>
      </div>
    `;

    document.querySelector(".app").appendChild(screen);
  }

  screen.style.display = "block";
  screen.scrollIntoView({behavior:"smooth"});
}

function closeTasks() {
  document.getElementById("tasksScreen").style.display = "none";
  window.scrollTo({top:0,behavior:"smooth"});
}

function openTaskCategory(category) {
  if (category === "comments") {
    openCommentTasks();
    return;
  }

  alert("Этот раздел добавим следующим этапом.");
}

const commentTaskConfig = {
  title: "Рассылка комментариев",
  reward: 2,
  requiredScreenshots: 10,
  description: "Выполни задание по инструкции и приложи скриншоты для проверки.",
  commentText: "Здесь будет текст комментария, который задаёт администратор.",
  imageUrl: ""
};

function openCommentTasks() {
  let screen = document.getElementById("commentTaskScreen");

  if (!screen) {
    screen = document.createElement("section");
    screen.id = "commentTaskScreen";
    screen.className = "case-screen";

    screen.innerHTML = `
      <button class="case-back" onclick="closeCommentTasks()">‹</button>

      <div class="case-brand">MOROZ<span>WAY</span></div>

      <div class="card" style="padding:18px;margin:15px 0">
        <div style="display:flex;justify-content:space-between;align-items:center">
          <h2>Как выполнить</h2>
          <b id="commentReward">+2 ⭐</b>
        </div>

        <div id="commentExampleImage"
          style="display:none;margin:15px 0">
          <img id="commentImage" alt="Материал задания"
            style="width:100%;border-radius:12px">
        </div>

        <h3>ℹ️ Инфо:</h3>
        <p id="commentDescription"></p>

        <h3>Текст комментария:</h3>
        <div class="card" style="padding:14px">
          <p id="commentText"></p>
          <button class="case-spin" id="copyCommentButton">
            Скопировать текст
          </button>
        </div>

        <h3>📸 Доказательства выполнения</h3>
        <p id="screenshotCounter">Выбрано: 0 из 10</p>

        <input
          id="commentScreenshots"
          type="file"
          accept="image/*"
          multiple
          style="width:100%;margin:12px 0"
        >

        <div id="commentPreview"
          style="display:grid;grid-template-columns:repeat(2,1fr);gap:8px">
        </div>

        <button class="case-spin" id="submitCommentTask" disabled>
          Отправить на проверку
        </button>

        <p id="commentSubmitNotice"></p>
      </div>
    `;

    document.querySelector(".app").appendChild(screen);

    document.getElementById("copyCommentButton").onclick = async () => {
      try {
        await navigator.clipboard.writeText(commentTaskConfig.commentText);
        document.getElementById("commentSubmitNotice").textContent =
          "Текст скопирован!";
      } catch {
        document.getElementById("commentSubmitNotice").textContent =
          "Не удалось скопировать текст.";
      }
    };

    const fileInput = document.getElementById("commentScreenshots");

    fileInput.addEventListener("change", () => {
      const files = Array.from(fileInput.files || []);
      const required = commentTaskConfig.requiredScreenshots;
      const preview = document.getElementById("commentPreview");

      preview.innerHTML = "";

      files.slice(0, required).forEach(file => {
        if (!file.type.startsWith("image/")) return;

        const img = document.createElement("img");
        img.src = URL.createObjectURL(file);
        img.style.width = "100%";
        img.style.borderRadius = "10px";
        preview.appendChild(img);
      });

      document.getElementById("screenshotCounter").textContent =
        `Выбрано: ${files.length} из ${required}`;

      document.getElementById("submitCommentTask").disabled =
        files.length !== required ||
        files.some(file => !file.type.startsWith("image/"));
    });

    document.getElementById("submitCommentTask").onclick = () => {
      document.getElementById("commentSubmitNotice").textContent =
        "Интерфейс готов. Отправка администратору будет подключена через сервер.";
    };
  }

  document.getElementById("commentReward").textContent =
    "+" + commentTaskConfig.reward + " ⭐";

  document.getElementById("commentDescription").textContent =
    commentTaskConfig.description;

  document.getElementById("commentText").textContent =
    commentTaskConfig.commentText;

  document.getElementById("screenshotCounter").textContent =
    "Выбрано: 0 из " + commentTaskConfig.requiredScreenshots;

  const imageBox = document.getElementById("commentExampleImage");

  if (commentTaskConfig.imageUrl) {
    document.getElementById("commentImage").src =
      commentTaskConfig.imageUrl;
    imageBox.style.display = "block";
  } else {
    imageBox.style.display = "none";
  }

  screen.style.display = "block";
  screen.scrollIntoView({behavior:"smooth"});
}

function closeCommentTasks() {
  document.getElementById("commentTaskScreen").style.display = "none";
  window.scrollTo({top:0,behavior:"smooth"});
}

