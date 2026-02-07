# X Mosaic Mask（Chrome拡張）

`x.com` / `twitter.com` 向けの Chrome 拡張です。

## 機能

以下の要素にのみぼかしを適用します。

- 左サイドバー下部の自分のアカウント表示（`SideNav_AccountSwitcher_Button`）
- 自分の投稿に付くアイコン画像（`UserAvatar-Container-<あなたのID>`）

以下は対象外です。

- 投稿本文全体
- 他ユーザーのプロフィールページ全体

## セットアップ

1. `chrome://extensions/` を開く
2. 右上の「デベロッパーモード」を ON
3. 「パッケージ化されていない拡張機能を読み込む」をクリック
4. このフォルダ（`X_mosaic`）を選択

## ON/OFF 切り替え

- Chrome ツールバーの拡張アイコンをクリックすると ON/OFF が切り替わります
- バッジに現在状態（`ON` / `OFF`）が表示されます
- 状態は `chrome.storage.local` に保存されます
- 切り替えは再インストール不要で即時反映されます

## 実装メモ

- `content.js` は `MutationObserver` で DOM の追加を監視します
- ぼかしは CSS フィルタ（`.xmosaic-blur`）で実装しています
- 不要な誤判定を避けるため、セレクタは意図的に狭くしています

## 注意点

- X 側の DOM 構造や `data-testid` が変わると、セレクタ調整が必要になる場合があります
