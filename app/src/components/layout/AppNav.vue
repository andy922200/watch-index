<script setup lang="ts">
import { GitFork, Menu, Moon, Sun } from '@lucide/vue'
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
import { DEFAULT_DISPLAY_CURRENCY } from '@/lib/displayCurrencies'
import { DEFAULT_MARKET, type MarketCode, marketOptions } from '@/lib/markets'
import { toLanguagePathname } from '@/lib/pageRoutes'
import { Locale, type LocaleCode } from '@/plugins/i18n'

interface LanguageLink {
  code: LocaleCode
  href: string
}

interface LanguagePaths {
  enUs: string
  zhTw: string
}

interface Props {
  displayCurrencies: readonly string[]
  languagePaths?: LanguagePaths
}

const REPOSITORY_URL = 'https://github.com/andy922200/watch-index'
const DONATE_URL = 'https://ko-fi.com/smlpoints'

const { t, locale } = useI18n()
const props = defineProps<Props>()
const market = defineModel<MarketCode>('market', { default: DEFAULT_MARKET })
const displayCurrency = defineModel<string>('displayCurrency', {
  default: DEFAULT_DISPLAY_CURRENCY,
})
/**
 * 語言切換連結的路徑。頁面通常會透過 `languagePaths` 明確傳入（由 `pageUrls.ts` 依
 * 品牌與頁面種類組出）；未傳入時才退回以目前網址推導，兩條路徑都以 `pageRoutes.ts`
 * 的語言路徑段規則為準。
 */
const getLanguagePath = (language: LocaleCode): string => {
  const providedPath =
    language === Locale.enUs ? props.languagePaths?.enUs : props.languagePaths?.zhTw

  return providedPath ?? toLanguagePathname({ pathname: window.location.pathname, language })
}

const getLanguageHref = (language: LocaleCode): string =>
  `${getLanguagePath(language)}${window.location.search}`

const languageLinks = computed<LanguageLink[]>(() => [
  { code: Locale.zhTw, href: getLanguageHref(Locale.zhTw) },
  { code: Locale.enUs, href: getLanguageHref(Locale.enUs) },
])

const navigateToLocale = (
  value: string | number | bigint | Record<string, unknown> | null,
): void => {
  if (value !== Locale.enUs && value !== Locale.zhTw) {
    return
  }

  const option = languageLinks.value.find((language) => language.code === value)

  if (option && option.code !== locale.value) {
    window.location.assign(getLanguageHref(option.code))
  }
}

const { isDark, toggleDark } = useDarkMode()

const getCurrencyLabel = (currency: string): string => {
  const currencyName = new Intl.DisplayNames([locale.value], { type: 'currency' }).of(currency)

  return currencyName ? `${currencyName} (${currency})` : currency
}
</script>

<template>
  <nav
    class="bg-background lg:ring-background sticky top-0 z-50 flex w-full min-w-0 items-center gap-2 px-3 py-3 sm:px-4 lg:ring-2"
  >
    <div class="flex min-w-0 flex-1 items-center gap-2">
      <Button
        as-child
        class="bg-foreground text-background hover:bg-foreground/90 size-11 shrink-0 rounded-sm lg:hidden"
      >
        <a
          :href="REPOSITORY_URL"
          target="_blank"
          rel="noreferrer"
          :aria-label="t('site.githubRepo')"
        >
          <GitFork aria-hidden="true" />
        </a>
      </Button>
      <span class="min-w-0 truncate text-sm font-semibold sm:text-base">
        {{ t('site.navBrand') }}
      </span>
    </div>
    <div class="hidden items-center gap-2 lg:flex">
      <Select v-model="market">
        <SelectTrigger class="w-36" :aria-label="t('site.marketLabel')">
          <SelectValue :placeholder="t('site.market.taiwan')" />
        </SelectTrigger>
        <SelectContent class="max-h-56 w-(--reka-select-trigger-width)" :side-offset="4">
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
      <Select v-model="displayCurrency">
        <SelectTrigger class="w-56 whitespace-nowrap" :aria-label="t('site.displayCurrencyLabel')">
          <SelectValue :placeholder="displayCurrency" />
        </SelectTrigger>
        <SelectContent class="w-(--reka-select-trigger-width) whitespace-nowrap" :side-offset="4">
          <SelectGroup>
            <SelectItem
              v-for="currency in props.displayCurrencies"
              :key="currency"
              :value="currency"
            >
              {{ getCurrencyLabel(currency) }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <Select :model-value="locale" @update:model-value="navigateToLocale">
        <SelectTrigger class="w-32" :aria-label="t('site.languageLabel')">
          <SelectValue :placeholder="t(`site.language.${locale}`)" />
        </SelectTrigger>
        <SelectContent class="w-(--reka-select-trigger-width)" :side-offset="4">
          <SelectGroup>
            <SelectItem v-for="option in languageLinks" :key="option.code" :value="option.code">
              {{ t(`site.language.${option.code}`) }}
            </SelectItem>
          </SelectGroup>
        </SelectContent>
      </Select>
      <button
        type="button"
        class="border-input bg-card text-foreground focus:ring-ring inline-flex size-11 items-center justify-center rounded-sm border shadow-sm transition outline-none hover:cursor-pointer focus:ring-2"
        :aria-label="isDark ? t('site.darkMode.switchToLight') : t('site.darkMode.switchToDark')"
        @click="toggleDark()"
      >
        <Sun v-if="isDark" class="size-4" aria-hidden="true" />
        <Moon v-else class="size-4" aria-hidden="true" />
      </button>
    </div>
    <Button as-child class="h-11 shrink-0 px-3">
      <a :href="DONATE_URL" target="_blank" rel="noreferrer">
        {{ t('site.donate') }}
      </a>
    </Button>
    <Button
      as-child
      class="bg-foreground text-background hover:bg-foreground/90 hidden size-11 shrink-0 rounded-sm lg:inline-flex"
    >
      <a :href="REPOSITORY_URL" target="_blank" rel="noreferrer" :aria-label="t('site.githubRepo')">
        <GitFork aria-hidden="true" />
      </a>
    </Button>
    <DropdownMenu>
      <DropdownMenuTrigger as-child>
        <Button
          class="size-11 lg:hidden"
          size="icon"
          variant="outline"
          :aria-label="t('site.moreLabel')"
        >
          <Menu aria-hidden="true" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent class="w-56 max-w-[calc(100vw-1.5rem)] lg:hidden" align="end">
        <DropdownMenuLabel>{{ t('site.marketLabel') }}</DropdownMenuLabel>
        <Select v-model="market">
          <SelectTrigger class="h-11 w-full" :aria-label="t('site.marketLabel')">
            <SelectValue :placeholder="t('site.market.taiwan')" />
          </SelectTrigger>
          <SelectContent class="max-h-56 w-(--reka-select-trigger-width)" :side-offset="4">
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
        <DropdownMenuSeparator />
        <DropdownMenuLabel>{{ t('site.displayCurrencyLabel') }}</DropdownMenuLabel>
        <Select v-model="displayCurrency">
          <SelectTrigger
            class="h-11 w-full whitespace-nowrap"
            :aria-label="t('site.displayCurrencyLabel')"
          >
            <SelectValue :placeholder="displayCurrency" />
          </SelectTrigger>
          <SelectContent class="w-(--reka-select-trigger-width) whitespace-nowrap" :side-offset="4">
            <SelectGroup>
              <SelectItem
                v-for="currency in props.displayCurrencies"
                :key="currency"
                :value="currency"
              >
                {{ getCurrencyLabel(currency) }}
              </SelectItem>
            </SelectGroup>
          </SelectContent>
        </Select>
        <DropdownMenuSeparator />
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
