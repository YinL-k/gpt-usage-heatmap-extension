
document.addEventListener("DOMContentLoaded", () => {
  updateStats();
  document.getElementById("openHeatmap").addEventListener("click", () => {
    chrome.tabs.create({ url: "heatmap.html" });
  });
});

function updateStats() {
  chrome.storage.local.get(null, (items) => {
    const todayStr = new Date().toISOString().split("T")[0];
    const now = new Date();

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let totalCount = 0;

    for (const [dateStr, raw] of Object.entries(items)) {
      if (!isDateKey(dateStr)) continue;

      const { count } = normalizeEntry(raw);
      const val = typeof count === "number" && Number.isFinite(count) ? count : 0;

      totalCount += val;

      const d = new Date(dateStr);

      if (dateStr === todayStr) todayCount = val;

      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        monthCount += val;
      }

      if (isSameWeek(d, now)) {
        weekCount += val;
      }
    }

    document.getElementById("today").textContent = todayCount;
    document.getElementById("week").textContent = weekCount;
    document.getElementById("month").textContent = monthCount;
    document.getElementById("total").textContent = totalCount;
  });
}

function isDateKey(dateStr) {
  return /^\d{4}-\d{2}-\d{2}$/.test(dateStr);
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

// 辅助：判断两个日期是否在同一周（周一为第一天）
function isSameWeek(d1, d2) {
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    const monday = new Date(d.setDate(diff));
    monday.setHours(0, 0, 0, 0);
    return monday.getTime();
  };
  return getWeekStart(d1) === getWeekStart(d2);
}
