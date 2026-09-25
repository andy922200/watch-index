# 歷史回歸案例

本檔案是 [ai-data-maintenance-guide.md](../ai-data-maintenance-guide.md)「完整性停止條件與抽查」章節所指的具體案例集合，套用範圍與限制以該章節為準：每筆案例只用來辨識回歸或擷取異常，不是後續驗收的筆數目標。日後結果不同時，檢查官方增減、差集與擷取問題，禁止補造或刪除資料以湊成案例中的數字。

新增品牌／市場的回歸基準時，比照下列格式在本檔案附加新的 `##` 小節，不覆寫既有案例。

## Rolex — 日本（JP）2026-09-01

日本完成全部載入後有 1,465 個唯一完整配置、17 個系列；初始局部擷取為 56 筆，補齊後新增 1,409 個價格基準點。完整批次時間為 `2026-09-01T17:06:44+09:00`。

當時系列拆分為：1908 8、Land-Dweller 10、Day-Date 281、Sky-Dweller 39、Lady-Datejust 291、Datejust 681、Oyster Perpetual 62、Cosmograph Daytona 47、Submariner 7、Sea-Dweller 2、Deepsea 4、GMT-Master II 13、Yacht-Master 12、Yacht-Master II 2、Explorer 3、Explorer II 2、Air-King 1。

## Omega — 美國（US）2026-09-20

美國完成全部 16 個分類載入後有 548 個唯一完整配置，四大系列官方總數分別為 Seamaster 203、Speedmaster 95、Constellation 128、De Ville 122。完整批次時間為 `2026-09-20T14:59:49.952Z`。

分類拆分為：seamaster/aqua-terra-150m 107、seamaster/diver-300-m 60、seamaster/planet-ocean 18、seamaster/heritage-models 17、seamaster/instruments 1、speedmaster/moonwatch-professional 24、speedmaster/heritage-models 16、speedmaster/dark-side-of-the-moon 8、speedmaster/speedmaster-38-mm 11、speedmaster/two-counters 36、constellation/observatory 9、constellation/constellation 119、de-ville/ladymatic 6、de-ville/tresor 32、de-ville/prestige 82、de-ville/tourbillon 2。另外官方 Watchfinder 視圖比四系列多出 4 筆 Specialities（含 3 款懷錶），未納入本輪正式資料，屬待統籌者裁量的範圍擴充議題，詳見 `data/evidence/omega/US/2026-09-20/collection-summary.json`。

## Omega — 德國（DE）2026-09-20

德國完成全部 16 個分類載入後有 552 個唯一完整配置，四大系列官方總數分別為 Seamaster 201、Speedmaster 95、Constellation 128、De Ville 128。完整批次時間為 `2026-09-20T15:20:45.681Z`。

分類拆分為：seamaster/aqua-terra-150m 107、seamaster/diver-300-m 59、seamaster/planet-ocean 17、seamaster/heritage-models 17、seamaster/instruments 1、speedmaster/moonwatch-professional 24、speedmaster/heritage-models 16、speedmaster/dark-side-of-the-moon 8、speedmaster/speedmaster-38-mm 11、speedmaster/two-counters 36、constellation/observatory 9、constellation/constellation 119、de-ville/ladymatic 6、de-ville/tresor 38、de-ville/prestige 82、de-ville/tourbillon 2。與瑞士／香港既有市場相比，de-ville/ladymatic 在德國為 6 款（CH／HK 為 3 款），為真實市場差異，非擷取錯誤。

## Longines — 台灣（TW）2026-09-24

台灣完成官方「腕錶」分類 ProductList GraphQL 全部 23 頁（每頁 24 筆，第 23 頁 16 筆）後有 544 個唯一完整配置，第 24 頁官方回傳超出可用頁數錯誤。完整批次時間為 `2026-09-24T15:18:10.629Z`。

五大家族官方總數為 Master 110、Conquest 164、Spirit 53、Elegance 155、Heritage 62。30 個子系列中較大者為 conquest/conquest 82、master/master-collection 67、conquest/hydroconquest 57、elegance/primaluna 39、elegance/dolcevita 36；完整拆分見 `data/evidence/longines/TW/2026-09-24/collection-summary.json`。參考號含英數後綴（如 `L5.512.4.71.A`），不可假設全為數字。
