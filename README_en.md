[English](README_en.md) | [中文](README.md)

# GPT Tracker – Usage Heatmap  
A Chrome extension to monitor just how dependent you are on ChatGPT.

I realized I'm way too into ChatGPT, so I built this Chrome extension to keep an eye on just how hooked I am.  
It logs how many times you hit **Enter** to send a prompt each day, then shows your streak in a GitHub‑style contribution graph.  
It also totals up your prompts for **today**, **this week** and **this month**.

If you're also curious whether you can live without ChatGPT, this extension will go a long way toward satisfying that curiosity!

---

## Features

### 🔥 GitHub‑Style Heatmap  
Shows at a glance how often you talk to ChatGPT every day of the year.  
Related files:  
‑ heatmap.html  
‑ heatmap.js  
‑ style.css  

### 📊 Today's / This Week's / This Month's / Overall Stats  
Open the popup and you'll see a summary of your prompt habits.  
Related files:  
‑ popup.html  
‑ popup.js  

### 🧩 Hands‑Off Tracking  
The extension listens for **Enter** key presses on the ChatGPT page and logs the number of prompts for the day.  
Related files:  
‑ content.js  

### 🔒 Data Stays Local  
All stats are stored in `chrome.storage.local`.  
Nothing is uploaded or synced, so you can use it worry‑free.

---

## Installation

1. Download the entire project folder.  
2. Open Chrome and navigate to:  
   ```
   chrome://extensions/
   ```
3. In the top right, enable **Developer mode**.  
4. Click **Load unpacked**.  
5. Select this project folder. Done!

---

## Project Structure

```
manifest.json     // Extension configuration
icon.png          // Extension icon
content.js        // Monitors Enter and logs daily usage
popup.html        // Popup showing today/week/month stats
popup.js          // Counting logic
heatmap.html      // Heatmap display page
heatmap.js        // Generates heatmap
style.css         // Stylesheet
```

---

## Why build this?

Honestly? I just wanted to know how dependent I am on AI, haha.  
I was curious how many times a day I mash **Enter** to talk to ChatGPT.

Now that it's built… it turns out I'm probably a bit hooked.

---

## License

MIT License.