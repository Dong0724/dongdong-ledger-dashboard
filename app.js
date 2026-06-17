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
  calendarTitle: document.querySelector("#calendarTitle"),
  selectedDayTotal: document.querySelector("#selectedDayTotal"),
  calendarGrid: document.querySelector("#calendarGrid"),
  entryTable: document.querySelector("#entryTable"),
  entryCount: document.querySelector("#entryCount"),
  dayTitle: document.querySelector("#dayTitle"),
  dayCount: document.querySelector("#dayCount"),
  dayEntries: document.querySelector("#dayEntries"),
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

init();

async function init() {
  const response = await fetch(`./ledger-data.json?updated=${Date.now()}`, { cache: "reload" });
  if (!response.ok) {
    showLoadError();
    return;
  }

  state.payload = await response.json();
  state.monthIndex = Math.max(0, state.payload.months.length - 1);
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
  renderEntries(month);
  renderDayEntries(month);
  renderFooter();
}

function currentMonth() {
  return state.payload?.months?.[state.monthIndex];
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

  elements.calendarTitle.textContent = `${month.month}`;
  elements.selectedDayTotal.textContent = `${state.selectedDate}・${money(month.dailyTotals[state.selectedDate] ?? 0)}`;
  elements.calendarGrid.replaceChildren(...cells);
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
