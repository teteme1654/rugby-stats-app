#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
選手写真背景除去スクリプト

stats/images/players/ フォルダ内の画像の背景を一括除去します。
処理後のファイルは同じフォルダに _nobg.png として保存されます。

使い方:
  1. pip install rembg pillow
  2. python remove_bg.py
"""

import os
import sys
from pathlib import Path

try:
    from rembg import remove
    from PIL import Image
except ImportError:
    print("❌ エラー: 必要なライブラリがインストールされていません")
    print("以下のコマンドを実行してください:")
    print("  pip install rembg pillow")
    sys.exit(1)


def remove_background_batch(input_dir="stats/images/players", output_suffix="_nobg"):
    """
    指定ディレクトリ内の画像を一括で背景除去
    
    Args:
        input_dir (str): 入力画像ディレクトリ
        output_suffix (str): 出力ファイル名のサフィックス
    """
    input_path = Path(input_dir)
    
    if not input_path.exists():
        print(f"❌ エラー: ディレクトリが見つかりません: {input_dir}")
        print(f"現在のディレクトリ: {os.getcwd()}")
        return
    
    # 処理対象の画像ファイルを取得
    image_files = []
    for ext in ['*.jpg', '*.jpeg', '*.png', '*.JPG', '*.JPEG', '*.PNG']:
        image_files.extend(input_path.glob(ext))
    
    # _nobg.png ファイルは除外
    image_files = [f for f in image_files if output_suffix not in f.stem]
    
    if not image_files:
        print(f"⚠️  警告: {input_dir} に画像ファイルが見つかりません")
        return
    
    print(f"🎯 処理対象: {len(image_files)} ファイル\n")
    
    success_count = 0
    error_count = 0
    
    for i, file_path in enumerate(image_files, 1):
        try:
            # 出力ファイル名を生成
            output_filename = f"{file_path.stem}{output_suffix}.png"
            output_path = input_path / output_filename
            
            # 既に処理済みかチェック
            if output_path.exists():
                print(f"[{i}/{len(image_files)}] ⏭️  スキップ: {file_path.name} (既に処理済み)")
                continue
            
            print(f"[{i}/{len(image_files)}] 🔄 処理中: {file_path.name}")
            
            # 画像を読み込み
            with open(file_path, 'rb') as input_file:
                input_image = input_file.read()
            
            # 背景除去処理
            output_image = remove(input_image)
            
            # PNG として保存
            with open(output_path, 'wb') as output_file:
                output_file.write(output_image)
            
            print(f"[{i}/{len(image_files)}] ✅ 完了: {output_filename}")
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
    print(f"❌ エラー: {error_count} ファイル")
    print(f"📁 出力先: {input_path.absolute()}")
    print("="*50)


if __name__ == "__main__":
    print("="*50)
    print("🏉 Ovaly - 選手写真背景除去ツール")
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
    print("次のステップ:")
    print("  1. 生成された *_nobg.png ファイルを確認")
    print("  2. Ovaly アプリで透過PNG を使用するように設定")
    print()
