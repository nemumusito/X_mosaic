(() => {
  "use strict";

  const ENABLED_STORAGE_KEY = "xmosaicEnabled";

  function setBadge(enabled) {
    chrome.action.setBadgeText({ text: enabled ? "ON" : "OFF" });
    chrome.action.setBadgeBackgroundColor({
      color: enabled ? "#16a34a" : "#64748b"
    });
    chrome.action.setTitle({
      title: enabled ? "X Mosaic Mask: ON (click to toggle)" : "X Mosaic Mask: OFF (click to toggle)"
    });
  }

  function getEnabled(callback) {
    chrome.storage.local.get({ [ENABLED_STORAGE_KEY]: true }, (items) => {
      const enabled = Boolean(items[ENABLED_STORAGE_KEY]);
      callback(enabled);
    });
  }

  function setEnabled(enabled) {
    chrome.storage.local.set({ [ENABLED_STORAGE_KEY]: enabled }, () => {
      setBadge(enabled);
    });
  }

  function syncBadge() {
    getEnabled((enabled) => {
      setBadge(enabled);
    });
  }

  chrome.runtime.onInstalled.addListener(() => {
    syncBadge();
  });

  chrome.runtime.onStartup.addListener(() => {
    syncBadge();
  });

  chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName !== "local") return;
    if (!(ENABLED_STORAGE_KEY in changes)) return;
    setBadge(Boolean(changes[ENABLED_STORAGE_KEY].newValue));
  });

  chrome.action.onClicked.addListener(() => {
    getEnabled((enabled) => {
      setEnabled(!enabled);
    });
  });

  syncBadge();
})();
