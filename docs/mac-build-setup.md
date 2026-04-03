# Mac環境構築 & ビルド手順

MacBook Pro で本アプリをビルドするための手順です。

## 必要なもの

- MacBook Pro（HDMI出力可能なもの）
- インターネット接続
- GitHubアカウントへのアクセス権

---

## 1. Homebrewのインストール

まずパッケージマネージャーのHomebrewを入れます。

```bash
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"
```

インストール後、表示される「Next steps」の指示に従ってPATHを通してください。

---

## 2. Node.jsのインストール

```bash
brew install node@18
```

インストール確認：

```bash
node --version  # v18.x.x が表示されればOK
npm --version
```

---

## 3. リポジトリのクローン

```bash
git clone https://github.com/teteme1654/rugby-stats-app.git
cd rugby-stats-app
```

---

## 4. 依存パッケージのインストール

```bash
npm install
```

---

## 5. 動作確認（任意）

ビルド前に起動確認したい場合：

```bash
npm start
```

---

## 6. Macビルド

```bash
npm run build:mac
```

完了すると `dist/` フォルダに `.dmg` と `mac/` が生成されます。

---

## 使い方（本番運用）

1. HDMI接続でディスプレイを拡張モードにする
2. アプリ起動
3. コントロール画面（内蔵ディスプレイ）でチーム・スタッツを操作
4. スタッツ表示画面をHDMI接続のディスプレイに移動

---

## トラブルシューティング

### `npm install` でエラーが出る場合

Xcodeのコマンドラインツールが必要な場合があります：

```bash
xcode-select --install
```

### `npm run build:mac` で署名エラーが出る場合

署名なしでビルドするには以下を実行：

```bash
CSC_IDENTITY_AUTO_DISCOVERY=false npm run build:mac
```
