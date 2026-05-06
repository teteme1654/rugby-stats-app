import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
小川 寛大 
大賀 宗志 
細木 康太郎 
中野 幹 
垣永 真之介 
森川 由起乙 
山本 敦輝 
竹内 柊平 
小林 賢太 
木原 三四郎 
杉浦 皓亮 
アレックス ・マフィ 
宮崎 達也 
呉 季依典 
堀越 康介 
平生 翔大 
ジョージ ・ハモンド 
サム ・K・ジェフリーズ 
サイモニ ・ヴニランギ 
片倉 康瑛 
小林 航 
サム ・P・ジェフリーズ 
ハリー ・ホッキングス 
ピエリッチ ・シーバート 
相良 昌彦 
山本 凱 
桶谷 宗汰 
箸本 龍雅 
飯野 晃司 
サム ・ケイン 
下川 甲嗣 
テビタ ・タタフ 
パトリック ・ヴァカタ 
ショーン ・マクマーン 
小林 典大 
宮尾 昌典 
マックス ・ヒューズ 
大越 元気 
流 大 
福田 健太 
ケイレブ ・トラスク 
石田 一貴 
高本 幹也 
安田 昂平 
尾崎 晟也 
仁熊 秀斗 
江見 翔太 
チェスリン ・コルビ 
ギデオン ・ランプリング 
クイントン ・マヒナ 
イザヤ ・プニヴァイ 
中野 将伍 
尾崎 泰雅 
中村 亮土 
野中 健吾 
福島 秀法 
河瀬 諒介 
松島 幸太朗 
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
