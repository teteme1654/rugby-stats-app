import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
小林 洋平 
山川 力優 
木村 星南 
小鍜治 悠太 
眞壁 照男 
三上 正貴 
原渕 修人 
アンドリュー ・マカリオ 
日吉 健 
酒木 凜平 
橋本 大吾 
森 太志 
カラム ・マクドナルド 
マイケル ・ストーバーグ 
アサエリ ・ラウシー 
ジェイコブ ・ピアス 
高城 勝一 
亀井 茜風 
伊藤 鐘平 
木戸 大士郎 
佐々木 剛 
山本 浩輝 
シャノン ・フリゼル 
尹 礼温 
アフ ・オフィナ 
リーチ マイケル 
徳永 祥尭 
杉山 優平 
高橋 昴平 
小川 高廣 
田中 元珠 
池戸 将太郎 
松永 拓朗 
リッチー ・モウンガ 
ティージェイ ・クラーク 
ネタニ ・ヴァカヤリア 
岡村 優太 
金 秀隆 
ジョネ ・ナイカブラ 
桑山 淳生 
濱田 将暉 
岩渕 誠 
石岡 玲英 
池永 玄太郎 
セタ ・タマニバル 
眞野 泰地 
ロブ ・トンプソン 
桑山 聖生 
豊島 翔平 
マイケル ・コリンズ 
ステファーナス ・ドゥトイ 
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
