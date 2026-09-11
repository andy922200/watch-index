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
    class="bg-background lg:ring-background sticky top-0 z-50 flex w-full items-center justify-end gap-2 px-4 py-3 lg:ring-2"
  >
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
    <div class="hidden lg:block">
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
    </div>
    <div class="hidden lg:block">
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
    </div>
    <button
      type="button"
      class="border-input bg-card text-foreground focus:ring-ring hidden rounded-sm border p-2 shadow-sm transition outline-none hover:cursor-pointer focus:ring-2 lg:inline-flex"
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
      <DropdownMenuContent class="w-56 lg:hidden" align="end">
        <DropdownMenuLabel>{{ t('site.displayCurrencyLabel') }}</DropdownMenuLabel>
        <DropdownMenuGroup>
          <DropdownMenuRadioGroup v-model="displayCurrency">
            <DropdownMenuRadioItem
              v-for="currency in props.displayCurrencies"
              :key="currency"
              class="cursor-pointer"
              :value="currency"
            >
              {{ getCurrencyLabel(currency) }}
            </DropdownMenuRadioItem>
          </DropdownMenuRadioGroup>
        </DropdownMenuGroup>
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
