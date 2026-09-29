<script setup lang="ts">
import { ArrowRight, X } from '@lucide/vue'
import { useElementSize } from '@vueuse/core'
import { onUnmounted, ref, watch } from 'vue'
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'

export interface SelectionBarItem {
  id: string
  reference: string
  missing: boolean
}

interface Props {
  items: SelectionBarItem[]
  compareHref: string
}

defineProps<Props>()

const emit = defineEmits<{
  remove: [id: string]
  clear: []
}>()

const { t } = useI18n()

const root = ref<HTMLElement | null>(null)

// 需在 root 宣告後才能傳入 useElementSize。
const { height } = useElementSize(root, undefined, { box: 'border-box' })

/** 選取列固定在底部時，把高度告知「回到頂端」按鈕，避免兩者重疊。 */
watch(
  height,
  (value) => {
    document.documentElement.style.setProperty('--floating-bar-offset', `${value}px`)
  },
  { immediate: true },
)
onUnmounted(() => {
  document.documentElement.style.removeProperty('--floating-bar-offset')
})
</script>

<template>
  <aside
    ref="root"
    class="bg-background/95 border-border fixed inset-x-0 bottom-0 z-40 border-t shadow-lg backdrop-blur"
    :aria-label="t('site.explorer.selected', { count: items.length })"
  >
    <div class="mx-auto flex max-w-6xl flex-wrap items-center gap-x-3 gap-y-2 p-3 sm:p-4">
      <span class="font-mono text-xs font-semibold tracking-wider uppercase">
        {{ t('site.explorer.selected', { count: items.length }) }}
      </span>
      <Button
        variant="ghost"
        size="sm"
        class="order-2 ml-auto sm:order-4 sm:ml-0"
        @click="emit('clear')"
      >
        {{ t('site.explorer.clear') }}
      </Button>
      <ul class="order-4 flex w-full min-w-0 flex-wrap gap-2 sm:order-3 sm:w-auto sm:flex-1">
        <li
          v-for="item in items"
          :key="item.id"
          class="bg-muted flex min-h-9 max-w-full min-w-0 items-center gap-1 rounded-sm py-0.5 pr-0.5 pl-2 text-xs"
        >
          <span class="min-w-0 truncate sm:max-w-40" :title="item.reference">
            {{ item.reference }}
          </span>
          <span v-if="item.missing" class="text-destructive shrink-0">
            {{ t('site.explorer.missingLocal') }}
          </span>
          <button
            type="button"
            class="focus-visible:ring-ring hover:bg-foreground/10 flex size-9 shrink-0 cursor-pointer items-center justify-center rounded focus-visible:ring-2 sm:size-7"
            :aria-label="t('site.explorer.removeWatch', { reference: item.reference })"
            @click="emit('remove', item.id)"
          >
            <X class="size-4" aria-hidden="true" />
          </button>
        </li>
      </ul>
      <Button
        v-if="items.length >= 2"
        as-child
        size="sm"
        class="order-5 w-full sm:order-5 sm:w-auto"
      >
        <a :href="compareHref">
          {{ t('site.explorer.compare') }}
          <ArrowRight aria-hidden="true" />
        </a>
      </Button>
      <Button v-else size="sm" class="order-5 w-full sm:w-auto" disabled>
        {{ t('site.explorer.compare') }}
      </Button>
    </div>
  </aside>
</template>
