
(() => {
  let lastEnterTime = 0;

  document.body.addEventListener(
    "keydown",
    (e) => {
      const target = e.target;
      const isInput =
        target.tagName === "TEXTAREA" ||
        target.getAttribute("contenteditable") === "true";

      if (!isInput) return;

      if (e.key === "Enter" && !e.shiftKey && !e.isComposing) {
        const now = Date.now();

        if (now - lastEnterTime < 500) return;
        lastEnterTime = now;

        const value =
          typeof target.value === "string" ? target.value : target.innerText;
        if (!value || !value.trim()) return;

        recordUsage(now);
      }
    },
    true
  );

  function recordUsage(timestamp) {
    const today = new Date().toISOString().split("T")[0];

    chrome.storage.local.get([today], (result) => {
      const existing = result[today];
      const normalized = normalizeEntry(existing);

      const newEntry = {
        count: normalized.count + 1,
        timestamps: [...normalized.timestamps, timestamp],
      };

      chrome.storage.local.set({ [today]: newEntry }, () => {
        console.log(
          `[GPT Tracker] +1! Today (${today}): ${newEntry.count} (with timestamps)`
        );
      });
    });
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
})();
