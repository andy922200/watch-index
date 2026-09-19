# Watch Index

Watch Index 將品牌官方公開的腕錶配置、各市場的在地化資訊與建議零售價整理為可維護的資料庫，並提供一個可查詢的網站。目前正式資料涵蓋勞力士與 Omega（台灣、日本、韓國）；其他品牌與市場會逐步納入。資料反映收集當下的官方公開資訊；它不是二級市場行情、門市庫存或歷年所有停產款的完整清單。

本專案分為兩個相互銜接、但職責清楚的區塊：`app/` 負責讓人查找資料，`data/` 負責保存及維護資料事實。

## App：瀏覽與查找腕錶

`app/` 是以 Vue 3 建置的靜態網站。使用者可以依市場瀏覽腕錶、搜尋系列或型號、查看錶殼與面盤描述，並切換繁中／英文及明暗色模式。

網站不直接呼叫品牌官網。建置時會把 `data/` 的原始資料整理成各市場各自的靜態 JSON，以及供單錶跨市場比較使用的精簡價格矩陣，讓網站能快速載入並避免前端自行解讀複雜的歷史資料。預設市場為台灣；市場選擇會保存在瀏覽器中，也可使用 `?market_code=JP` 這類網址參數指定市場。比較頁的退稅估算是以名目稅率、已驗證的制度條件，以及使用者宣告的稅務居住地做出的參考，不是零售商可保證的退款或二級市場成交價格。

目前網站提供繁體中文與英文兩個獨立頁面，分別位於根路徑與 `/en-us/`，以利搜尋引擎與分享服務取得正確的頁面資訊。

前端架構、日常開發、建置、測試與資料輸出格式，請見 [watch-app-guide.md](watch-app-guide.md)。

## Data：官方配置與多市場價格

`data/` 保存四類正式資料：跨市場共用的腕錶配置目錄、各市場的在地化資訊、不可回寫的價格歷史，以及來源可追溯的旅客退稅政策。Catalog、market 與 price history 使用 brand-neutral v3 Schema；每份資料以 `brandId` 識別品牌，並以品牌官方完整參考號 `reference` 組成跨品牌唯一鍵 `watchId = brandId + ":" + reference`，例如 `rolex:m126500ln-0001`。

勞力士目前涵蓋奧地利、中國、瑞士、德國、西班牙、法國、英國、香港、義大利、日本、韓國、新加坡、泰國、台灣與美國共 15 個市場，每個市場都有 1,465 筆配置資料。Omega 目前涵蓋台灣（551 個參考編號）、日本（552 個參考編號）與韓國（554 個參考編號）三個市場，跨市場聯集目錄共 554 個唯一參考編號。台灣官網顯示 TWD 價格但未說明稅別，歷史檔依既有台灣市場規則記錄為含稅 5%；日本依「總額表示」法規與官網付款頁明確文字記錄為含稅 10%；韓國官網同樣未明示稅別，依國稅廳既有函釋（價金未明示是否含稅時，視為含稅並以 10/110 反算稅額）記錄為含稅 10%。各市場的價格幣別、含稅語意與更新時間仍應以各自的價格歷史檔與 evidence 為準。

資料更新以品牌官方來源為主，並保留每次收集的觀察與驗證證據於 `data/evidence/`。市場文字不放價格，價格也不回寫舊紀錄；若官方狀態或價格改變，會以新的觀察輪次追加到歷史檔。

資料結構、收集流程、驗證標準與新增市場方式，請見 [watch-data-collection-guide.md](watch-data-collection-guide.md)。

### Schema Releases

已發布的資料契約可從 [GitHub Releases](https://github.com/andy922200/watch-index/releases) 查閱及下載；每個版本均保留原始 Schema 與 SHA-256 校驗檔。目前 catalog、market 與 price history 的正式版本是 [`data-schema-v3`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v3)，旅客退稅政策的正式版本是 [`traveler-refund-schema-v1`](https://github.com/andy922200/watch-index/releases/tag/traveler-refund-schema-v1)。

核心資料契約使用 `data-schema-vN` 版本線，三份 Schema 同步升版；旅客退稅政策則使用獨立的 `traveler-refund-schema-vN` 版本線。歷史版本以對應的 annotated tag 與 Release 為準，不會覆寫既有 tag 或附件。

## 專案導覽

```text
watch-index/
├── app/                            # 網站原始碼、測試與建置設定
├── data/
│   ├── catalog/                    # 跨市場腕錶配置目錄
│   ├── markets/                    # 各市場在地化文字與官方商品連結
│   ├── history/                    # 各市場追加式價格歷史
│   ├── traveler-refund-policies.json # 可追溯的旅客退稅政策
│   ├── evidence/                   # 每次收集的觀察與驗證證據
│   └── schemas/                    # 正式資料的 JSON Schema
├── watch-app-guide.md              # 前端專案說明
└── watch-data-collection-guide.md  # 資料收集與維護指南
```
