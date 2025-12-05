document.addEventListener('DOMContentLoaded', async () => {
  const yearSelect = document.getElementById('yearSelect');
  const allData = await getStorageData();

  // 1. 初始化年份下拉框
  const currentYear = new Date().getFullYear();
  const years = new Set([currentYear]);
  Object.keys(allData).forEach(k => years.add(parseInt(k.split('-')[0])));

  [...years].sort((a, b) => b - a).forEach(y => {
    const opt = document.createElement('option');
    opt.value = y;
    opt.textContent = y;
    yearSelect.appendChild(opt);
  });

  // 2. 渲染初始图表
  renderCalendar(currentYear, allData);

  // 3. 监听切换
  yearSelect.addEventListener('change', (e) => {
    renderCalendar(parseInt(e.target.value), allData);
  });
});

function getStorageData() {
  return new Promise(resolve => chrome.storage.local.get(null, resolve));
}

function renderCalendar(year, data) {
  const grid = document.getElementById('heatmapGrid');
  grid.innerHTML = '';

  // 生成该年的所有日期
  const startDate = new Date(year, 0, 1);
  const endDate = new Date(year, 11, 31);

  // 计算统计数据
  let maxCount = 0;
  let totalCount = 0;
  let activeDays = 0;
  const dailyCounts = {};

  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const count = data[dateStr] || 0;
    dailyCounts[dateStr] = count;

    if (count > 0) {
      if (count > maxCount) maxCount = count;
      totalCount += count;
      activeDays++;
    }
  }

  // 更新顶部数据栏
  document.getElementById('yearTotal').textContent = totalCount;
  document.getElementById('activeDays').textContent = activeDays;
  document.getElementById('avgDaily').textContent = activeDays ? (totalCount / activeDays).toFixed(1) : 0;

  // 填充网格
  // 需要先补齐年初的空位 (如果1月1日不是周日，GitHub风格通常周日或周一开头，这里我们用周一开头匹配ISO)
  // 0=Sun, 1=Mon... 
  let startDay = startDate.getDay();
  // 调整为 0=Mon, 6=Sun
  let emptyCells = startDay === 0 ? 6 : startDay - 1;

  // 添加前面的空白格
  for (let i = 0; i < emptyCells; i++) {
    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.style.visibility = 'hidden';
    grid.appendChild(cell);
  }

  // 添加每一天
  for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
    const dateStr = d.toISOString().split('T')[0];
    const count = dailyCounts[dateStr];

    const cell = document.createElement('div');
    cell.className = 'day-cell';
    cell.title = `${dateStr}: ${count} prompts`;

    // 计算颜色等级 (0-4)
    cell.dataset.level = getColorLevel(count, maxCount);
    grid.appendChild(cell);
  }
}

function getColorLevel(count, max) {
  if (count === 0) return 0;
  if (max === 0) return 0;

  // 简单的分位数映射，防止极值影响太大，这里简化为线性分段
  // 也可以用对数 log 使得低频也可见
  const ratio = count / max;
  if (ratio <= 0.25) return 1;
  if (ratio <= 0.50) return 2;
  if (ratio <= 0.75) return 3;
  return 4;
}