import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
本山 佳龍 
稲場 巧 
シアレ ・マヒナ 
茂原 隆由 
山下 憲太 
河田 和大 
郭 玟慶 
伊藤 平一郎 
中山 律希 
ショーン ・ヴェーテー 
八木澤 龍翔 
リッチモンド ・トンガタマ 
平川 隼也 
日野 剛志 
作田 駿介 
ダニエル ・マイアヴァ 
ジャスティン ・サングスター 
三浦 駿平 
桑野 詠真 
大戸 裕矢 
マリー ・ダグラス 
ジャック ・ライト 
能勢 涼太郎 
福田 大晟 
齋藤 良明慈縁 
ジョーンズ リチャード剛 
杉原 立樹 
庄司 拓馬 
ヴェティ ・トゥポウ 
シモン ・ミラー 
舟橋 諒将 
マルジーン ・イラウア 
クワッガ ・スミス 
シオネ ・ブナ 
サネレ ・ノハンバ 
細矢 聖樹 
加藤 大冴 
岡崎 航大 
北村 瞬太郎 
筒口 允之 
家村 健太 
サム ・グリーン 
ヴァレンス ・テファレ 
ジャック ・ティム 
槇 瑛人 
マロ ・ツイタマ 
矢富 洋則 
杉本 海斗 
御池 蓮二 
セミ ・ラドラドラ 
五島 源 
伊藤 峻祐 
チャールズ ・ピウタウ 
シルビアン ・マフーザ 
岡崎 颯馬 
奈須 貴大 
山口 楓斗 
奥村 翔 

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
