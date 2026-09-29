# Watch Index

Watch Index 將品牌官方公開的腕錶配置、各市場的在地化資訊與建議零售價整理為可維護的資料庫，並提供一個可查詢的網站。目前正式資料涵蓋勞力士、Omega 與 Longines，各品牌涵蓋的市場見下方「[Data：官方配置與多市場價格](#data官方配置與多市場價格)」的表格；其他品牌與市場會逐步納入。資料反映收集當下的官方公開資訊；它不是二級市場行情、門市庫存或歷年所有停產款的完整清單。

本專案分為兩個相互銜接、但職責清楚的區塊：`app/` 負責讓人查找資料，`data/` 負責保存及維護資料事實。

## App：瀏覽與查找腕錶

`app/` 是以 Vue 3 建置的靜態網站。使用者可以依市場瀏覽腕錶、搜尋系列或型號、查看錶殼與面盤描述，並切換繁中／英文及明暗色模式。

網站不直接呼叫品牌官網。建置時會把 `data/` 的原始資料整理成各市場各自的靜態 JSON，以及供單錶跨市場比較使用的精簡價格矩陣，讓網站能快速載入並避免前端自行解讀複雜的歷史資料。預設市場為台灣；市場選擇會保存在瀏覽器中，也可使用 `?market_code=JP` 這類網址參數指定市場。比較頁的退稅估算是以名目稅率、已驗證的制度條件，以及使用者宣告的稅務居住地做出的參考，不是零售商可保證的退款或二級市場成交價格。

目前網站提供繁體中文與英文兩個獨立頁面，分別位於根路徑與 `/en-us/`，以利搜尋引擎與分享服務取得正確的頁面資訊。

前端架構、日常開發、建置、測試與資料輸出格式，請見 [watch-app-guide.md](watch-app-guide.md)。

## Data：官方配置與多市場價格

`data/` 保存四類正式資料：跨市場共用的腕錶配置目錄、各市場的在地化資訊、不可回寫的價格歷史，以及來源可追溯的旅客退稅政策。Catalog、market 與 price history 使用 brand-neutral Schema，各自維護獨立的 `schemaVersion`（見下方「[Schema Releases](#schema-releases)」）；每份資料以 `brandId` 識別品牌，並以品牌官方完整參考號 `reference` 組成跨品牌唯一鍵 `watchId = brandId + ":" + reference`，例如 `rolex:m126500ln-0001`。

各品牌目前涵蓋的市場與配置筆數（唯一參考編號數）如下，「—」表示尚未收錄：

| 市場 | 代碼 | 勞力士 | Omega | Longines |
| --- | --- | ---: | ---: | ---: |
| 台灣 | TW | 1,465 | 551 | 544 |
| 中國 | CN | 1,465 | 579 | — |
| 香港 | HK | 1,465 | 551 | 493 |
| 新加坡 | SG | 1,465 | — | 755 |
| 日本 | JP | 1,465 | 552 | 612 |
| 韓國 | KR | 1,465 | 554 | 456 |
| 泰國 | TH | 1,465 | — | — |
| 奧地利 | AT | 1,465 | 552 | — |
| 德國 | DE | 1,465 | 552 | 804 |
| 法國 | FR | 1,465 | 552 | 776 |
| 義大利 | IT | 1,465 | 552 | — |
| 西班牙 | ES | 1,465 | 552 | — |
| 瑞士 | CH | 1,465 | 552 | 805 |
| 英國 | GB | 1,465 | 549 | 806 |
| 美國 | US | 1,465 | 548 | 802 |
| **市場數** | | **15** | **13** | **10** |
| **跨市場聯集目錄** | | **1,465** | **586** | **881** |

Longines 已加入網站頁面，可在台灣、香港、新加坡、日本、韓國、德國、法國、瑞士、英國與美國共 10 個市場之間切換。這些市場均已有正式資料，並由現有資料產生流程輸出對應的前端 catalog。

資料更新以品牌官方來源為主，並保留每次收集的觀察與驗證證據於 `data/evidence/`。市場文字不放價格，價格也不回寫舊紀錄；若官方狀態或價格改變，會以新的觀察輪次追加到歷史檔。

資料結構、收集流程、驗證標準與新增市場方式，請見 [watch-data-collection-guide.md](watch-data-collection-guide.md)。

### Schema Releases

已發布的資料契約可從 [GitHub Releases](https://github.com/andy922200/watch-index/releases) 查閱及下載；每個版本均保留原始 Schema 與 SHA-256 校驗檔。

核心資料契約（catalog、market、price history）使用 `data-schema-vN` 發布線。三份 Schema 的 `schemaVersion` 各自獨立，只有契約實際改變的那一份才會升版；`data-schema-vN` 的 N 則是**發布序號**，只要任一份 Schema 升版就遞增，因此 N 不一定等於各 Schema 的 `schemaVersion`。每個 Release 說明都會列出當次三份 Schema 的版本。旅客退稅政策使用獨立的 `traveler-refund-schema-vN` 發布線。歷史版本以對應的 annotated tag 與 Release 為準，不會覆寫既有 tag 或附件。

| 發布 | Catalog | Market | Price history | 原始生效日 | 說明 |
| --- | :---: | :---: | :---: | --- | --- |
| [`data-schema-v1`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v1) | 1 | 1 | 1 | 2026-09-02 | 初版，僅涵蓋勞力士 |
| [`data-schema-v2`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v2) | 2 | 2 | 2 | 2026-09-10 | 新增 `brandId`（v2 Schema 仍接受 v1 資料） |
| [`data-schema-v3`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v3) | 3 | 3 | 3 | 2026-09-17 | 改為 brand-neutral，並以官方完整參考號組成 `watchId` |
| [`data-schema-v4`](https://github.com/andy922200/watch-index/releases/tag/data-schema-v4) | 4 | 4 | 4 | 2026-09-28 | 已發布的最新版本 |
| `data-schema-v5` | 5 | 4 | 4 | — | 尚未發布；catalog 新增必填的 `dialColors` 錶盤標準色 |

旅客退稅政策的正式版本是 [`traveler-refund-schema-v1`](https://github.com/andy922200/watch-index/releases/tag/traveler-refund-schema-v1)。

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
