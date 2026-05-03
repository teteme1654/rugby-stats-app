# Ovaly Mac ビルド & 再インストール手順

Pilotブランチを最新に更新し、インストーラーをビルドして再インストールするための手順です。

> 初回セットアップ（Homebrew / Node.js のインストール等）は `mac-build-setup.md` を参照してください。

---

## 1. Pilotブランチを最新に更新

```bash
cd ~/GitHub/Ovaly-Dev   # リポジトリのパスに合わせて変更
git checkout Pilot
git pull origin Pilot
```

---

## 2. 依存パッケージを更新

```bash
npm install
```

---

## 3. ビルド

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```

> `CSC_IDENTITY_AUTO_DISCOVERY=false` は署名なしビルドのオプションです。Apple Developer署名がない場合はこちらを使用してください。

完了すると `dist/` フォルダに以下が生成されます：
- `Ovaly-1.0.0.dmg` — インストーラー

---

## 4. 既存バージョンをアンインストール

1. **Ovaly を終了**（起動中の場合）
2. Finder で **アプリケーション** フォルダを開く
3. **Ovaly.app** をゴミ箱にドラッグ

---

## 5. 新バージョンをインストール

1. `dist/Ovaly-1.0.0.dmg` をダブルクリックして開く
2. **Ovaly.app** を **Applications** フォルダにドラッグ
3. DMGをアンマウント（取り出し）
4. アプリケーションフォルダから **Ovaly** を起動

---

## トラブルシューティング

### 「開発元を確認できないため開けません」と表示される場合

```bash
xattr -cr /Applications/Ovaly.app
```

または、システム設定 > プライバシーとセキュリティ から「このまま開く」を選択。

### ビルドエラーが出る場合

Xcodeコマンドラインツールを確認：

```bash
xcode-select --install
```
