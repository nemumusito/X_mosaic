(() => {
  "use strict";

  const BLUR_CLASS = "xmosaic-blur";
  const ENABLED_STORAGE_KEY = "xmosaicEnabled";
  const ACCOUNT_BUTTON_SELECTOR = 'button[data-testid="SideNav_AccountSwitcher_Button"]';
  const AVATAR_TESTID_PREFIX = "UserAvatar-Container-";
  const OWN_ACCOUNT_TARGET_SELECTORS = [
    ':scope [data-testid^="UserAvatar-Container-"]',
    ':scope img[src*="/profile_images/"]',
    ':scope div[dir="ltr"]',
    ':scope span'
  ];

  let isEnabled = true;
  let ownHandle = null;

  function toHandle(raw) {
    if (typeof raw !== "string") return null;
    const normalized = raw.replace(/^@/, "").trim().toLowerCase();
    if (!/^[a-z0-9_]{1,15}$/.test(normalized)) return null;
    return normalized;
  }

  function extractHandleFromText(text) {
    if (typeof text !== "string") return null;
    const match = text.match(/@([A-Za-z0-9_]{1,15})/);
    return match ? toHandle(match[1]) : null;
  }

  function extractHandleFromAvatarTestId(testId) {
    if (typeof testId !== "string") return null;
    if (!testId.startsWith(AVATAR_TESTID_PREFIX)) return null;
    return toHandle(testId.slice(AVATAR_TESTID_PREFIX.length));
  }

  function setOwnHandle(nextHandle) {
    const normalized = toHandle(nextHandle);
    if (!normalized || normalized === ownHandle) return;
    ownHandle = normalized;
    if (isEnabled) {
      processNode(document.documentElement);
    }
  }

  function detectOwnHandle() {
    if (ownHandle) return;
    const button = document.querySelector(ACCOUNT_BUTTON_SELECTOR);
    if (!(button instanceof HTMLElement)) return;

    const avatarInButton = button.querySelector('[data-testid^="UserAvatar-Container-"]');
    if (avatarInButton instanceof HTMLElement) {
      const handleFromAvatar = extractHandleFromAvatarTestId(avatarInButton.dataset.testid);
      if (handleFromAvatar) {
        setOwnHandle(handleFromAvatar);
        return;
      }
    }

    const handleFromText = extractHandleFromText(button.textContent || "");
    if (handleFromText) {
      setOwnHandle(handleFromText);
    }
  }

  function blur(element) {
    if (!(element instanceof HTMLElement)) return;
    element.classList.add(BLUR_CLASS);
  }

  function clearAllBlur() {
    document.querySelectorAll(`.${BLUR_CLASS}`).forEach((element) => {
      element.classList.remove(BLUR_CLASS);
    });
  }

  function blurOwnAccountButton(button) {
    if (!(button instanceof HTMLElement)) return;
    const mainArea = button.querySelector(":scope > div:first-child");
    if (mainArea instanceof HTMLElement) {
      blur(mainArea);
    } else {
      blur(button);
    }

    for (const selector of OWN_ACCOUNT_TARGET_SELECTORS) {
      button.querySelectorAll(selector).forEach(blur);
    }
  }

  function blurOwnTweetAvatars(root) {
    if (!ownHandle) return;
    const ownAvatarSelector = `[data-testid="${AVATAR_TESTID_PREFIX}${ownHandle}"]`;
    if (root.matches?.(ownAvatarSelector)) {
      blur(root);
    }
    root.querySelectorAll?.(ownAvatarSelector).forEach(blur);
  }

  function processNode(node) {
    if (!isEnabled) return;
    if (!(node instanceof Element)) return;

    detectOwnHandle();

    if (node.matches?.(ACCOUNT_BUTTON_SELECTOR)) {
      blurOwnAccountButton(node);
    }

    node.querySelectorAll?.(ACCOUNT_BUTTON_SELECTOR).forEach(blurOwnAccountButton);
    blurOwnTweetAvatars(node);
  }

  function setEnabled(nextEnabled) {
    isEnabled = Boolean(nextEnabled);
    clearAllBlur();
    if (isEnabled) {
      processNode(document.documentElement);
    }
  }

  function watchStorageChanges() {
    chrome.storage.onChanged.addListener((changes, areaName) => {
      if (areaName !== "local") return;
      if (!(ENABLED_STORAGE_KEY in changes)) return;
      setEnabled(changes[ENABLED_STORAGE_KEY].newValue);
    });
  }

  function loadInitialState() {
    chrome.storage.local.get({ [ENABLED_STORAGE_KEY]: true }, (items) => {
      if (chrome.runtime.lastError) {
        setEnabled(true);
        return;
      }
      setEnabled(items[ENABLED_STORAGE_KEY]);
    });
  }

  function init() {
    watchStorageChanges();
    loadInitialState();

    const observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;
      for (const mutation of mutations) {
        for (const addedNode of mutation.addedNodes) {
          processNode(addedNode);
        }
      }
    });

    observer.observe(document.documentElement, {
      childList: true,
      subtree: true
    });
  }

  init();
})();
