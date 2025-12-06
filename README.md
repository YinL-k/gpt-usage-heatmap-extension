# GPT Tracker – 使用热力图  
监控你到底有多离不开 ChatGPT 的 Chrome 扩展

我发现自己太爱 ChatGPT 了，于是写了这个 Chrome Extension 来监控一下我自己到底多依赖它。  
它会记录你每天按下 Enter 发送 Prompt 的次数，然后用 GitHub 风格的热力图展示出来，再顺便给你算算今日 / 本周 / 本月用了多少次。

如果你也好奇自己是不是已经离不开 ChatGPT，这个扩展能很大程度上满足你的好奇心！

---

## 功能特色

### 🔥 GitHub 风格热力图  
直观展示你全年每天使用 ChatGPT 的频率。  
相关文件：  
- heatmap.html  
- heatmap.js  
- style.css  

### 📊 今日 / 本周 / 本月 / 总计统计  
打开扩展弹窗即可看到你的使用频率总结。  
相关文件：  
- popup.html  
- popup.js  

### 🧩 自动记录，不打扰你  
扩展会监听你在 ChatGPT 页面按下 Enter 的行为，并将当天的 Prompt 次数记录下来。  
相关文件：  
- content.js  

### 🔒 数据只存本地  
所有统计数据都存储在 chrome.storage.local 中。  
不上传、不联网，放心使用。

---

## 安装方式

1. 下载整个项目文件夹。  
2. 打开 Chrome，访问：  
   ```
   chrome://extensions/
   ```
3. 启用右上角 开发者模式（Developer mode）。  
4. 点击 加载已解压的扩展程序（Load unpacked）。  
5. 选择本项目文件夹即可完成安装。

---

## 项目结构

```
manifest.json     // 扩展配置文件
icon.png          // 扩展图标
content.js        // 监听 Enter 并记录每日使用次数
popup.html        // 展示今日/本周/本月统计
popup.js          // 统计逻辑
heatmap.html      // 热力图展示页面
heatmap.js        // 生成热力图
style.css         // 样式文件
```

---

## 为什么做这个项目？

单纯自己到底有多依赖AI哈哈哈 
我只是想看看自己一天到底敲了多少次 Enter 来找 ChatGPT 喵喵天。  

做完之后发现……我可能确实有点依赖它？

---

## License

MIT License.
