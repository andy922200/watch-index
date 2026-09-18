<script setup lang="ts">
import { ArrowRight } from '@lucide/vue'
import { computed, type CSSProperties } from 'vue'
import { useI18n } from 'vue-i18n'

import AppLayout from '@/components/layout/AppLayout.vue'
import AppNav from '@/components/layout/AppNav.vue'
import { brandDirectory, isAvailableBrand } from '@/lib/brands'
import { getBrandPageLanguagePaths, getSiteIndexLanguagePaths } from '@/lib/pageUrls'
import { Locale } from '@/plugins/i18n'

const { locale, t } = useI18n()
const languagePaths = getSiteIndexLanguagePaths()

type BrandDirectoryRowStyle = CSSProperties & {
  '--directory-accent-dark': string
  '--directory-accent-light': string
}

interface BrandDirectoryRow {
  description: string
  href: string | null
  id: string
  isAvailable: boolean
  name: string
  number: string
  style: BrandDirectoryRowStyle
}

const brandRows = computed<BrandDirectoryRow[]>(() =>
  brandDirectory.map((brand, index) => ({
    description: t(brand.directory.descriptionKey),
    href: isAvailableBrand(brand)
      ? getBrandPageLanguagePaths({ brandId: brand.id, page: 'index' })[
          locale.value === Locale.enUs ? 'enUs' : 'zhTw'
        ]
      : null,
    id: brand.id,
    isAvailable: isAvailableBrand(brand),
    name: t(brand.directory.nameKey),
    number: String(index + 1).padStart(2, '0'),
    style: {
      '--directory-accent-dark': brand.directory.visual.accent.dark,
      '--directory-accent-light': brand.directory.visual.accent.light,
    },
  })),
)
</script>

<template>
  <AppLayout brand="root" :lang="locale">
    <AppNav :language-paths="languagePaths" :show-market-controls="false" />

    <section class="mt-16 w-full max-w-5xl sm:mt-24 lg:mt-32" aria-labelledby="page-title">
      <p class="text-muted-foreground text-xs font-medium tracking-[0.28em] uppercase sm:text-sm">
        {{ t('home.eyebrow') }}
      </p>
      <h1
        id="page-title"
        class="mt-5 max-w-3xl text-4xl leading-[0.95] font-semibold tracking-tight whitespace-pre-line sm:text-6xl lg:text-7xl"
      >
        {{ t('home.title') }}
      </h1>
    </section>

    <section
      class="mt-20 w-full max-w-5xl sm:mt-28 lg:mt-36"
      aria-labelledby="brand-directory-title"
    >
      <h2 id="brand-directory-title" class="sr-only">{{ t('home.brandDirectoryHeading') }}</h2>
      <div
        v-for="brand in brandRows"
        :key="brand.id"
        :data-brand-id="brand.id"
        :style="brand.style"
        class="[--directory-accent:var(--directory-accent-light)] dark:[--directory-accent:var(--directory-accent-dark)]"
      >
        <a
          v-if="brand.isAvailable && brand.href"
          :href="brand.href"
          class="group border-foreground/30 focus-visible:ring-offset-background relative block cursor-pointer py-9 pr-5 pl-6 transition duration-300 ease-out outline-none hover:translate-x-1 hover:bg-[color-mix(in_oklab,var(--directory-accent)_8%,transparent)] focus-visible:translate-x-1 focus-visible:bg-[color-mix(in_oklab,var(--directory-accent)_10%,transparent)] focus-visible:ring-2 focus-visible:ring-[var(--directory-accent)] focus-visible:ring-offset-4 sm:py-12 sm:pr-7 sm:pl-8"
        >
          <span
            class="absolute inset-y-0 left-0 w-px bg-[var(--directory-accent)] transition-[width] duration-300 ease-out group-hover:w-1 group-focus-visible:w-1"
            aria-hidden="true"
          />
          <div class="grid gap-7 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-6">
            <span class="font-mono text-xs tracking-widest text-[var(--directory-accent)]">{{
              brand.number
            }}</span>
            <div class="min-w-0">
              <p
                class="text-3xl font-medium tracking-tight uppercase group-hover:translate-x-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out sm:text-4xl lg:text-5xl"
              >
                {{ brand.name }}
              </p>
              <p class="text-muted-foreground group-hover:text-foreground mt-4 max-w-md text-base">
                {{ brand.description }}
              </p>
            </div>
            <ArrowRight
              class="size-7 self-start text-[var(--directory-accent)] group-hover:translate-x-2 motion-safe:transition-transform motion-safe:duration-300 motion-safe:ease-out"
              aria-hidden="true"
            />
          </div>
        </a>
        <div
          v-else
          class="border-foreground/30 relative py-9 pr-5 pl-6 opacity-60 sm:py-12 sm:pr-7 sm:pl-8"
          aria-disabled="true"
        >
          <span
            class="absolute inset-y-0 left-0 w-px bg-[var(--directory-accent)]"
            aria-hidden="true"
          />
          <div class="grid gap-7 sm:grid-cols-[4rem_minmax(0,1fr)_auto] sm:gap-6">
            <span class="font-mono text-xs tracking-widest text-[var(--directory-accent)]">{{
              brand.number
            }}</span>
            <div class="min-w-0">
              <p class="text-3xl font-medium tracking-tight uppercase sm:text-4xl lg:text-5xl">
                {{ brand.name }}
              </p>
              <p class="text-muted-foreground mt-4 max-w-md text-base">{{ brand.description }}</p>
            </div>
            <p class="text-muted-foreground text-xs font-medium tracking-[0.18em] uppercase">
              {{ t('home.comingSoon') }}
            </p>
          </div>
        </div>
      </div>
    </section>
  </AppLayout>
</template>
