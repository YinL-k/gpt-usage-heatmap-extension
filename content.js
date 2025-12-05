// content.js
(() => {
  let lastEnterTime = 0;

  document.body.addEventListener('keydown', (e) => {
    // 目标必须是 textarea (输入框) 或 contenteditable 元素
    const target = e.target;
    const isInput = target.tagName === 'TEXTAREA' || target.getAttribute('contenteditable') === 'true';

    if (!isInput) return;

    // 监听 Enter (keyCode 13)，排除 Shift (换行) 和 IME 输入法合成过程 (isComposing)
    if (e.key === 'Enter' && !e.shiftKey && !e.isComposing) {
      
      // 简单的防抖：防止按住不放触发多次，或极短时间内双击
      const now = Date.now();
      if (now - lastEnterTime < 500) return; 
      lastEnterTime = now;

      // 如果输入框为空（只有空白字符），通常不发送，不计数
      if (!target.value && !target.innerText.trim()) return;

      recordUsage();
    }
  }, true); // 使用捕获模式，确保优先处理

  function recordUsage() {
    const today = new Date().toISOString().split('T')[0]; // 格式: YYYY-MM-DD

    chrome.storage.local.get([today], (result) => {
      const currentCount = result[today] || 0;
      const newCount = currentCount + 1;
      
      chrome.storage.local.set({ [today]: newCount }, () => {
        console.log(`[GPT Tracker] +1! Today (${today}): ${newCount}`);
      });
    });
  }
})();