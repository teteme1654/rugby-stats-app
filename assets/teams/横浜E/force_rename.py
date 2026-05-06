import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
ネスタ ・マヒナ 
知念 雄 
南 友紀 
杉本 達郎 
シオエリ ・ヴァカラヒ 
三好 優作 
松岡 将大 
岡部 崇人 
祝原 涼介 
栗崎 和樹 
土一 海人 
庭井 祐輔 
中村 駿太 
平石 颯 
リアム ・コルトマン 
サム ・ケアード 
秋山 大地 
ジャンドレ ・ラブスカフニ 
コルマック ・ダリー 
リアキマタギ ・モリ 
久保 克斗 
安井 龍太 
シオネ ・ラベマイ 
サウマキ アマナキ 
アミニアシ ・ショー 
ビリー ・ハーモン 
古川 聖人 
レキマ ・ナサミラ 
ランダル ・ベイカー 
シオネ ・ハラシリ 
土永 旭 
ファフ ・デクラーク 
山菅 一史 
天野 寿紀 
荒井 康植 
小倉 順平 
田村 優 
武藤 ゆらぎ 
竹澤 正祥 
松井 千士 
高木 一成 
石田 吉平 
生田 弦己 
リーバイ ・アウムア 
江藤 良 
ヴィリアメ ・タカヤワ 
梶村 祐介 
ジェシー ・クリエル 
田畑 凌 
猿田 湧 
普久原 琉 
武藤 航生 
森 勇登 
ブレンダン ・オーウェン 
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
