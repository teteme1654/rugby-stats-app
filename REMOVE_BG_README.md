# 選手写真背景除去ツール

選手写真の白背景を自動で除去し、透過PNG を生成するツールです。

## 📋 必要な環境

- Python 3.7 以上
- pip（Python パッケージマネージャー）

## 🔧 セットアップ

### 1. 必要なライブラリをインストール

```bash
pip install rembg pillow
```

または、GPU を使って高速化する場合（推奨）：

```bash
pip install rembg[gpu]
```

**注意**: 初回実行時に AI モデル（約 176MB）が自動ダウンロードされます。

---

## 🚀 使い方

### 1. 選手写真を配置

白背景の選手写真を以下のフォルダに入れます：

```
stats/images/players/
├── 平野_叶翔.jpg
├── 選手A.jpg
└── 選手B.png
```

### 2. スクリプト実行

プロジェクトルート（`webapp/`）で実行：

```bash
python remove_bg.py
```

### 3. 処理結果

同じフォルダに透過PNG が生成されます：

```
stats/images/players/
├── 平野_叶翔.jpg          # 元ファイル
├── 平野_叶翔_nobg.png     # ← 背景除去済み
├── 選手A.jpg
├── 選手A_nobg.png
├── 選手B.png
└── 選手B_nobg.png
```

---

## 📊 実行例

```
==================================================
🏉 Ovaly - 選手写真背景除去ツール
==================================================

🎯 処理対象: 3 ファイル

[1/3] 🔄 処理中: 平野_叶翔.jpg
[1/3] ✅ 完了: 平野_叶翔_nobg.png
[2/3] 🔄 処理中: 選手A.jpg
[2/3] ✅ 完了: 選手A_nobg.png
[3/3] ⏭️  スキップ: 選手B_nobg.png (既に処理済み)

==================================================
📊 処理結果
==================================================
✅ 成功: 2 ファイル
❌ エラー: 0 ファイル
📁 出力先: /home/user/webapp/stats/images/players
==================================================

🎉 全ての処理が完了しました！

次のステップ:
  1. 生成された *_nobg.png ファイルを確認
  2. Ovaly アプリで透過PNG を使用するように設定
```

---

## ⚙️ Ovaly アプリ側の設定

### player-slide-prototype.html の修正

選手写真のパスを `_nobg.png` に変更：

```javascript
// 修正前
changePlayer('stats/images/players/平野_叶翔.jpg', '1', ...)

// 修正後
changePlayer('stats/images/players/平野_叶翔_nobg.png', '1', ...)
```

または、自動で `_nobg.png` を使うように変更：

```javascript
function changePlayer(photoPath, jerseyNo, nameJp, nameEn, position) {
  // .jpg/.jpeg を _nobg.png に置き換え
  const nobgPath = photoPath.replace(/\.(jpg|jpeg|png)$/i, '_nobg.png');
  const photoImg = document.getElementById('playerPhoto');
  photoImg.src = nobgPath;
  
  // 透過PNG なので Canvas 処理は不要
  // （removeWhiteBackground 関数は呼ばない）
  
  // 他の情報更新
  document.getElementById('jerseyNo').textContent = 'No.' + jerseyNo;
  document.getElementById('nameJp').textContent = nameJp;
  document.getElementById('nameEn').textContent = nameEn;
  document.getElementById('position').textContent = position;
}
```

---

## 🔍 トラブルシューティング

### エラー: `ModuleNotFoundError: No module named 'rembg'`

→ ライブラリがインストールされていません

```bash
pip install rembg pillow
```

### エラー: `ディレクトリが見つかりません`

→ プロジェクトルート（`webapp/`）で実行してください

```bash
cd /path/to/webapp
python remove_bg.py
```

### 処理が遅い

→ GPU 版をインストールすると高速化します

```bash
pip uninstall rembg
pip install rembg[gpu]
```

### 背景除去の精度が悪い

→ AI モデルを変更できます（スクリプト内で `model_name` を指定）

```python
# デフォルト（u2net: 高精度・重い）
output_image = remove(input_image)

# 軽量版（u2netp: 低精度・軽い）
output_image = remove(input_image, model_name='u2netp')

# 人物特化（u2net_human_seg: 人物のみ・高速）
output_image = remove(input_image, model_name='u2net_human_seg')
```

---

## 📝 運用フロー

### 試合前（仕込み段階）

1. リーグから提供された選手写真を `stats/images/players/` に配置
2. `python remove_bg.py` を実行
3. 生成された `*_nobg.png` を確認
4. CSV ファイルで `_nobg.png` を指定

### 試合中（本番）

- Ovaly アプリで透過PNG を表示
- リアルタイム処理不要 → 高速表示 ✅

---

## 📦 ファイル構成

```
webapp/
├── remove_bg.py              # このスクリプト
├── REMOVE_BG_README.md       # このドキュメント
└── stats/
    └── images/
        └── players/
            ├── *.jpg         # 元画像
            └── *_nobg.png    # 処理済み（透過PNG）
```

---

## 💡 Tips

- **一括処理**: 複数の選手写真を一度に処理できます
- **スキップ機能**: 既に処理済みのファイルは自動でスキップ
- **安全**: 元ファイルは削除されません（別名保存）
- **高品質**: AI による高精度な背景除去

---

## 🤝 サポート

問題が発生した場合は、以下の情報と共にお知らせください：

- Python バージョン: `python --version`
- OS 情報
- エラーメッセージ全文
