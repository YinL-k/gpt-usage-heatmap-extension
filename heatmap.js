
let allData = {};
let currentYear = new Date().getFullYear();
let yearSelectEl;

/* ---------- Bootstrap ---------- */

document.addEventListener("DOMContentLoaded", async () => {
  yearSelectEl = document.getElementById("yearSelect");
  allData = await getStorageData();

  initMonthsHeader();
  initThemeToggle();
  initExportImport();
  initModal();

  buildYearOptions();
  renderCalendar(currentYear);

  yearSelectEl.addEventListener("change", (e) => {
    const year = parseInt(e.target.value, 10);
    if (!Number.isNaN(year)) {
      currentYear = year;
      renderCalendar(currentYear);
    }
  });
});

/* ---------- Storage helpers ---------- */

function getStorageData() {
  return new Promise((resolve) => chrome.storage.local.get(null, resolve));
}

function isDateKey(key) {
  return /^\d{4}-\d{2}-\d{2}$/.test(key);
}

function normalizeEntry(raw) {
  if (!raw) return { count: 0, timestamps: [] };

  if (typeof raw === "number") {
    return { count: raw, timestamps: [] };
  }

  if (Array.isArray(raw)) {
    return { count: raw.length, timestamps: raw.slice() };
  }

  if (typeof raw === "object") {
    const count =
      typeof raw.count === "number"
        ? raw.count
        : Array.isArray(raw.timestamps)
        ? raw.timestamps.length
        : 0;
    const timestamps = Array.isArray(raw.timestamps)
      ? raw.timestamps.slice()
      : [];
    return { count, timestamps };
  }

  return { count: 0, timestamps: [] };
}

function toISODate(date) {
  return date.toISOString().split("T")[0];
}

/* ---------- Months header ---------- */

function initMonthsHeader() {
  const monthsLabel = document.getElementById("monthsLabel");
  if (!monthsLabel) return;

  const months = [
    { full: "January", short: "Jan" },
    { full: "February", short: "Feb" },
    { full: "March", short: "Mar" },
    { full: "April", short: "Apr" },
    { full: "May", short: "May" },
    { full: "June", short: "Jun" },
    { full: "July", short: "Jul" },
    { full: "August", short: "Aug" },
    { full: "September", short: "Sep" },
    { full: "October", short: "Oct" },
    { full: "November", short: "Nov" },
    { full: "December", short: "Dec" },
  ];

  monthsLabel.innerHTML = "";
  months.forEach((m) => {
    const span = document.createElement("span");
    span.textContent = m.short;
    span.title = m.full;
    monthsLabel.appendChild(span);
  });
}

/* ---------- Year select ---------- */

function buildYearOptions() {
  const years = new Set();
  const todayYear = new Date().getFullYear();
  years.add(todayYear);

  Object.keys(allData).forEach((key) => {
    if (!isDateKey(key)) return;
    const y = parseInt(key.split("-")[0], 10);
    if (!Number.isNaN(y)) years.add(y);
  });

  const sorted = Array.from(years).sort((a, b) => b - a);
  yearSelectEl.innerHTML = "";
  sorted.forEach((y) => {
    const opt = document.createElement("option");
    opt.value = String(y);
    opt.textContent = String(y);
    yearSelectEl.appendChild(opt);
  });

  if (!sorted.includes(currentYear)) {
    currentYear = sorted[0] || todayYear;
  }

  yearSelectEl.value = String(currentYear);
}

/* ---------- Calendar rendering ---------- */

function renderCalendar(year) {
  const grid = document.getElementById("heatmapGrid");
  if (!grid) return;
  grid.innerHTML = "";

  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  let totalCount = 0;
  let activeDays = 0;
  let maxCount = 0;
  const dailyCounts = {};
  const positiveCounts = [];

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = toISODate(d);
    const entry = normalizeEntry(allData[dateStr]);
    const count = entry.count || 0;

    dailyCounts[dateStr] = count;

    if (count > 0) {
      totalCount += count;
      activeDays++;
      if (count > maxCount) maxCount = count;
      positiveCounts.push(count);
    }
  }

  // Stats
  document.getElementById("yearTotal").textContent = totalCount;
  document.getElementById("activeDays").textContent = activeDays;
  document.getElementById("avgDaily").textContent = activeDays
    ? (totalCount / activeDays).toFixed(1)
    : "0";

  const streaks = computeStreaks(year, startDate, endDate, dailyCounts);
  document.getElementById("currentStreak").textContent = streaks.current;
  document.getElementById("longestStreak").textContent = streaks.longest;

  // Color scale based on percentiles (with log fallback)
  const colorScale = buildColorScale(positiveCounts, maxCount);

  // Empty cells to align first week (Mon-based)
  const firstDay = startDate.getDay(); // 0 Sun - 6 Sat
  const emptyCells = firstDay === 0 ? 6 : firstDay - 1;
  for (let i = 0; i < emptyCells; i++) {
    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.style.visibility = "hidden";
    cell.style.pointerEvents = "none";
    grid.appendChild(cell);
  }

  // Actual days
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = toISODate(d);
    const count = dailyCounts[dateStr] || 0;

    const cell = document.createElement("div");
    cell.className = "day-cell";
    cell.dataset.date = dateStr;
    cell.title = `${dateStr}: ${count} prompts`;
    cell.dataset.level = getColorLevel(count, colorScale);
    cell.addEventListener("click", () => handleDayClick(dateStr));
    grid.appendChild(cell);
  }

  renderTrendSection(year, startDate, endDate, dailyCounts);
}

/* ---------- Color scale ---------- */

function buildColorScale(counts, maxCount) {
  const positive = counts.filter((c) => c > 0);
  if (!positive.length) {
    return { type: "none", thresholds: null, max: 0 };
  }

  const sorted = positive.slice().sort((a, b) => a - b);

  const percentile = (p) => {
    const idx = (sorted.length - 1) * p;
    const lower = Math.floor(idx);
    const upper = Math.ceil(idx);
    if (lower === upper) return sorted[lower];
    const weight = idx - lower;
    return sorted[lower] + (sorted[upper] - sorted[lower]) * weight;
  };

  let thresholds = [
    Math.round(percentile(0.2)),
    Math.round(percentile(0.4)),
    Math.round(percentile(0.6)),
    Math.round(percentile(0.8)),
  ];

  // Ensure non-decreasing and at least 1
  let last = 1;
  thresholds = thresholds.map((t) => {
    if (!Number.isFinite(t) || t < last) {
      return last;
    }
    last = t;
    return t;
  });

  return {
    type: "percentile",
    thresholds,
    max: maxCount || sorted[sorted.length - 1] || 1,
  };
}

function getColorLevel(count, scale) {
  if (!scale || count === 0) return 0;

  if (scale.type === "percentile" && scale.thresholds) {
    const [p20, p40, p60, p80] = scale.thresholds;

    if (count <= p20) return 1;
    if (count <= p40) return 2;
    if (count <= p60) return 3;
    if (count <= p80) return 4;
    return 4;
  }

  if (!scale.max || scale.max <= 0) return 1;

  const normalized = Math.log(count + 1) / Math.log(scale.max + 1);
  if (normalized <= 0.25) return 1;
  if (normalized <= 0.5) return 2;
  if (normalized <= 0.75) return 3;
  return 4;
}

/* ---------- Streaks ---------- */

function computeStreaks(year, startDate, endDate, dailyCounts) {
  let longest = 0;
  let current = 0;
  let streak = 0;

  // Longest streak within the selected year
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = toISODate(d);
    const count = dailyCounts[dateStr] || 0;
    if (count > 0) {
      streak++;
      if (streak > longest) longest = streak;
    } else {
      streak = 0;
    }
  }

  // Current streak (GitHub-style: ending at today if same year, otherwise end of that year)
  const today = new Date();
  const todayYear = today.getFullYear();
  let endForCurrent;

  if (year === todayYear) {
    endForCurrent = new Date(
      today.getFullYear(),
      today.getMonth(),
      today.getDate()
    );
  } else {
    endForCurrent = new Date(year, 11, 31);
  }

  current = 0;
  for (
    let d = new Date(endForCurrent);
    d >= startDate;
    d.setDate(d.getDate() - 1)
  ) {
    if (year === todayYear && d > today) continue;

    const dateStr = toISODate(d);
    const count = dailyCounts[dateStr] || 0;

    if (count > 0) {
      current++;
    } else {
      if (year === todayYear && d.toDateString() === today.toDateString()) {
        // No usage today => streak is 0
        current = 0;
      }
      break;
    }
  }

  return { current, longest };
}

/* ---------- Trend charts & stats ---------- */

function renderTrendSection(year, startDate, endDate, dailyCounts) {
  const dailySeries = [];
  const weeklyTotals = new Map();
  const monthlyTotals = new Map();
  const weekdayTotals = new Array(7).fill(0); // 0 Sun - 6 Sat

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = toISODate(d);
    const count = dailyCounts[dateStr] || 0;

    dailySeries.push({ date: dateStr, count });

    const weekKey = getWeekStartISO(d);
    weeklyTotals.set(weekKey, (weeklyTotals.get(weekKey) || 0) + count);

    const monthKey = `${year}-${String(d.getMonth() + 1).padStart(2, "0")}`;
    monthlyTotals.set(monthKey, (monthlyTotals.get(monthKey) || 0) + count);

    weekdayTotals[d.getDay()] += count;
  }

  renderDailyChart(dailySeries);
  renderWeeklyStats(weeklyTotals);
  renderMonthlyStats(year, monthlyTotals);
  renderBusiestWeekday(weekdayTotals);
}

function getWeekStartISO(date) {
  const d = new Date(date);
  const day = d.getDay(); // 0 Sun - 6 Sat
  const diff = d.getDate() - day + (day === 0 ? -6 : 1); // Monday as first day
  d.setDate(diff);
  d.setHours(0, 0, 0, 0);
  return toISODate(d);
}

/* Daily line chart (simple canvas implementation, no external libs) */

function getCanvasContext(canvas) {
  const dpr = window.devicePixelRatio || 1;
  const rect = canvas.getBoundingClientRect();
  const width = rect.width || canvas.width || 600;
  const height = rect.height || canvas.height || 160;
  canvas.width = width * dpr;
  canvas.height = height * dpr;
  const ctx = canvas.getContext("2d");
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  return { ctx, width, height };
}

function renderDailyChart(dailySeries) {
  const canvas = document.getElementById("dailyChart");
  if (!canvas) return;

  const { ctx, width, height } = getCanvasContext(canvas);
  ctx.clearRect(0, 0, width, height);

  const margin = { top: 10, right: 10, bottom: 20, left: 30 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const styles = getComputedStyle(document.body);
  const axisColor = (styles.getPropertyValue("--muted-text-color") || "#656d76").trim();
  const lineColor = (styles.getPropertyValue("--accent-color") || "#10a37f").trim();
  const gridColor = (styles.getPropertyValue("--border-color") || "#d0d7de").trim();

  ctx.font =
    '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "right";
  ctx.textBaseline = "middle";

  ctx.strokeStyle = axisColor;
  ctx.fillStyle = axisColor;

  // Axes
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  if (!dailySeries.length) {
    ctx.fillText("No data", margin.left + 40, margin.top + 20);
    return;
  }

  const counts = dailySeries.map((d) => d.count);
  const maxCount = Math.max(...counts, 1);
  const yStep = Math.max(Math.ceil(maxCount / 4), 1);

  // Horizontal grid lines and labels
  for (let v = 0; v <= maxCount; v += yStep) {
    const ratio = v / maxCount;
    const y = margin.top + (1 - ratio) * plotHeight;

    ctx.strokeStyle = gridColor;
    ctx.beginPath();
    ctx.moveTo(margin.left, y);
    ctx.lineTo(width - margin.right, y);
    ctx.stroke();

    ctx.fillStyle = axisColor;
    ctx.fillText(String(v), margin.left - 4, y);
  }

  // Line
  const n = dailySeries.length;
  ctx.beginPath();
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1.5;

  dailySeries.forEach((point, idx) => {
    const x =
      margin.left +
      (n === 1 ? plotWidth / 2 : (idx / (n - 1 || 1)) * plotWidth);
    const y =
      margin.top + (1 - point.count / maxCount) * plotHeight;

    if (idx === 0) {
      ctx.moveTo(x, y);
    } else {
      ctx.lineTo(x, y);
    }
  });

  ctx.stroke();
}

/* Weekly / monthly / weekday stats */

function renderWeeklyStats(weeklyTotals) {
  const listEl = document.getElementById("weeklyTotals");
  const avgEl = document.getElementById("weeklyAverage");
  if (!listEl || !avgEl) return;

  const entries = Array.from(weeklyTotals.entries()).sort((a, b) =>
    a[0].localeCompare(b[0])
  );

  listEl.innerHTML = "";

  let sum = 0;
  let weeksWithUsage = 0;

  entries.forEach(([weekStart, total]) => {
    sum += total;
    if (total > 0) weeksWithUsage++;

    if (total === 0) return;

    const li = document.createElement("li");
    const label = document.createElement("span");
    label.textContent = weekStart;
    const value = document.createElement("span");
    value.textContent = total;
    li.appendChild(label);
    li.appendChild(value);
    listEl.appendChild(li);
  });

  if (!listEl.children.length) {
    const li = document.createElement("li");
    li.textContent = "No data";
    listEl.appendChild(li);
  }

  const avg =
    weeksWithUsage > 0 ? Math.round(sum / weeksWithUsage) : 0;
  avgEl.textContent = weeksWithUsage > 0 ? `${avg} / week` : "-";
}

function getMonthShortName(index) {
  const months = [
    "Jan",
    "Feb",
    "Mar",
    "Apr",
    "May",
    "Jun",
    "Jul",
    "Aug",
    "Sep",
    "Oct",
    "Nov",
    "Dec",
  ];
  return months[index] || "";
}

function renderMonthlyStats(year, monthlyTotals) {
  const listEl = document.getElementById("monthlyTotals");
  if (!listEl) return;

  const monthlyArr = [];
  for (let month = 0; month < 12; month++) {
    const key = `${year}-${String(month + 1).padStart(2, "0")}`;
    const total = monthlyTotals.get(key) || 0;
    monthlyArr.push({ key, total, month });
  }

  const maxMonthly = monthlyArr.reduce(
    (max, m) => (m.total > max ? m.total : max),
    0
  );

  listEl.innerHTML = "";

  monthlyArr.forEach((m) => {
    const li = document.createElement("li");

    const label = document.createElement("span");
    label.className = "month-label-text";
    label.textContent = `${getMonthShortName(m.month)} ${year}`;

    const bar = document.createElement("div");
    bar.className = "month-bar";

    const fill = document.createElement("div");
    fill.className = "month-bar-fill";
    const widthPercent =
      maxMonthly > 0 ? (m.total / maxMonthly) * 100 : 0;
    fill.style.width = `${widthPercent}%`;
    bar.appendChild(fill);

    const value = document.createElement("span");
    value.className = "month-value";
    value.textContent = m.total;

    li.appendChild(label);
    li.appendChild(bar);
    li.appendChild(value);

    listEl.appendChild(li);
  });
}

function renderBusiestWeekday(weekdayTotals) {
  const el = document.getElementById("busiestWeekday");
  if (!el) return;

  const max = Math.max(...weekdayTotals);
  if (!max) {
    el.textContent = "No data";
    return;
  }

  const names = [
    "Sun",
    "Mon",
    "Tue",
    "Wed",
    "Thu",
    "Fri",
    "Sat",
  ];

  const indices = [];
  weekdayTotals.forEach((val, idx) => {
    if (val === max) indices.push(idx);
  });

  const label = indices.map((i) => names[i]).join(", ");
  el.textContent = `${label} (${max} total)`;
}

/* ---------- Day detail modal ---------- */

function initModal() {
  const overlay = document.getElementById("dayDetailOverlay");
  const closeBtn = document.getElementById("modalCloseBtn");
  if (!overlay || !closeBtn) return;

  closeBtn.addEventListener("click", hideModal);

  overlay.addEventListener("click", (e) => {
    if (e.target === overlay) hideModal();
  });

  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") hideModal();
  });
}

function handleDayClick(dateStr) {
  const entry = normalizeEntry(allData[dateStr]);
  showModalForDay(dateStr, entry);
}

function showModalForDay(dateStr, entry) {
  const overlay = document.getElementById("dayDetailOverlay");
  if (!overlay) return;

  const titleEl = document.getElementById("modalDateTitle");
  const countEl = document.getElementById("modalCountText");
  const summaryEl = document.getElementById("modalTimesSummary");

  const count = entry.count || 0;
  const timestamps = Array.isArray(entry.timestamps)
    ? entry.timestamps
    : [];

  if (titleEl) titleEl.textContent = formatDateHuman(dateStr);
  if (countEl) countEl.textContent = `${count} prompts on this day`;

  let bins = [0, 0, 0, 0];
  if (timestamps.length) {
    bins = summarizeTimeBuckets(timestamps);
  }

  if (summaryEl) {
    if (!count) {
      summaryEl.textContent = "No usage recorded for this date.";
    } else if (!timestamps.length) {
      summaryEl.textContent =
        "Only total count is available for this older data (no time-of-day breakdown).";
    } else {
      const labels = ["Night", "Morning", "Afternoon", "Evening"];
      const maxVal = Math.max(...bins);
      if (maxVal === 0) {
        summaryEl.textContent = "Usage was evenly spread across the day.";
      } else {
        const topIndices = bins
          .map((v, i) => (v === maxVal ? i : -1))
          .filter((i) => i !== -1);
        const topLabels = topIndices.map((i) => labels[i]);
        summaryEl.textContent = `Peak usage: ${topLabels.join(", ")}.`;
      }
    }
  }

  renderDayTimeChart(bins);
  overlay.classList.remove("hidden");
}

function hideModal() {
  const overlay = document.getElementById("dayDetailOverlay");
  if (overlay) overlay.classList.add("hidden");
}

function summarizeTimeBuckets(timestamps) {
  const buckets = [0, 0, 0, 0]; // Night, Morning, Afternoon, Evening
  timestamps.forEach((ts) => {
    const d = new Date(ts);
    const h = d.getHours();
    if (Number.isNaN(h)) return;
    if (h < 6) buckets[0]++;
    else if (h < 12) buckets[1]++;
    else if (h < 18) buckets[2]++;
    else buckets[3]++;
  });
  return buckets;
}

function renderDayTimeChart(bins) {
  const canvas = document.getElementById("dayTimeChart");
  if (!canvas) return;

  const { ctx, width, height } = getCanvasContext(canvas);
  ctx.clearRect(0, 0, width, height);

  const margin = { top: 10, right: 10, bottom: 26, left: 30 };
  const plotWidth = width - margin.left - margin.right;
  const plotHeight = height - margin.top - margin.bottom;

  const styles = getComputedStyle(document.body);
  const axisColor = (styles.getPropertyValue("--muted-text-color") || "#656d76").trim();
  const barColor = (styles.getPropertyValue("--accent-color") || "#10a37f").trim();

  const labels = ["Night", "Morning", "Afternoon", "Evening"];
  const maxVal = Math.max(...bins, 1);
  const barCount = bins.length;
  const slotWidth = plotWidth / barCount;
  const barWidth = slotWidth * 0.6;

  ctx.font =
    '10px -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif';
  ctx.textAlign = "center";
  ctx.textBaseline = "top";

  // Axes
  ctx.strokeStyle = axisColor;
  ctx.beginPath();
  ctx.moveTo(margin.left, margin.top);
  ctx.lineTo(margin.left, height - margin.bottom);
  ctx.lineTo(width - margin.right, height - margin.bottom);
  ctx.stroke();

  for (let i = 0; i < barCount; i++) {
    const value = bins[i];
    const xCenter = margin.left + slotWidth * i + slotWidth / 2;
    const barHeight =
      maxVal > 0 ? (value / maxVal) * (plotHeight - 4) : 0;
    const x = xCenter - barWidth / 2;
    const y = height - margin.bottom - barHeight;

    ctx.fillStyle = barColor;
    ctx.fillRect(x, y, barWidth, barHeight);

    ctx.fillStyle = axisColor;
    ctx.fillText(labels[i], xCenter, height - margin.bottom + 4);
  }
}

function formatDateHuman(dateStr) {
  const d = new Date(`${dateStr}T00:00:00`);
  if (Number.isNaN(d.getTime())) return dateStr;

  const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
  const day = d.getDate();
  const month = d.getMonth() + 1;
  const year = d.getFullYear();
  const weekday = weekdays[d.getDay()];

  return `${year}-${String(month).padStart(2, "0")}-${String(day).padStart(
    2,
    "0"
  )} (${weekday})`;
}

/* ---------- Theme + import/export ---------- */

function initThemeToggle() {
  const btn = document.getElementById("themeToggle");
  if (!btn) return;

  const prefersDark =
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)").matches;
  const stored = localStorage.getItem("gptTrackerTheme");
  const effective = stored || (prefersDark ? "dark" : "light");

  applyTheme(effective);

  btn.addEventListener("click", () => {
    const isDark = !document.body.classList.contains("dark");
    applyTheme(isDark ? "dark" : "light");
  });
}

function applyTheme(theme) {
  const btn = document.getElementById("themeToggle");
  if (theme === "dark") {
    document.body.classList.add("dark");
  } else {
    document.body.classList.remove("dark");
    theme = "light";
  }
  localStorage.setItem("gptTrackerTheme", theme);

  if (btn) {
    if (theme === "dark") {
      btn.textContent = "☀️";
      btn.title = "Switch to light mode";
    } else {
      btn.textContent = "🌙";
      btn.title = "Switch to dark mode";
    }
  }
}

function initExportImport() {
  const exportBtn = document.getElementById("exportData");
  const importBtn = document.getElementById("importData");
  const fileInput = document.getElementById("importFileInput");

  if (exportBtn) {
    exportBtn.addEventListener("click", () => {
      chrome.storage.local.get(null, (data) => {
        const payload = {
          meta: {
            exportedAt: new Date().toISOString(),
            version: 2,
          },
          data,
        };

        const blob = new Blob([JSON.stringify(payload, null, 2)], {
          type: "application/json",
        });
        const url = URL.createObjectURL(blob);
        const a = document.createElement("a");
        const stamp = new Date()
          .toISOString()
          .replace(/[:.]/g, "-");
        a.href = url;
        a.download = `gpt-tracker-data-${stamp}.json`;
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
      });
    });
  }

  if (importBtn && fileInput) {
    importBtn.addEventListener("click", () => fileInput.click());

    fileInput.addEventListener("change", (event) => {
      const file = event.target.files && event.target.files[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          const json = JSON.parse(e.target.result);
          const data =
            json && json.data && typeof json.data === "object"
              ? json.data
              : json;

          chrome.storage.local.set(data, () => {
            allData = data;
            buildYearOptions();
            renderCalendar(currentYear);
            alert("Import completed.");
          });
        } catch (err) {
          console.error("Failed to import data", err);
          alert("Invalid file format.");
        } finally {
          fileInput.value = "";
        }
      };
      reader.readAsText(file);
    });
  }
}
