import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
甲斐 登生 
加藤 一希 
紙森 陽太 
オペティ ・ヘル 
山本 剣士 
海士 広大 
才田 智 
北川 賢吾 
イジ— ・ソード 
為房 慶次朗 
安江 祥光 
福田 陸人 
大熊 克哉 
江良 颯 
マルコム ・マークス 
島 正輝 
浅井 勇暉 
アキラ ・イエレミア 
メルヴェ ・オリヴィエ 
デーヴィッド ・ヴァンジーランド 
デーヴィッド ・ブルブリング 
玉置 将也 
ルアン ・ボタ 
堀部 直壮 
青木 祐樹 
タイラー ・ポール 
栗原 大地 
上ノ坊 悠馬 
オリー ・ストーンハム 
梁本 旺義 
末永 健雄 
ピーター ・ラピース・ラブスカフニ 
マキシ ファウルア 
トゥパ フィナウ 
梁川 賢吉 
ハリー ・ウィラード 
利川 桐生 
アシペリ ・モアラ 
ティシレリ ・ロケティ 
ブリン ・ホール 
古賀 駿汰 
岡田 一平 
谷口 和洋 
溝渕 元気 
藤原 忍 
柴田 竜成 
押川 敦治 
バーナード ・フォーリー 
岸岡 智樹 
ジニングス ツヨシ 
木田 晴斗 
根塚 洸雅 
山崎 洋之 
島田 悠平 
近藤 翔耶 
リカス ・プレトリアス 
テアウパ シオネ 
立川 理道 
廣瀬 雄也 
ショーン ・スティーブンソン 
ハラトア ・ヴァイレア 
ゲラード ・ファンデンヒーファー 
松下 怜央 
二村 莞司 
山田 響 
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
