import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
カウヴァカ ・カイヴェラタ 
前田 翔 
高尾 時流 
具 智元 
渡邉 隆之 
中島 イシレリ 
山下 裕史 
森脇 光 
大下 貴志 
富田 陸 
アッシュ ・ディクソン 
シオネ ・シメ・マウ 
宮内 慶大 
北出 卓也 
松岡 賢太 
ニール ・ハンセン 
本橋 拓馬 
ジェラード ・カウリートゥイオティ 
小瀧 尚弘 
ワイサケ ・ララトゥブア 
ブロディ ・レタリック 
カヴァイア ・タギヴェタウア 
ソロモネ ・フナキ 
ソセフォ ・ファカタヴァ 
福西 隼杜 
前田 剛 
橋本 皓 
今村 陽良 
ティエナン ・コストリー 
ヴィリー ・ポトヒエッター 
アーディ ・サベア 
シオネ ・ポルテレ 
上村 樹輝 
中嶋 大希 
徳田 健太 
日和佐 篤 
ブリン ・ガットランド 
植田 和磨 
イノケ ・ブルア 
杉本 崇馬 
アタアタ ・モエアキオラ 
濱野 隼大 
船曳 涼太 
ハリス マック 
タリ ・イオアサ 
タリロトゥ ・ファカトゥロロ 
マイケル ・リトル 
ラファエレ ティモシー 
アントン ・レイナートブラウン 
大町 佳生 
松永 貫汰 
井関 信介 
辻野 隼大 
李 承信 
伊藤 大祐 
上ノ坊 駿介 
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
