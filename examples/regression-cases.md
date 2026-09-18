# 歷史回歸案例

本檔案是 [ai-data-maintenance-guide.md](../ai-data-maintenance-guide.md)「完整性停止條件與抽查」章節所指的具體案例集合，套用範圍與限制以該章節為準：每筆案例只用來辨識回歸或擷取異常，不是後續驗收的筆數目標。日後結果不同時，檢查官方增減、差集與擷取問題，禁止補造或刪除資料以湊成案例中的數字。

新增品牌／市場的回歸基準時，比照下列格式在本檔案附加新的 `##` 小節，不覆寫既有案例。

## Rolex — 日本（JP）2026-09-01

日本完成全部載入後有 1,465 個唯一完整配置、17 個系列；初始局部擷取為 56 筆，補齊後新增 1,409 個價格基準點。完整批次時間為 `2026-09-01T17:06:44+09:00`。

當時系列拆分為：1908 8、Land-Dweller 10、Day-Date 281、Sky-Dweller 39、Lady-Datejust 291、Datejust 681、Oyster Perpetual 62、Cosmograph Daytona 47、Submariner 7、Sea-Dweller 2、Deepsea 4、GMT-Master II 13、Yacht-Master 12、Yacht-Master II 2、Explorer 3、Explorer II 2、Air-King 1。
