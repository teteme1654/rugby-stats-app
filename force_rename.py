import os
import re

# ==========================================
# ▼ ここにExcelの名前リストをコピペしてください ▼
# ==========================================
raw_names = """
ピーター ・ショルツ
淺岡 俊亮
蔡 唯志
安 昌豪
津嘉山 廉人
シンクル 寛造
蜂谷 元紹
石井 智亮
森本 潤
坂本 駿介
安恒 直人
古寺 直希
李 承爀
宮里 侑樹
佐川 奨茉
ギディオン ・コーヘレンバーグ
山極 大貴
エピネリ ・ウルイヴァイティ
松本 光貴
ウォルト ・スティーンカンプ
佐藤 弘樹
坂本 侑翼
鶴谷 昌隆
趙 誠悠
服部 航大
吉田 杏
フリードル ・オリヴィエー
栗田 文介
セル ホゼ
ジャクソン ・ヘモポ
マリノ ・ミカエリトゥウ
吉岡 義喜
中森 隆太
岩村 昂太
ジャック ・ストラトン
ブラッド ・ウェバー
川原 大
チャーリー ・ティトコム
三宅 駿
山下 真之介
ジェームス ・グレイソン
ダウリング タイ
佐々木 陽有
加島 DJ
タウモハパイ ホネティ
セミシ ・マシレワ
ルカニョ ・アム
ハニテリ ・ヴァイレア
ジョアペ ・ナコ
チャーリー ・ローレンス
三島 琳久
マット ・ヴァエガ
杉浦 拓実
トニシオ バイフ
平 翔太
小泉 怜史
吉本 匠希
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
        # スペースを削除（日本語名を連結）
        clean_player_name = re.sub(r'\s+', '', names[i])
        new_name = clean_player_name + ext
        
        try:
            os.rename(old_path, new_name)
            print(f"[OK] {old_path} -> {new_name}")
        except Exception as e:
            print(f"[ERROR] {old_path} -> {new_name}: {e}")

    print("\n完了！")

if __name__ == "__main__":
    main()
