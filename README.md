# X Mosaic Mask (Chrome Extension)

A Chrome extension for `x.com` / `twitter.com`.

It blurs:
- Your own account block in the left sidebar (`SideNav_AccountSwitcher_Button`)
- Your own tweet-side avatar images (`UserAvatar-Container-<your_handle>`)

It does not blur full tweet content or all profile pages.

## Setup

1. Open `chrome://extensions/`
2. Enable Developer mode
3. Click "Load unpacked"
4. Select this folder (`X_mosaic`)

## ON/OFF Toggle

- Click the extension icon in Chrome toolbar to toggle ON/OFF
- Badge shows current state (`ON` / `OFF`)
- ON/OFF is saved in `chrome.storage.local`
- The page updates automatically without reinstall

## Implementation Notes

- `content.js` watches DOM updates with `MutationObserver`
- Blur effect uses CSS filter (`.xmosaic-blur`)
- Current selectors are intentionally narrow to avoid affecting unrelated elements

## Limitation

- If X changes DOM attributes/test IDs, selectors may need updates
