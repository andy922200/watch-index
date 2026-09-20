# `.agents/roles/` 維護說明

本目錄是 Watch Index 專案 AI 角色（agent role）的**唯一權威來源（canonical source）**。所有角色定義只能在這裡新增或修改，`.claude/agents/` 與 `.codex/agents/` 下的檔案都是由本目錄衍生出來的，**不可手動編輯**。

本檔案（`README.md`）本身不是角色定義，`scripts/sync-agents.sh` 會略過它；新增其他非角色定義的說明檔時，檔名同樣要避開會被腳本當成角色掃描的 `*.md` glob，或另外在腳本加上排除規則。

## 三個目錄的關係

| 目錄 | 內容 | 關係 |
| --- | --- | --- |
| `.agents/roles/*.md` | 角色定義本體（frontmatter + 指令內容） | 唯一權威來源 |
| `.claude/agents/*.md` | 對應到 `.agents/roles/*.md` 的相對路徑 symlink | 讓 Claude Code 辨識為可用 subagent |
| `.codex/agents/*.toml` | 由 `scripts/sync-agents.sh` 自動產生的轉接檔 | 讓 Codex CLI 讀取，內容只指向對應的 `.agents/roles/*.md` |

`.codex/agents/*.toml` 之所以不能用 symlink，是因為 Codex CLI 需要 TOML 格式，且需要 `developer_instructions` 欄位明確告知「先讀 `AGENTS.md`，再讀對應的 canonical role file」，不能直接指向 Markdown 檔。

## 新增或修改角色的流程

1. 只在 `.agents/roles/` 新增或修改 `.md` 檔。
2. frontmatter 必須包含：
   - `name`：**必須與檔名（去掉 `.md`）完全相同**，例如 `single-market-maintainer.md` 的 `name` 必須是 `single-market-maintainer`。
   - `description`：一行角色用途說明，供 Claude Code 的 agent 選單顯示。
3. 本文內容遵循既有角色檔的結構：先列出執行前必讀文件、任務應提供的資訊、執行原則（含 evidence 保存、不得覆寫價格歷史、不得猜測補造資料等），並在結尾註明「若本角色指令與 `AGENTS.md` 衝突，以 `AGENTS.md` 為準」。
4. 修改完成後執行同步腳本：

   ```bash
   scripts/sync-agents.sh
   ```

   這會建立/修復 `.claude/agents/` 的 symlink，並重新產生 `.codex/agents/*.toml`。

5. 提交前建議先跑檢查模式確認三者同步、不遺漏：

   ```bash
   scripts/sync-agents.sh --check
   ```

   若輸出 `DRIFT:` 開頭的訊息，代表尚未同步，需重新執行步驟 4。

## 刪除角色

刪除 `.agents/roles/*.md` 後，需手動移除對應的 `.claude/agents/*.md`（symlink）與 `.codex/agents/*.toml`（腳本目前只負責新增/更新，不會自動清除已刪除角色的衍生檔）。

## 注意事項

- 不要直接編輯或刪除 `.claude/agents/*.md`、`.codex/agents/*.toml`——下次執行 `scripts/sync-agents.sh` 時，symlink 會被腳本覆蓋修復；toml 檔手動修改的內容則會在下次同步時被覆蓋遺失。
- 若 `.claude/agents/` 下出現「存在但不是 symlink」的同名檔案，腳本會跳過並印出 `Skip:` 訊息，不會覆蓋——需人工確認該檔案是否為誤植的實體檔後再處理。
- 角色定義涉及資料維護行為時，仍須遵守 `AGENTS.md` 的變更規則（例如：修改資料前先檢查工作區、evidence 需先於資料修改保存、不得覆寫舊價格點等）。
