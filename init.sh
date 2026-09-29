#!/usr/bin/env bash
# 準備 Watch Index 前端的本機執行環境，供人類與各 AI 代理在開工前執行。
#
# 用法：
#   ./init.sh          檢查環境、安裝依賴、產生 app/public/watch-data/
#   ./init.sh --dev    完成上述步驟後啟動開發伺服器（會持續執行）
#
# 不會修改 data/ 內任何正式資料，也不會執行 lint（lint 帶有 --fix，會改寫檔案）。
set -euo pipefail

repo_root="$(git rev-parse --show-toplevel 2>/dev/null || pwd)"
app_dir="${repo_root}/app"

start_dev=false

if [[ "${1:-}" == "--dev" ]]; then
  start_dev=true
elif [[ -n "${1:-}" ]]; then
  echo "Usage: $0 [--dev]" >&2
  exit 2
fi

# package.json engines.node 的最低版本。
required_node_major=24
required_node_minor=20

if [[ ! -f "${app_dir}/package.json" ]]; then
  echo "Error: missing ${app_dir}/package.json" >&2
  exit 1
fi

if ! command -v node >/dev/null 2>&1; then
  echo "Error: node is not installed (need >=${required_node_major}.${required_node_minor}.0)." >&2
  exit 1
fi

if ! command -v pnpm >/dev/null 2>&1; then
  echo "Error: pnpm is not installed." >&2
  exit 1
fi

node_version="$(node -v)"
node_version="${node_version#v}"
node_major="${node_version%%.*}"
node_rest="${node_version#*.}"
node_minor="${node_rest%%.*}"

if (( node_major < required_node_major )) ||
  (( node_major == required_node_major && node_minor < required_node_minor )); then
  echo "Error: node ${node_version} is too old (need >=${required_node_major}.${required_node_minor}.0)." >&2
  exit 1
fi

echo "OK:     node ${node_version}, pnpm $(pnpm -v)"

# 開發模式（vite --mode dev.local）會讀取此檔；它被 .gitignore 排除，全新 clone 不會有。
dev_env_file="${app_dir}/.env.dev.local"

if [[ ! -f "${dev_env_file}" ]]; then
  printf 'VITE_BUILD_ENV=dev-local\n' > "${dev_env_file}"
  echo "Created: app/.env.dev.local"
else
  echo "OK:     app/.env.dev.local"
fi

echo "Installing dependencies..."
pnpm --dir "${app_dir}" install --frozen-lockfile

# 若 data/ 不完整，產生流程會失敗而不是發布部分資料，這裡的失敗代表資料本身有問題。
echo "Generating app/public/watch-data/ from data/..."
pnpm --dir "${app_dir}" run build:watch-data -- --output-directory public/watch-data

echo
echo "Environment is ready. Common commands (run from app/):"
echo "  pnpm type-check       型別檢查"
echo "  pnpm exec vitest run  單次執行單元與元件測試"
echo "  pnpm test:e2e         Playwright 端對端測試"
echo "  pnpm build            型別檢查、正式建置與資料輸出"

if [[ "${start_dev}" == true ]]; then
  echo
  echo "Starting dev server (default port 5199)..."
  exec pnpm --dir "${app_dir}" dev
fi
