const state = {
  payload: undefined,
  monthIndex: 0,
  selectedDate: undefined
};

const elements = {
  monthSelect: document.querySelector("#monthSelect"),
  prevMonth: document.querySelector("#prevMonth"),
  nextMonth: document.querySelector("#nextMonth"),
  totalExpense: document.querySelector("#totalExpense"),
  totalIncome: document.querySelector("#totalIncome"),
  netTotal: document.querySelector("#netTotal"),
  pieChart: document.querySelector("#pieChart"),
  categoryLegend: document.querySelector("#categoryLegend"),
  zodiacMascotStage: document.querySelector("#zodiacMascotStage"),
  zodiacMascot: document.querySelector("#zodiacMascot"),
  calendarPanel: document.querySelector("#calendarPanel"),
  calendarTitle: document.querySelector("#calendarTitle"),
  selectedDayTotal: document.querySelector("#selectedDayTotal"),
  calendarGrid: document.querySelector("#calendarGrid"),
  entryTable: document.querySelector("#entryTable"),
  entryCount: document.querySelector("#entryCount"),
  dayTitle: document.querySelector("#dayTitle"),
  dayCount: document.querySelector("#dayCount"),
  dayEntries: document.querySelector("#dayEntries"),
  splitTable: document.querySelector("#splitTable"),
  splitCount: document.querySelector("#splitCount"),
  foreignTable: document.querySelector("#foreignTable"),
  foreignCount: document.querySelector("#foreignCount"),
  generatedAt: document.querySelector("#generatedAt")
};

const formatter = new Intl.NumberFormat("zh-TW", {
  style: "currency",
  currency: "TWD",
  maximumFractionDigits: 0
});

const numberFormatter = new Intl.NumberFormat("zh-TW", {
  maximumFractionDigits: 2
});

const calendarThemes = [
  { className: "theme-new-year", label: "春節", scene: "run" },
  { className: "theme-plum", label: "梅香", scene: "run" },
  { className: "theme-spring", label: "春日", scene: "run" },
  { className: "theme-sakura", label: "櫻花", scene: "run" },
  { className: "theme-fresh-green", label: "新綠", scene: "run" },
  { className: "theme-dragon-boat", label: "端午", scene: "wrap" },
  { className: "theme-summer-race", label: "盛夏", scene: "run" },
  { className: "theme-seaside", label: "海風", scene: "run" },
  { className: "theme-moon", label: "中秋", scene: "run" },
  { className: "theme-autumn", label: "秋收", scene: "run" },
  { className: "theme-maple", label: "楓紅", scene: "run" },
  { className: "theme-christmas", label: "聖誕", scene: "run" }
];

const zodiacCycle = [
  { key: "rat", name: "鼠" },
  { key: "ox", name: "牛" },
  { key: "tiger", name: "虎" },
  { key: "rabbit", name: "兔" },
  { key: "dragon", name: "龍" },
  { key: "snake", name: "蛇" },
  { key: "horse", name: "馬" },
  { key: "goat", name: "羊" },
  { key: "monkey", name: "猴" },
  { key: "rooster", name: "雞" },
  { key: "dog", name: "狗" },
  { key: "pig", name: "豬" }
];

const zodiacAssetSets = {
  horse: {
    run: "./assets/horse-run-v2.png",
    wrap: "./assets/horse-wrap-v2.png"
  }
};

init();

async function init() {
  const response = await fetch(`./ledger-data.json?updated=${Date.now()}`, { cache: "reload" });
  if (!response.ok) {
    showLoadError();
    return;
  }

  state.payload = await response.json();
  state.monthIndex = preferredMonthIndex(state.payload.months);
  bindEvents();
  populateMonthSelect();
  render();
}

function bindEvents() {
  elements.monthSelect.addEventListener("change", () => {
    state.monthIndex = Number(elements.monthSelect.value);
    state.selectedDate = undefined;
    render();
  });

  elements.prevMonth.addEventListener("click", () => {
    state.monthIndex = Math.max(0, state.monthIndex - 1);
    state.selectedDate = undefined;
    render();
  });

  elements.nextMonth.addEventListener("click", () => {
    state.monthIndex = Math.min(state.payload.months.length - 1, state.monthIndex + 1);
    state.selectedDate = undefined;
    render();
  });
}

function populateMonthSelect() {
  elements.monthSelect.replaceChildren(
    ...state.payload.months.map((month, index) => {
      const option = document.createElement("option");
      option.value = String(index);
      option.textContent = month.month;
      return option;
    })
  );
}

function render() {
  const month = currentMonth();
  if (!month) {
    showEmptyDashboard();
    return;
  }

  elements.monthSelect.value = String(state.monthIndex);
  elements.prevMonth.disabled = state.monthIndex === 0;
  elements.nextMonth.disabled = state.monthIndex === state.payload.months.length - 1;

  if (!state.selectedDate) {
    state.selectedDate = latestDateWithEntries(month) ?? firstDateOfMonth(month.month);
  }

  renderSummary(month);
  renderChart(month);
  renderCalendar(month);
  renderDayEntries(month);
  renderSplitEntries(month);
  renderForeignEntries(month);
  renderEntries(month);
  renderFooter();
}

function currentMonth() {
  return state.payload?.months?.[state.monthIndex];
}

function preferredMonthIndex(months) {
  const currentMonth = currentMonthKey();
  const currentIndex = months.findIndex((month) => month.month === currentMonth);
  return currentIndex >= 0 ? currentIndex : Math.max(0, months.length - 1);
}

function currentMonthKey() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function renderSummary(month) {
  elements.totalExpense.textContent = money(month.totalExpense);
  elements.totalIncome.textContent = money(month.totalIncome);
  elements.netTotal.textContent = money(month.net);
}

function renderChart(month) {
  let cursor = 0;
  const segments = month.categories
    .filter((category) => category.amount > 0)
    .map((category) => {
      const start = cursor;
      cursor += category.ratio * 100;
      return `${category.color} ${start}% ${cursor}%`;
    });

  elements.pieChart.style.setProperty("--pie-fill", segments.length ? `conic-gradient(${segments.join(", ")})` : "#f0ebe1");

  elements.categoryLegend.replaceChildren(
    ...month.categories.map((category) => {
      const row = document.createElement("div");
      row.className = `legend-row${category.amount > 0 ? "" : " is-zero"}`;
      row.innerHTML = `
        <span class="swatch" style="background:${escapeAttr(category.color)}"></span>
        <span class="legend-name">${escapeHtml(category.category)}</span>
        <span class="legend-metric">
          <strong class="legend-amount">${money(category.amount)}</strong>
          <span class="legend-percent">${percent(category.ratio)}</span>
        </span>
      `;
      return row;
    })
  );
}

function renderCalendar(month) {
  const [year, monthNumber] = month.month.split("-").map(Number);
  const zodiac = zodiacForYear(year);
  applyCalendarTheme(year, monthNumber);
  const first = new Date(year, monthNumber - 1, 1);
  const lastDay = new Date(year, monthNumber, 0).getDate();
  const blanks = first.getDay();
  const cells = [];

  for (let i = 0; i < blanks; i += 1) {
    const blank = document.createElement("button");
    blank.className = "day-button is-empty";
    blank.type = "button";
    blank.tabIndex = -1;
    cells.push(blank);
  }

  for (let day = 1; day <= lastDay; day += 1) {
    const date = `${month.month}-${String(day).padStart(2, "0")}`;
    const total = month.dailyTotals[date] ?? 0;
    const button = document.createElement("button");
    button.className = `day-button${state.selectedDate === date ? " is-selected" : ""}`;
    button.type = "button";
    button.innerHTML = `
      <span class="day-number">${day}</span>
      <span class="day-total">${total > 0 ? money(total) : ""}</span>
    `;
    button.addEventListener("click", () => {
      state.selectedDate = date;
      render();
    });
    cells.push(button);
  }

  const theme = calendarThemes[monthNumber - 1] ?? calendarThemes[0];
  elements.calendarTitle.textContent = `${month.month}｜${zodiac.name}年・${theme.label}`;
  elements.selectedDayTotal.textContent = `${state.selectedDate}・${money(month.dailyTotals[state.selectedDate] ?? 0)}`;
  elements.calendarGrid.replaceChildren(...cells);
}

function applyCalendarTheme(year, monthNumber) {
  const theme = calendarThemes[monthNumber - 1] ?? calendarThemes[0];
  const zodiac = zodiacForYear(year);
  const asset = zodiacAssetSets[zodiac.key]?.[theme.scene];
  elements.calendarPanel.className = `panel calendar-panel ${theme.className}`;
  document.body.classList.remove(...calendarThemes.map((item) => item.className));
  document.body.classList.add(theme.className);
  document.body.dataset.zodiac = zodiac.key;
  document.body.dataset.mascotScene = theme.scene;
  elements.zodiacMascotStage.hidden = !asset;
  if (asset) {
    elements.zodiacMascot.src = asset;
  } else {
    elements.zodiacMascot.removeAttribute("src");
  }
}

function zodiacForYear(year) {
  const index = ((year - 2020) % zodiacCycle.length + zodiacCycle.length) % zodiacCycle.length;
  return zodiacCycle[index];
}

function renderEntries(month) {
  const rows = month.entries
    .slice()
    .reverse()
    .map((entry) => {
      const row = document.createElement("tr");
      row.innerHTML = `
        <td>${escapeHtml(entry.date)}</td>
        <td>${categoryPill(entry.category)}</td>
        <td>${escapeHtml(entry.item)}</td>
        <td>${escapeHtml(entry.splitParticipants || "")}</td>
        <td class="amount-cell">${entry.type === "income" ? "+" : ""}${formatEntryAmount(entry)}</td>
      `;
      return row;
    });

  elements.entryTable.replaceChildren(...rows);
  elements.entryCount.textContent = `${month.entries.length} 筆`;
}

function renderDayEntries(month) {
  const entries = month.entries.filter((entry) => entry.date === state.selectedDate);
  elements.dayTitle.textContent = state.selectedDate ?? "日期明細";
  elements.dayCount.textContent = `${entries.length} 筆`;

  if (entries.length === 0) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.textContent = "這天沒有消費紀錄";
    elements.dayEntries.replaceChildren(empty);
    return;
  }

  elements.dayEntries.replaceChildren(
    ...entries.map((entry) => {
      const item = document.createElement("div");
      item.className = "day-entry";
      item.style.borderColor = colorForCategory(entry.category);
      item.innerHTML = `
        <strong>${escapeHtml(entry.item)}</strong>
        <span>${escapeHtml(entry.category)}・${entry.type === "income" ? "+" : ""}${formatEntryAmount(entry)}</span>
        ${entry.splitParticipants ? `<small>拆帳人員：${escapeHtml(entry.splitParticipants)}</small>` : ""}
      `;
      return item;
    })
  );
}

function renderSplitEntries(month) {
  const entries = month.entries.filter((entry) => entry.splitParticipants);
  elements.splitCount.textContent = `${entries.length} 筆`;

  if (entries.length === 0) {
    elements.splitTable.replaceChildren(emptyTableRow("本月沒有拆帳紀錄", 4));
    return;
  }

  elements.splitTable.replaceChildren(
    ...entries
      .slice()
      .reverse()
      .map((entry) => {
        const participants = splitParticipantList(entry.splitParticipants);
        const payers = participants.filter((name) => !isSelfParticipant(name));
        const perPerson = participants.length > 0 ? Number(entry.amount || 0) / participants.length : 0;
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(entry.date)}</td>
          <td>${escapeHtml(entry.item)}</td>
          <td>${escapeHtml(payers.length ? payers.join("、") : entry.splitParticipants)}</td>
          <td class="amount-cell">${formatSplitAmount(perPerson, entry.currency)}</td>
        `;
        return row;
      })
  );
}

function renderForeignEntries(month) {
  const entries = month.entries.filter((entry) => entry.currency && entry.currency !== "TWD");
  elements.foreignCount.textContent = `${entries.length} 筆`;

  if (entries.length === 0) {
    elements.foreignTable.replaceChildren(emptyTableRow("本月沒有外幣花費", 4));
    return;
  }

  elements.foreignTable.replaceChildren(
    ...entries
      .slice()
      .reverse()
      .map((entry) => {
        const row = document.createElement("tr");
        row.innerHTML = `
          <td>${escapeHtml(entry.date)}</td>
          <td>${escapeHtml(entry.currency)}</td>
          <td>${escapeHtml(entry.item)}</td>
          <td class="amount-cell">${formatEntryAmount(entry)}</td>
        `;
        return row;
      })
  );
}

function renderFooter() {
  const generatedAt = state.payload.generatedAt ? new Date(state.payload.generatedAt) : undefined;
  elements.generatedAt.textContent = generatedAt ? `更新時間：${generatedAt.toLocaleString("zh-TW")}` : "";
}

function showLoadError() {
  document.body.innerHTML = '<main class="app-shell"><div class="empty-state">無法讀取 ledger-data.json</div></main>';
}

function showEmptyDashboard() {
  document.body.innerHTML = '<main class="app-shell"><div class="empty-state">目前沒有記帳月份資料</div></main>';
}

function latestDateWithEntries(month) {
  return month.entries.at(-1)?.date;
}

function firstDateOfMonth(month) {
  return `${month}-01`;
}

function money(value) {
  return formatter.format(Number(value || 0));
}

function formatEntryAmount(entry) {
  const currency = entry.currency || "TWD";
  if (currency === "TWD") {
    return money(entry.amount);
  }
  return `${numberFormatter.format(Number(entry.amount || 0))} ${currency}`;
}

function formatSplitAmount(value, currency) {
  if ((currency || "TWD") === "TWD") {
    return money(value);
  }
  return `${numberFormatter.format(Number(value || 0))} ${currency}`;
}

function splitParticipantList(value) {
  return String(value || "")
    .split(/[、,，/]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

function isSelfParticipant(name) {
  return /^(我|自己|東東|DongDong|me)$/i.test(name);
}

function emptyTableRow(message, colSpan) {
  const row = document.createElement("tr");
  row.innerHTML = `<td class="empty-table-cell" colspan="${colSpan}">${escapeHtml(message)}</td>`;
  return row;
}

function percent(value) {
  return `${(Number(value || 0) * 100).toFixed(1)}%`;
}

function categoryPill(category) {
  return `<span class="category-pill"><span class="swatch" style="background:${escapeAttr(colorForCategory(category))}"></span>${escapeHtml(category)}</span>`;
}

function colorForCategory(category) {
  return state.payload.categories.find((item) => item.name === category)?.color ?? "#6B7280";
}

function escapeHtml(value) {
  return String(value).replace(/[&<>"']/g, (char) => {
    const map = {
      "&": "&amp;",
      "<": "&lt;",
      ">": "&gt;",
      '"': "&quot;",
      "'": "&#039;"
    };
    return map[char];
  });
}

function escapeAttr(value) {
  return escapeHtml(value);
}
