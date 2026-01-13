const loginCard = document.getElementById("loginCard");
const dashboard = document.getElementById("dashboard");
const greeting = document.getElementById("greeting");

const plannedHoursInput = document.getElementById("plannedHours");
const moodSelect = document.getElementById("moodSelect");
const musicModeSelect = document.getElementById("musicModeSelect");

const timerDisplay = document.getElementById("timerDisplay");
const alertMessage = document.getElementById("alertMessage");

const scheduleBlocks = document.getElementById("scheduleBlocks");
const musicPlayer = document.getElementById("musicPlayer");
const studyChartCanvas = document.getElementById("studyChart");

let chart;
let countdownInterval;
let endTime;

// ✅ LOCAL MUSIC FILES (NOW MATCH YOUR FILE NAMES)
const musicSources = {
  piano: "assets/piano.mp3",
  lofi: "assets/lofi.mp3"
};

// ---------------- PROFILE ----------------
saveProfile.onclick = () => {
  if (!userName.value || !userAge.value) return;
  localStorage.setItem("user", JSON.stringify({ name: userName.value }));
  loadUser();
};

resetProfile.onclick = () => {
  localStorage.clear();
  location.reload();
};

function loadUser() {
  const user = JSON.parse(localStorage.getItem("user"));
  if (!user) return;
  greeting.innerText = `Hi ${user.name} 👋 Let’s focus today`;
  loginCard.classList.add("hidden");
  dashboard.classList.remove("hidden");
}
loadUser();

// ---------------- MUSIC ----------------
musicModeSelect.onchange = () => {
  const mode = musicModeSelect.value;

  if (mode === "none") {
    musicPlayer.pause();
    musicPlayer.src = "";
    return;
  }

  musicPlayer.src = musicSources[mode];
  musicPlayer.load();
};

// ---------------- START SESSION ----------------
startSession.onclick = () => {
  const hours = Number(plannedHoursInput.value);

  // ✅ HARD LIMIT: 18 HOURS
  if (hours > 18) {
    alert(
      "🌙 That's enough for today!\n\n" +
      "Studying more than 18 hours can seriously affect your health.\n" +
      "Let’s continue the remaining work tomorrow 💙"
    );
    plannedHoursInput.value = 18;
    return;
  }

  if (!hours || hours <= 0) return;

  generateSchedule(hours);
  startCountdown(hours);
  updateWeeklyProgress(hours);

  const mood = moodSelect.value;
  if (hours > 6 && mood === "tired") {
    alertMessage.innerText =
      "⚠️ Burnout risk detected. Please slow down and rest well.";
    alertMessage.style.color = "#c0392b";
  } else {
    alertMessage.innerText =
      "🌱 Session started. Stay consistent and hydrated.";
    alertMessage.style.color = "#2e8b57";
  }
};

// ---------------- COUNTDOWN (TAB SAFE) ----------------
function startCountdown(hours) {
  clearInterval(countdownInterval);
  endTime = Date.now() + hours * 3600 * 1000;

  countdownInterval = setInterval(() => {
    const remaining = Math.max(0, Math.floor((endTime - Date.now()) / 1000));
    timerDisplay.innerText =
      "⏱ " + new Date(remaining * 1000).toISOString().substr(11, 8);

    if (remaining === 0) {
      clearInterval(countdownInterval);
      musicPlayer.pause();
      alertMessage.innerText =
        "🌿 Session complete. Great work today!";
    }
  }, 1000);
}

// ---------------- SCHEDULE + MEALS ----------------
function generateSchedule(totalHours) {
  scheduleBlocks.innerHTML = "";

  let now = new Date();
  let minutesLeft = totalHours * 60;

  while (minutesLeft > 0) {
    const start = new Date(now);
    const end = new Date(now.getTime() + 90 * 60000);

    addBlock("Study Session", start, end, "study");
    minutesLeft -= 90;
    now = end;

    if (minutesLeft <= 0) break;

    const meal = detectMeal(start, end);
    if (meal) {
      addBlock(meal.name, now, addMinutes(now, meal.duration), "meal");
      now = addMinutes(now, meal.duration);
    } else {
      addBlock("☕ Short Break", now, addMinutes(now, 10), "break");
      now = addMinutes(now, 10);
    }
  }
}

function detectMeal(start, end) {
  const s = start.getHours() * 60 + start.getMinutes();
  const e = end.getHours() * 60 + end.getMinutes();

  if (s < 510 && e >= 480) return { name: "🍳 Breakfast", duration: 30 };
  if (s < 795 && e >= 750) return { name: "🍽 Lunch", duration: 45 };
  if (s < 1010 && e >= 990) return { name: "☕ Snacks", duration: 20 };
  if (s < 1215 && e >= 1170) return { name: "🍽 Dinner", duration: 45 };

  return null;
}

function addBlock(title, start, end, type) {
  const div = document.createElement("div");
  div.className = `block ${type}`;
  div.innerText = `${title}\n${format(start)} – ${format(end)}`;
  scheduleBlocks.appendChild(div);
}

function addMinutes(d, m) {
  return new Date(d.getTime() + m * 60000);
}

function format(d) {
  return d.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

// ---------------- WEEKLY GRAPH ----------------
function updateWeeklyProgress(hours) {
  const data = JSON.parse(localStorage.getItem("weekly")) || [];
  data.push({ hours });
  localStorage.setItem("weekly", JSON.stringify(data));

  if (chart) chart.destroy();
  chart = new Chart(studyChartCanvas, {
    type: "line",
    data: {
      labels: data.map((_, i) => `Day ${i + 1}`),
      datasets: [{
        label: "Study Hours",
        data: data.map(d => d.hours),
        borderWidth: 2
      }]
    }
  });
}
