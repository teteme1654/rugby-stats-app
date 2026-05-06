import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
坂 和樹 
高橋 陽大 
フェインガ ・ファカイ 
星野 克之 
平野 叶翔 
マティウス ・バッソン 
吉岡 大貴 
鶴川 達彦 
藤井 拓海 
平井 建多 
テビタ ・イカニヴェレ 
當眞 蓮 
山田 生真 
小池 一宏 
肥田 晃季 
白濱 弘章 
トレヴァ ・ホゼア 
サム ・シェパード 
マーク ・アボット 
ヤンコ ・スワナポール 
西村 龍馬 
フランコ ・モスタート 
コナー ・ウィホンギ 
白坂 佑太 
中山 竜太朗 
ツポウ テビタ 
トニー ・ハント 
當眞 慶 
ワイマナ ・カパ 
楠田 知己 
宮下 晃毅 
アセリ ・マシヴォウ 
タリフォロフォラ ・タンギパ 
古田 凌 
パブロ ・マテーラ 
竹中 太一 
根塚 聖冴 
土永 雷 
北條 拓郎 
宮坂 航生 
北原 璃久 
マヌ ・ヴニポラ 
中尾 隼太 
呉 洸太 
ベン ・ポルトリッジ 
マヌ ・アカウオラ 
ラリー ・スルンガ 
テビタ ・リー 
山村 和也 
ジョニー ・ファアウリ 
フレイザー ・クワーク 
ダーウィッド ・ケラーマン 
渡邉 弐貴 
岡野 喬吾 
中 俊一朗 
山下 楽平 
FC ・デュプレッシー 
植村 陽彦 
松浦 祐太 
郡司 健吾 
レメキ ロマノラヴァ 
河井 優 
タヴァケ ・オト 
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
