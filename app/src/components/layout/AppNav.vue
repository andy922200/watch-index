<script setup lang="ts">
import { Ellipsis, Moon, Sun } from '@lucide/vue'
import { computed } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useDarkMode } from '@/composables/useDarkMode'
import { DEFAULT_MARKET, type MarketCode, marketOptions } from '@/lib/markets'
import { Locale } from '@/plugins/i18n'

interface LanguageLink {
  code: (typeof Locale)[keyof typeof Locale]
  href: string
}

const { t, locale } = useI18n()
const market = defineModel<MarketCode>('market', { default: DEFAULT_MARKET })
const queryString = window.location.search

const languageLinks = computed<LanguageLink[]>(() => [
  { code: Locale.zhTw, href: `${import.meta.env.BASE_URL}${queryString}` },
  { code: Locale.enUs, href: `${import.meta.env.BASE_URL}en-us/${queryString}` },
])

const navigateToLocale = (
  value: string | number | bigint | Record<string, unknown> | null,
): void => {
  if (value !== Locale.enUs && value !== Locale.zhTw) {
    return
  }

  const option = languageLinks.value.find((language) => language.code === value)

  if (option && option.code !== locale.value) {
    window.location.assign(option.href)
  }
}

const { isDark, toggleDark } = useDarkMode()
</script>

<template>
  <nav
    class="sticky top-0 z-50 flex w-full items-center justify-end gap-2 bg-stone-100/95 px-4 py-3 backdrop-blur dark:bg-stone-950/95"
  >
    <Select v-model="market">
      <SelectTrigger class="w-36" :aria-label="t('site.marketLabel')">
        <SelectValue :placeholder="t('site.market.taiwan')" />
      </SelectTrigger>
      <SelectContent class="max-h-56">
        <SelectGroup>
          <SelectItem v-for="option in marketOptions" :key="option.code" :value="option.code">
            <span class="flex items-center gap-2">
              <span aria-hidden="true">{{ option.flag }}</span>
              {{ t(option.labelKey) }}
            </span>
          </SelectItem>
        </SelectGroup>
      </SelectContent>
    </Select>
    <div class="hidden lg:block">
      <Select :model-value="locale" @update:model-value="navigateToLocale">
        <SelectTrigger class="w-32" :aria-label="t('site.languageLabel')">
          <SelectValue :placeholder="t(`site.language.${locale}`)" />
        </SelectTrigger>
        <SelectContent>
          <SelectGroup>
            <SelectItem v-for="option in languageLinks" :key="option.code" :value="option.code">
              {{ t(`site.language.${option.code}`) }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
    </div>
    <button
      type="button"
      class="hidden rounded-sm border border-stone-400 bg-white p-2 text-stone-950 shadow-sm transition outline-none hover:cursor-pointer focus:ring-2 focus:ring-stone-950 lg:inline-flex dark:border-stone-600 dark:bg-stone-900 dark:text-stone-100 dark:focus:ring-stone-100"
      :aria-label="isDark ? t('site.darkMode.switchToLight') : t('site.darkMode.switchToDark')"
      @click="toggleDark()"
    >
      <Sun v-if="isDark" class="size-4" aria-hidden="true" />
      <Moon v-else class="size-4" aria-hidden="true" />
    </button>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button class="lg:hidden" size="icon" variant="outline" :aria-label="t('site.moreLabel')">
          <Ellipsis aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-48 lg:hidden" align="end">
        <DropdownMenuLabel>{{ t('site.languageLabel') }}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup :model-value="locale" @update:model-value="navigateToLocale">
            <DropdownMenuRadioItem
              v-for="option in languageLinks"
              :key="option.code"
              class="cursor-pointer"
              :value="option.code"
            >
              {{ t(`site.language.${option.code}`) }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem class="cursor-pointer" @select="toggleDark()">
            <Sun v-if="isDark" aria-hidden="true" />
            <Moon v-else aria-hidden="true" />
            {{ isDark ? t('site.darkMode.switchToLight') : t('site.darkMode.switchToDark') }}
          </DropdownMenuItem>
        </DropdownMenuGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  </nav>
</template>
