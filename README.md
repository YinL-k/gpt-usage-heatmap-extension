# GPT Tracker – Usage Heatmap

**English**

This repository contains a Chrome extension that records how often you send prompts to ChatGPT and visualises that activity with a GitHub‑style contribution graph.

### Features

- **Daily prompt tracking:** A content script listens for `Enter` key presses on ChatGPT and increments a counter for the current day. Counts are stored in Chrome’s local storage so they persist across sessions.
- **Summary popup:** Clicking the extension’s icon shows a popup with today’s count, as well as totals for the current week, month and overall.
- **Interactive heatmap:** A dedicated page (`heatmap.html`) renders a contribution graph similar to GitHub’s activity overview. It shows your usage for each day of the selected year and displays aggregate statistics such as the total prompts, number of active days and average prompts per active day.
- **Simple installation:** Load the unpacked extension in Chrome to start tracking your ChatGPT usage immediately. No external services are required.

### Installation

1. Clone or download this repository.
2. Open `chrome://extensions` in Chrome and enable **Developer mode**.
3. Click **Load unpacked** and select the directory containing these files.
4. Visit ChatGPT and use it as normal. Click the extension’s icon to view your usage stats or open the full heatmap.

### Files

| File | Purpose |
| --- | --- |
| `manifest.json` | Defines the extension and declares the content script and popup. |
| `content.js` | Listens for prompt submissions on ChatGPT and records usage counts in local storage. |
| `popup.html` / `popup.js` | Presents a small popup summarising today’s, weekly, monthly and total usage and provides a button to open the heatmap page. |
| `heatmap.html` / `heatmap.js` | Renders the GitHub‑style contribution graph and calculates yearly totals, active days and averages. |
| `style.css` | Styles the heatmap and layout. |
| `icon.png` | Icon displayed in the Chrome toolbar. |

---

**中文**

该仓库包含一个 Chrome 浏览器扩展，用于统计你在 ChatGPT 上提交 prompt 的次数，并以 GitHub 风格的贡献图展示活跃度。

### 功能

- **每日计数：** 内容脚本会监听在 ChatGPT 上按下 `Enter` 键的事件，为当天计数加一。计数会保存在浏览器本地存储中，刷新或重启浏览器不会丢失。
- **数据概览弹窗：** 点击扩展图标会弹出一个窗口，显示今天、本周、本月以及历史总共的使用次数，并提供打开热力图页面的按钮。
- **交互式热力图：** 独立的 `heatmap.html` 页面以类似 GitHub 贡献图的方式展示每天的使用情况，并统计当年总次数、活跃天数以及活跃日平均次数。
- **安装简单：** 加载已解压的扩展即可使用，无需配置或依赖外部服务。

### 安装步骤

1. 克隆或下载本仓库。
2. 在 Chrome 浏览器地址栏输入 `chrome://extensions` 并打开扩展管理页面，开启开发者模式。
3. 点击 **“加载已解压的扩展”**，选择包含这些文件的目录。
4. 前往 ChatGPT 并正常使用。点击工具栏中的扩展图标查看使用统计，或打开完整的热力图页面。

### 文件说明

| 文件 | 功能说明 |
| --- | --- |
| `manifest.json` | 定义扩展的信息并声明内容脚本和弹窗。 |
| `content.js` | 监听在 ChatGPT 页面提交 prompt 的行为，将每日使用次数存储在本地。 |
| `popup.html` / `popup.js` | 小弹窗，展示今天、本周、本月和总使用次数，并提供打开热力图的按钮。 |
| `heatmap.html` / `heatmap.js` | 渲染类似 GitHub 贡献图的热力图，计算年度总数、活跃天数和平均值。 |
| `style.css` | 样式文件，用于美化热力图和页面布局。 |
| `icon.png` | 扩展在浏览器工具栏显示的图标。 |

### 许可

本项目暂未选择特定的开源许可证。你可以根据需要自行修改和使用代码，但在发布或分发时请注明来源。
