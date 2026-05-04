import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
三竹 康太 
パディー ・ライアン 
中村 公星 
大山 祥平 
谷口 祐一郎 
笹川 大五 
千葉 太一 
西 和磨 
津村 大志 
サミュエラ ・ワカヴァカ 
松原 結生 
足立 友哉 
李 淳弘 
佐藤 康 
武井 日向 
大西 将史 
大内 真 
ニック ・スーチョン 
フィリックス ・カラプ 
岸 佑融 
マイケル ・アラダイス 
ジョシュ ・グッドヒュー 
山本 秀 
ハリソン ・フォックス 
ファカタヴァ タラウ侍 
ロトアヘア ポヒヴァ大和 
山本 嶺二郎 
リアム ・ギル 
マクカラン ブロディ 
山村 勝悟 
ファカタヴァ アマト 
松橋 周平 
木原 音弥 
TJ ・ペレナラ 
南 昂伸 
高橋 敏也 
稲葉 聖馬 
中楠 一期 
堀米 航平 
伊藤 耕太郎 
秋濱 悠太 
古賀 由教 
山村 知也 
高本 とむ 
ラメカ ・ポイヒピ 
久木野 太一 
PJ ・ラトゥ 
青木 拓己 
シオペ ・タヴォ 
池田 悠希 
西川 大輔 
栗原 由太 
礒田 凌平 
ラズロー ・ソード 
アイザック ・ルーカス 
メイン 平 
"""
# ==========================================

def clean_name(name):
    # 前後の空白削除
    name = name.strip()
    # 全角スペースを半角スペースに
    name = name.replace("　", " ")
    # 変な空白文字（NBSPなど）を削除
    name = "".join([c for c in name if c.isprintable()])
    return name

def main():
    # 名前リストを整形
    names = [clean_name(n) for n in raw_names.strip().split("\n") if n.strip()]
    
    # 現在のフォルダの画像ファイルを取得
    # 数字順に並べ替え (image1.jpeg, image2.jpeg...)
    files = [f for f in os.listdir(".") if f.lower().endswith((".jpg", ".jpeg", ".png"))]
    
    # 数字部分を抽出してソートする関数
    def sort_key(f):
        nums = re.findall(r'\d+', f)
        return int(nums[0]) if nums else 9999

    files.sort(key=sort_key)

    print(f"対象ファイル数: {len(files)}")
    print(f"名前リスト数: {len(names)}")

    if len(files) == 0:
        print("画像ファイルが見つかりません。")
        return

    # リネーム実行
    for i, filename in enumerate(files):
        if i >= len(names):
            break
            
        old_path = filename
        ext = os.path.splitext(filename)[1] # 拡張子 (.jpeg)
        new_name = names[i] + ext
        
        try:
            os.rename(old_path, new_name)
            print(f"[OK] {old_path} -> {new_name}")
        except Exception as e:
            print(f"[ERROR] {old_path} -> {new_name}: {e}")

    print("\n完了！")

if __name__ == "__main__":
    main()
