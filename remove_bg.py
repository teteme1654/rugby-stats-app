#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
選手写真背景除去＋リネームスクリプト

stats/images/players/ フォルダ配下の全画像を再帰的に処理します。
- 背景除去した透過PNG を生成（人物特化モデル使用）
- エッジにぼかし処理を追加（自然な輪郭に）
- ファイル名を選手名のみにリネーム（例: Keita_Inagaki_nobg.png）
- 元ファイルはそのまま保持

使用モデル:
  u2net_human_seg - 人物に特化した高精度モデル
  髪の毛などの細部も綺麗に切り抜き可能

後処理:
  GaussianBlur(radius=2) - アルファチャンネルにぼかしをかけて輪郭を自然に

使い方:
  1. pip install rembg[cpu] pillow
  2. python remove_bg.py
"""

import os
import sys
import re
from pathlib import Path

try:
    from rembg import remove
    from PIL import Image, ImageFilter
except ImportError:
    print("❌ エラー: 必要なライブラリがインストールされていません")
    print("以下のコマンドを実行してください:")
    print("  pip install rembg pillow")
    sys.exit(1)

# ==========================================
# 以下の関数は force_rename.py で事前リネーム済み前提のため、現在未使用
# 将来的に英語名抽出が必要になった場合に備えてコメントアウトで保持
# ==========================================

# def extract_player_name(filename):
#     """
#     ファイル名から選手名を抽出
#     
#     パターン:
#     - 1763948510837-_-SB_Bunkei_Kaku_① → Bunkei_Kaku
#     - 1764239471773-_-UD_045_Ren_Iinuma_① → Ren_Iinuma
#     - 1764152251539-_-SW_008_Keita_Inagaki_1 → Keita_Inagaki
#     
#     Args:
#         filename (str): 元のファイル名（拡張子なし）
#     
#     Returns:
#         str: 抽出された選手名 or 元のファイル名
#     """
#     # "-_-" が含まれていない場合はそのまま返す
#     if "-_-" not in filename:
#         return filename
#     
#     # "-_-" で分割して後半部分を取得
#     parts = filename.split("-_-")
#     if len(parts) < 2:
#         return filename
#     
#     name = parts[1]
#     
#     # 末尾の _① _1 _01 などを削除（柔軟に対応）
#     name = re.sub(r'_[①\d]+$', '', name)
#     
#     # 先頭のチームコード削除（2〜3文字の大文字 + アンダーバー）
#     name = re.sub(r'^[A-Z]{2,3}_', '', name)
#     
#     # 数字のみの管理番号削除（例: _045_）
#     name = re.sub(r'_\d+_', '_', name)
#     
#     # 連続するアンダーバーを1つに統一
#     name = re.sub(r'__+', '_', name)
#     
#     # 前後のアンダーバーを削除
#     name = name.strip('_')
#     
#     return name if name else filename


def remove_background_batch(input_dir="stats/images/players", output_suffix="_nobg"):
    """
    指定ディレクトリ配下の画像を再帰的に背景除去＋リネーム
    
    チームフォルダ内に original/ と nobg/ を作成して分離保存
    
    構造例:
      players/sungoliath/original/元ファイル.jpg
      players/sungoliath/nobg/選手名_nobg.png
    
    Args:
        input_dir (str): 入力画像ディレクトリ
        output_suffix (str): 出力ファイル名のサフィックス
    """
    input_path = Path(input_dir)
    
    if not input_path.exists():
        print(f"❌ エラー: ディレクトリが見つかりません: {input_dir}")
        print(f"現在のディレクトリ: {os.getcwd()}")
        return
    
    # 処理対象の画像ファイルを再帰的に取得
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
        image_files.extend(input_path.rglob(ext))  # rglob で再帰的に検索
    
    # nobg フォルダ内のファイルと _nobg.png ファイルは除外
    image_files = [f for f in image_files if 'nobg' not in f.parts and output_suffix not in f.stem]
    
    if not image_files:
        print(f"⚠️  警告: {input_dir} 配下に画像ファイルが見つかりません")
        return
    
    print(f"🎯 処理対象: {len(image_files)} ファイル")
    print(f"📁 検索範囲: {input_path.absolute()} 配下（サブフォルダ含む）\n")
    
    success_count = 0
    error_count = 0
    skip_count = 0
    moved_count = 0
    
    for i, file_path in enumerate(image_files, 1):
        try:
            # ファイル名をそのまま使用（force_rename.py で既にリネーム済み前提）
            player_name = file_path.stem
            
            # チームフォルダを特定（親ディレクトリ）
            # players/sungoliath/ファイル.jpg → team_dir = sungoliath/
            if file_path.parent == input_path:
                # players/ 直下の場合
                team_dir = input_path
            else:
                # players/チーム名/... の場合、チームフォルダまで遡る
                # players/チーム名/original/ファイル.jpg の場合も対応
                team_dir = file_path.parent
                while team_dir.parent != input_path and team_dir != input_path:
                    team_dir = team_dir.parent
            
            # original/ フォルダと nobg/ フォルダを作成
            original_dir = team_dir / "original"
            nobg_dir = team_dir / "nobg"
            original_dir.mkdir(exist_ok=True)
            nobg_dir.mkdir(exist_ok=True)
            
            # 出力ファイル名を生成（リネーム）
            output_filename = f"{player_name}{output_suffix}.png"
            output_path = nobg_dir / output_filename
            
            # 既に処理済みかチェック
            if output_path.exists():
                print(f"[{i}/{len(image_files)}] ⏭️  スキップ: {file_path.name} (既に処理済み)")
                skip_count += 1
                continue
            
            # 相対パス表示（見やすくする）
            rel_path = file_path.relative_to(input_path)
            print(f"[{i}/{len(image_files)}] 🔄 処理中: {rel_path}")
            
            # 画像を読み込み
            with open(file_path, 'rb') as input_file:
                input_image = input_file.read()
            
            # 背景除去処理（人物特化モデルを使用）
            from rembg import new_session
            from io import BytesIO
            session = new_session('u2net_human_seg')
            
            # Alpha Matting で高精度エッジ処理（ハロー効果を削減）
            output_image = remove(
                input_image, 
                session=session,
                alpha_matting=True,                      # 精密マット処理ON
                alpha_matting_foreground_threshold=240,  # 前景閾値（高いほど厳格）
                alpha_matting_background_threshold=10,   # 背景閾値（低いほど厳格）
                alpha_matting_erode_size=10              # エッジ侵食サイズ
            )
            
            # PIL で読み込み
            img = Image.open(BytesIO(output_image))
            
            # Alpha Matting で既にエッジ処理済みなので、ぼかしは不要
            # （必要に応じて軽いぼかし GaussianBlur(1) を追加可能）
            
            # nobg/ フォルダに PNG として保存
            img.save(output_path, 'PNG')
            
            print(f"[{i}/{len(image_files)}] ✅ 完了: nobg/{output_filename}")
            
            # 元ファイルが original/ 内にない場合は移動
            if file_path.parent != original_dir:
                original_path = original_dir / file_path.name
                if not original_path.exists():
                    file_path.rename(original_path)
                    print(f"             📦 移動: original/{file_path.name}")
                    moved_count += 1
            
            success_count += 1
            
        except Exception as e:
            print(f"[{i}/{len(image_files)}] ❌ エラー: {file_path.name}")
            print(f"    {str(e)}")
            error_count += 1
    
    # 結果サマリー
    print("\n" + "="*50)
    print("📊 処理結果")
    print("="*50)
    print(f"✅ 成功: {success_count} ファイル")
    print(f"📦 移動: {moved_count} ファイル（original/ へ）")
    print(f"⏭️  スキップ: {skip_count} ファイル（既に処理済み）")
    print(f"❌ エラー: {error_count} ファイル")
    print(f"📁 出力先: 各チームフォルダ内の nobg/")
    print("="*50)


if __name__ == "__main__":
    print("="*50)
    print("🏉 Ovaly - 選手写真背景除去＋リネームツール")
    print("="*50)
    print()
    
    # カレントディレクトリを確認
    current_dir = Path.cwd()
    expected_dir = current_dir / "stats" / "images" / "players"
    
    if not expected_dir.exists():
        print("⚠️  警告: stats/images/players/ が見つかりません")
        print(f"現在のディレクトリ: {current_dir}")
        print()
        print("このスクリプトはプロジェクトルート（webapp/）で実行してください")
        print()
        sys.exit(1)
    
    # 処理実行
    remove_background_batch()
    
    print()
    print("🎉 全ての処理が完了しました！")
    print()
    print("📁 フォルダ構造:")
    print("  stats/images/players/")
    print("  └── チーム名/")
    print("      ├── original/     # 元ファイル（白背景）")
    print("      │   └── *.jpg")
    print("      └── nobg/         # 透過PNG（リネーム済み）")
    print("          └── 選手名_nobg.png")
    print()
    print("次のステップ:")
    print("  1. 各チームの nobg/ フォルダ内のファイルを確認")
    print("  2. Ovaly アプリで nobg/ 内の透過PNG を使用するように設定")
    print()
    print("💡 Tips:")
    print("  - 元ファイルは original/ フォルダに保管されています")
    print("  - リネームされた透過PNG が nobg/ フォルダに生成されています")
    print("  - 例: nobg/Keita_Inagaki_nobg.png")
    print()
