import { createHash } from 'node:crypto'
import { readdirSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'
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

const getFilesRecursively = (directory: string): string[] =>
  readdirSync(directory, { withFileTypes: true })
    .sort((left, right) => left.name.localeCompare(right.name))
    .flatMap((entry) => {
      const path = resolve(directory, entry.name)

      return entry.isDirectory() ? getFilesRecursively(path) : [path]
    })

const getWatchDataHashSources = (): string[] => {
  const projectDirectory = fileURLToPath(new URL('..', import.meta.url))
  const sourceDirectories = ['data/catalog', 'data/history', 'data/markets', 'data/schemas'].map(
    (directory) => resolve(projectDirectory, directory),
  )

  return [
    ...sourceDirectories.flatMap(getFilesRecursively),
    resolve(projectDirectory, 'data/traveler-refund-policies.json'),
    fileURLToPath(new URL('./scripts/generate-watch-data.mjs', import.meta.url)),
  ].sort()
}

export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '')
  const isViteEnvProd = env.VITE_BUILD_ENV === 'prod'
  const hashSourceHash = createHash('sha256')
  for (const sourcePath of getWatchDataHashSources()) {
    hashSourceHash.update(readFileSync(sourcePath))
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
