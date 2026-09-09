import { createHash } from 'node:crypto'
import { readFileSync } from 'node:fs'
import { fileURLToPath, URL } from 'node:url'

import tailwindcss from '@tailwindcss/vite'
import vue from '@vitejs/plugin-vue'
import { loadEnv } from 'vite'
import { createMpaPlugin } from 'vite-plugin-virtual-mpa'
import { defineConfig } from 'vitest/config'

import { useHttpsConfig } from './src/composables/useHttpsConfig.ts'
import { brands } from './src/lib/brands.ts'
import { createMpaConfig } from './src/lib/mpa-build.ts'

export const ghPagesRepoName = 'watch-index'
export const ghPagesNamespace = 'app'
export const base = '/'
export const ghPagesBase = `/${ghPagesRepoName}/${ghPagesNamespace}/`

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isViteEnvProd = env.VITE_BUILD_ENV === 'prod'
  // 目前只有一個品牌，故沿用單一雜湊值；新增品牌時應改為逐品牌各算一份。
  const hashSourceHash = createHash('sha256')
  for (const relativePath of brands[0].hashSourceFiles) {
    hashSourceHash.update(
      readFileSync(fileURLToPath(new URL(`../${relativePath}`, import.meta.url))),
    )
  }
  const watchDataVersion = hashSourceHash.digest('hex').slice(0, 12)

  const activeBase = isViteEnvProd ? ghPagesBase : base
  const { pages, rewrites } = createMpaConfig({
    isProd: isViteEnvProd,
    base: activeBase,
    ghPagesRepoName,
    ghPagesNamespace,
    brands,
  })

  return {
    base: activeBase,
    define: {
      __WATCH_DATA_VERSION__: JSON.stringify(watchDataVersion),
    },
    plugins: [
      vue(),
      tailwindcss(),
      createMpaPlugin({
        template: 'watch.html',
        pages,
        rewrites,
        previewRewrites: rewrites,
      }),
    ],
    resolve: {
      alias: {
        '@': fileURLToPath(new URL('./src', import.meta.url)),
      },
    },
    server: {
      port: 5199,
      https: useHttpsConfig() || undefined,
    },
    test: {
      environment: 'jsdom',
      setupFiles: './src/tests/vitest/setup.ts',
      include: ['./src/tests/vitest/**/*.{spec,test}.ts'],
      coverage: {
        provider: 'v8',
        reporter: ['text', 'json', 'html'],
      },
    },
  }
})
