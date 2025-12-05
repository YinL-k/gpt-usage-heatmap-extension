document.addEventListener('DOMContentLoaded', () => {
  updateStats();
  document.getElementById('openHeatmap').addEventListener('click', () => {
    chrome.tabs.create({ url: 'heatmap.html' });
  });
});

function updateStats() {
  chrome.storage.local.get(null, (items) => {
    const todayStr = new Date().toISOString().split('T')[0];
    const now = new Date();

    let todayCount = 0;
    let weekCount = 0;
    let monthCount = 0;
    let totalCount = 0;

    for (const [dateStr, count] of Object.entries(items)) {
      if (!dateStr.match(/^\d{4}-\d{2}-\d{2}$/)) continue; // 简单的格式校验

      const val = parseInt(count) || 0;
      totalCount += val;

      const d = new Date(dateStr);

      // Is Today
      if (dateStr === todayStr) todayCount = val;

      // Is This Month
      if (d.getFullYear() === now.getFullYear() && d.getMonth() === now.getMonth()) {
        monthCount += val;
      }

      // Is This Week (ISO Week)
      if (isSameWeek(d, now)) {
        weekCount += val;
      }
    }

    document.getElementById('today').textContent = todayCount;
    document.getElementById('week').textContent = weekCount;
    document.getElementById('month').textContent = monthCount;
    document.getElementById('total').textContent = totalCount;
  });
}

// 辅助：判断两个日期是否在同一周（周一为第一天）
function isSameWeek(d1, d2) {
  const getWeekStart = (date) => {
    const d = new Date(date);
    const day = d.getDay();
    const diff = d.getDate() - day + (day === 0 ? -6 : 1); // adjust when day is sunday
    return new Date(d.setDate(diff)).setHours(0, 0, 0, 0);
  };
  return getWeekStart(d1) === getWeekStart(d2);
}