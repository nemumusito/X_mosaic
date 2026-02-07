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
  let scanScheduled = false;
  let lastSeenUrl = location.href;

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

  function blurOwnUserNameBlocks(root) {
    if (!ownHandle) return;
    const userNameSelector = '[data-testid="UserName"]';
    const ownMarker = `@${ownHandle}`;

    const tryBlurIfOwn = (element) => {
      if (!(element instanceof HTMLElement)) return;
      const text = (element.textContent || "").toLowerCase();
      if (!text.includes(ownMarker)) return;
      blur(element);
      element.querySelectorAll("div[dir=\"ltr\"], span").forEach(blur);
    };

    if (root.matches?.(userNameSelector)) {
      tryBlurIfOwn(root);
    }
    root.querySelectorAll?.(userNameSelector).forEach(tryBlurIfOwn);
  }

  function hasOwnHandleLink(container) {
    if (!ownHandle) return false;
    if (!(container instanceof Element)) return false;

    const ownPath = `/${ownHandle}`;
    return Array.from(container.querySelectorAll("a[href]")).some((anchor) => {
      if (!(anchor instanceof HTMLAnchorElement)) return false;
      try {
        const url = new URL(anchor.href, location.origin);
        return url.pathname === ownPath || url.pathname.startsWith(`${ownPath}/`);
      } catch (_error) {
        return false;
      }
    });
  }

  function blurOwnUserNameLegacyBlocks(root) {
    if (!ownHandle) return;
    const legacySelector = '[data-testid="User-Name"]';
    const ownMarker = `@${ownHandle}`;

    const tryBlurIfOwn = (element) => {
      if (!(element instanceof HTMLElement)) return;
      const text = (element.textContent || "").toLowerCase();
      if (!text.includes(ownMarker) && !hasOwnHandleLink(element)) return;
      blur(element);
      element.querySelectorAll("div[dir=\"ltr\"], span, a").forEach(blur);
    };

    if (root.matches?.(legacySelector)) {
      tryBlurIfOwn(root);
    }
    root.querySelectorAll?.(legacySelector).forEach(tryBlurIfOwn);
  }

  function isOnOwnProfilePage() {
    if (!ownHandle) return false;
    const profilePath = `/${ownHandle}`;
    return (
      location.pathname === profilePath ||
      location.pathname.startsWith(`${profilePath}/`)
    );
  }

  function isOwnProfileContext() {
    if (isOnOwnProfilePage()) return true;
    // Own profile usually has the edit profile button.
    if (document.querySelector('[data-testid="editProfileButton"]')) return true;
    return false;
  }

  function blurOwnProfileBannerImages(root) {
    if (!isOwnProfileContext()) return;
    const bannerSelectors = [
      'img[src*="/profile_banners/"]',
      '[style*="/profile_banners/"]'
    ];

    for (const selector of bannerSelectors) {
      if (root.matches?.(selector)) {
        blur(root);
      }
      root.querySelectorAll?.(selector).forEach(blur);
    }
  }

  function blurOwnProfileTitle() {
    if (!isOwnProfileContext()) return;
    const primaryColumn = document.querySelector('[data-testid="primaryColumn"]');
    if (!(primaryColumn instanceof HTMLElement)) return;

    const title = primaryColumn.querySelector('h2[role="heading"][aria-level="2"]');
    if (!(title instanceof HTMLElement)) return;

    blur(title);
    title.querySelectorAll("span, img").forEach(blur);
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
    blurOwnUserNameBlocks(node);
    blurOwnUserNameLegacyBlocks(node);
    blurOwnProfileBannerImages(node);
    blurOwnProfileTitle();
  }

  function runFullScan() {
    if (!isEnabled) return;
    processNode(document.documentElement);
  }

  function scheduleFullScan() {
    if (scanScheduled) return;
    scanScheduled = true;
    setTimeout(() => {
      scanScheduled = false;
      runFullScan();
    }, 120);
  }

  function onPotentialUiChange() {
    if (!isEnabled) return;
    if (location.href !== lastSeenUrl) {
      lastSeenUrl = location.href;
    }
    scheduleFullScan();
  }

  function installNavigationHooks() {
    const originalPushState = history.pushState;
    const originalReplaceState = history.replaceState;

    history.pushState = function patchedPushState(...args) {
      const result = originalPushState.apply(this, args);
      onPotentialUiChange();
      return result;
    };

    history.replaceState = function patchedReplaceState(...args) {
      const result = originalReplaceState.apply(this, args);
      onPotentialUiChange();
      return result;
    };

    window.addEventListener("popstate", onPotentialUiChange, true);
    window.addEventListener("hashchange", onPotentialUiChange, true);
  }

  function setEnabled(nextEnabled) {
    isEnabled = Boolean(nextEnabled);
    clearAllBlur();
    if (isEnabled) {
      runFullScan();
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
    installNavigationHooks();
    watchStorageChanges();
    loadInitialState();

    document.addEventListener("click", onPotentialUiChange, true);
    document.addEventListener("pointerup", onPotentialUiChange, true);
    document.addEventListener("keydown", onPotentialUiChange, true);

    const observer = new MutationObserver((mutations) => {
      if (!isEnabled) return;

      if (location.href !== lastSeenUrl) {
        lastSeenUrl = location.href;
        scheduleFullScan();
      }

      for (const mutation of mutations) {
        if (mutation.type === "childList") {
          for (const addedNode of mutation.addedNodes) {
            processNode(addedNode);
          }
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
