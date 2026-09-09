# Watch Index 前端專案指南

本文件說明 `app/` 網站的用途、架構與日常開發方式。資料收集、正式資料契約與驗證規範請見 [watch-data-collection-guide.md](watch-data-collection-guide.md)。

## 這個網站做什麼

網站將 `data/` 中的腕錶資料呈現為可瀏覽的索引。目前網站顯示的正式資料僅來自勞力士；前端應維持品牌可擴充性，以支援日後加入其他品牌。使用者可：

- 在台灣、香港、新加坡、日本、奧地利、德國、瑞士、英國與美國之間切換市場。
- 以系列名稱、型號、完整配置碼與俗稱搜尋腕錶；搜尋輸入會短暫延遲，並提供系列與錶款建議。
- 查看腕錶圖片、型號、當地建議零售價與俗稱；開啟詳細視窗可讀取錶殼與面盤描述。
- 切換繁體中文／英文與明暗色模式。

預設市場是台灣。市場選擇會寫入瀏覽器的 `localStorage`；網址加入 `?market_code=JP` 等有效代碼時，會優先採用網址指定的市場。

## 技術與目錄

網站使用 Vue 3、TypeScript、Vite、Tailwind CSS 與 shadcn-vue／Reka UI 元件。測試採 Vitest 與 Playwright。

```text
app/
├── src/
│   ├── pages/                       # 主頁、搜尋邏輯與詳細資料視窗
│   ├── components/                  # 導覽、搜尋框與共用 UI 元件
│   ├── composables/                 # 資料載入、深色模式與共用請求邏輯
│   ├── locales/                     # 繁中、英文介面字串
│   ├── lib/                         # 市場、資料驗證與多頁輸出設定
│   └── types/                       # 前端資料型別
├── scripts/generate-watch-data.mjs  # 由 data/ 產生網站用靜態資料
├── [page].html                      # 多頁網站的 HTML 範本
├── vite.config.ts                   # Vite、路徑與測試設定
└── playwright.config.ts             # 端對端測試設定
```

## 畫面與資料流程

```text
data/catalog + data/markets + data/history
                    ↓ 建置時轉換
app/public/watch-data/ 或 app/dist/watch-data/
                    ↓ 瀏覽器先讀取 manifest.json
市場專用 catalog.<hash>.json
                    ↓ 驗證格式後
Vue 頁面、搜尋、清單與詳細視窗
```

`scripts/generate-watch-data.mjs` 會將共用配置、單一市場的在地文字與該市場最後一個價格狀態合併成前端資料。輸出檔以內容雜湊命名，`manifest.json` 負責指向各市場目前版本；資料更新時網址隨內容改變，可安全使用快取。

資料載入前會檢查 manifest 與 catalog 的必要欄位。若市場資料缺少任一配置、價格歷史或必要文字，產生流程會失敗，而不是發布部分資料。

## 語言、網址與部署

網站以多頁方式輸出兩個獨立 HTML：繁中預設頁在 `/`，英文頁在 `/en-us/`。語言由網址路徑決定，而非單純在瀏覽器內切換，讓不執行 JavaScript 的搜尋與分享服務也能取得相應的標題、描述與 Open Graph 資訊。

正式環境使用 GitHub Pages 的 `/<儲存庫名稱>/app/rolex/` 基底路徑；本機開發則使用 `/rolex/`。這些路徑與語言頁的重寫規則都集中在 `src/lib/mpa-build.ts` 和 `vite.config.ts`，調整儲存庫名稱或部署位置時應一併檢查。

## 開始開發

前提是 Node.js `>=24.20.0` 與 npm `>=11.19.0`；專案使用 pnpm。從專案根目錄執行：

```bash
pnpm --dir app install
pnpm --dir app dev
```

開發伺服器啟動前會先產生 `app/public/watch-data/`，因此先確認 `data/` 的三類正式資料完整。預設連接埠為 `5199`。若使用者目錄下存在 `localhost-key.pem` 與 `localhost.pem`，開發伺服器會自動啟用 HTTPS；沒有憑證時會使用 HTTP 並顯示提示。

## 常用指令

以下指令在 `app/` 目錄執行：

```bash
pnpm dev             # 產生開發資料並啟動 Vite
pnpm build           # 型別檢查、正式網站建置與正式資料輸出
pnpm build:watch-data # 只重新產生網站用資料
pnpm type-check      # 使用 vue-tsc 進行型別檢查
pnpm test:vitest     # 執行單元與元件測試
pnpm test:e2e        # 執行 Playwright 端對端測試
```

`lint` 目前帶有 `--fix`，會直接改寫檔案；執行前請先確認工作區沒有不想混入的修改。

## 維護建議

- 新增或調整市場時，同步更新 `src/lib/markets.ts`、介面翻譯與資料層；市場代碼必須也存在於建置後的 manifest。
- 新增品牌前，確認前端資料型別、搜尋索引、頁面文案與資料產生流程能辨識品牌，而不會把現有勞力士的型號規則或顯示文字套用到其他品牌。
- 修改前端資料欄位時，同步調整 `src/types/watch-data.ts`、`src/lib/watchDataValidation.ts` 與產生腳本，並補上測試。
- 搜尋功能的規則與頁面狀態位於 `src/pages/` 的產品頁目錄；修改搜尋行為時請測試鍵盤操作與無結果狀態。
- 網站顯示的是每個市場價格歷史中的最後一個狀態，而非自行計算或換匯後的價格。資料語意有變更時，先依資料指南更新正式資料與證據。
- 正式建置前至少執行 `pnpm build`；變更互動、導覽、語言或市場切換時，也應執行相應的 Vitest 與 Playwright 測試。
