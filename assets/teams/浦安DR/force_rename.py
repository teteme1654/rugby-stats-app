import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
須藤 元樹 
ハラホロ ・トコラヒ 
梅田 海星 
鍋島 秀源 
金 廉 
梁 正秀 
平井 将太郎 
セコナイア ・ポレ 
石田 楽人 
玉永 仁一郎 
サミソニ ・アサエリ 
金 正奎 
藤村 琉士 
松下 潤一郎 
大本 峻士 
マナアキ ・セルビーリキット 
佐々木 柚樹 
ゼファニア ・トゥイノナ 
ヘル ウヴェ 
武内 慎 
小島 佑太 
佐藤 大樹 
金 嶺志 
スティーブン ・カミンズ 
クインティン ・ストレインジ 
ツイ ヘンドリック 
繁松 哲大 
田中 勇成 
森山 海宇オスティン 
タマティ ・イオアネ 
ルシアテ ・フィナウ 
ヤスパー ・ヴィーセ 
ブロディ ・マカスケル 
小嶋 大士 
ラリー ・ティポアイルテール 
橋本 法史 
小西 泰聖 
飯沼 蓮 
白栄 拓也 
金 侑悟 
オテレ ・ブラック 
田村 煕 
森 駿太 
大畑 亮太 
ケレブ ・カヴバティ 
松本 純弥 
石井 魁 
松本 壮馬 
タナ ・トゥハカライナ 
リサラ シオシファ 
サミソニ ・トゥア 
シェーン ・ゲイツ 
サム ・ケレビ 
何松 健太郎 
山中 亮平 
石田 大河 
安田 卓平 
イズラエル ・フォラウ 
ルテル ・ラウララ 
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
