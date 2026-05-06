import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
石川 槙人 
リサラ ・フィナウ 
木原 優作 
ダニエル ・ペレズ 
藤井 大喜 
古畑 翔 
クレイグ ・ミラー 
稲垣 啓太 
ヴァル アサエリ愛 
タニエラ ・ヴェア 
高(はしごだか)田 凱斗 
佐藤 健次 
島根 一磨 
坂手 淳史 
下釜 優次 
田島 貫太郎 
ルード ・デヤハー 
リアム ・ミッチェル 
橋本 吾郎 
エセイ ・ハアンガナ 
宮川 智海 
オッキー ・バーナード 
シュモック オライオン 
ジャック ・コーネルセン 
ジェイデン ・ジュベール 
ジュアン ・ウーストハイゼン 
ユアン ・ウィルソン 
ラクラン ・ボーシェー 
福井 翔大 
ベン ・ガンター 
大西 樹 
長谷川 崚太 
布巻 峻介 
ゼイビア ・スタワーズ 
カイポウリ ヴィリアミアフ 
延原 秀飛 
李 錦寿 
本堂 杏虎 
小山 大輝 
萩原 周 
山沢 京平 
山沢 拓也 
楢本 幹志朗 
モーリス ・マークス 
ジョシュア ・ノーラ 
川崎 清純 
マリカ ・コロインベテ 
新井 翼 
竹山 晃暉 
齊藤 誉哉 
ダミアン ・デアレンデ 
長田 智希 
ヴィンス ・アソ 
ディラン ・ライリー 
谷山 隼大 
野口 竜司 
谷口 宜顕 
トム ・パートン 
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
