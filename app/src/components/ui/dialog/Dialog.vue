<script setup lang="ts">
import type { DialogRootEmits, DialogRootProps } from 'reka-ui'
import { DialogRoot, useForwardPropsEmits } from 'reka-ui'
import { watch } from 'vue'

import { isIosDevice } from '@/lib/platform'

const props = defineProps<DialogRootProps>()
const emits = defineEmits<DialogRootEmits>()

const forwarded = useForwardPropsEmits(props, emits)

let frozenScrollY = 0

// iOS Safari 在頁面已捲動時開啟 fixed 全螢幕遮罩，工具列收合／展開的重繪常對不上，須凍結捲動避開該互動
watch(
  () => props.open,
  (isOpen) => {
    if (!isIosDevice()) {
      return
    }

    if (isOpen) {
      frozenScrollY = window.scrollY
      document.body.style.position = 'fixed'
      document.body.style.top = `-${frozenScrollY}px`
      document.body.style.width = '100%'
      return
    }

    document.body.style.position = ''
    document.body.style.top = ''
    document.body.style.width = ''
    window.scrollTo(0, frozenScrollY)
  },
)
</script>

<template>
  <DialogRoot v-slot="slotProps" data-slot="dialog" v-bind="forwarded">
    <slot v-bind="slotProps" />
  </DialogRoot>
</template>
