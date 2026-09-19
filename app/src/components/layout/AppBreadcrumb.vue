<script setup lang="ts">
import { computed, type HTMLAttributes } from 'vue'
import { useI18n } from 'vue-i18n'

import {
  Breadcrumb,
  BreadcrumbItem,
  BreadcrumbLink,
  BreadcrumbList,
  BreadcrumbPage,
  BreadcrumbSeparator,
} from '@/components/ui/breadcrumb'
import { getSiteIndexLanguagePaths } from '@/lib/pageUrls'
import { Locale } from '@/plugins/i18n'

export interface AppBreadcrumbTrailItem {
  href: string
  label: string
}

interface Props {
  class?: HTMLAttributes['class']
  /** 目前頁面（不可點擊）的顯示文字。 */
  current: string
  /** 首頁與目前頁面之間的中繼節點，依序排列；品牌 index 頁不需要則省略。 */
  trail?: AppBreadcrumbTrailItem[]
}

const props = withDefaults(defineProps<Props>(), {
  class: undefined,
  trail: () => [],
})

const { locale, t } = useI18n()
const siteIndexLanguagePaths = getSiteIndexLanguagePaths()
const homeHref = computed(
  () => siteIndexLanguagePaths[locale.value === Locale.enUs ? 'enUs' : 'zhTw'],
)
</script>

<template>
  <Breadcrumb :class="props.class">
    <BreadcrumbList>
      <BreadcrumbItem>
        <BreadcrumbLink :href="homeHref">{{ t('site.breadcrumb.home') }}</BreadcrumbLink>
      </BreadcrumbItem>
      <template v-for="item in props.trail" :key="item.href">
        <BreadcrumbSeparator />
        <BreadcrumbItem>
          <BreadcrumbLink :href="item.href">{{ item.label }}</BreadcrumbLink>
        </BreadcrumbItem>
      </template>
      <BreadcrumbSeparator />
      <BreadcrumbItem>
        <BreadcrumbPage>{{ props.current }}</BreadcrumbPage>
      </BreadcrumbItem>
    </BreadcrumbList>
  </Breadcrumb>
</template>
