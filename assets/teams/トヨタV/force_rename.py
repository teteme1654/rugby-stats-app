import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
ハムダン ・トゥイプロトゥ 
平井 半次郎 
百地 龍之介 
清水 岳 
木津 悠輔 
三浦 昌悟 
西野 拓真 
川崎 太雅 
タウファ ・ラトゥ 
スカルク ・エラスマス 
ジョネ ・ケレビ 
加藤 竜聖 
彦坂 圭克 
福澤 慎太郎 
田中ダウリン ジョウナス 
西野 帆平 
ハリソン ・ゴギン 
山川 一瑳 
ジョシュ ・ディクソン 
ザック ・ギャラハー 
ローレンス ・エラスマス 
ヒンガノ ・ロロヘア 
青木 恵斗 
小池 隆成 
姫野 和樹 
三木 皓正 
村田 陣悟 
奥井 章仁 
ブレア ・ライアル 
アイザイア ・マプスア 
ウィリアム ・トゥポウ 
田村 魁世 
梁 正秋 
茂野 海人 
アーロン ・スミス 
谷中 樹平 
エイダン ・モーガン 
松田 力也 
北村 将大 
マット ・マッガーン 
マーク ・テレア 
セミシ ・トゥポウ 
高橋 汰地 
ジョネ ・ナベテレヴ 
大籔 洸太 
和田 悠一郎 
ヴィリアメ ・ツイドラキ 
日隈 太陽 
ニコラス ・マクカラン 
ディック ・ウィルソン 
岡田 優輝 
森谷 圭介 
松山 千大 
山口 修平 
バティリアイ ・ツイドラキ 
シオサイア ・フィフィタ 
ティアーン ・ファルコン 
中野 剛通 
小村 真也 
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
