<script setup lang="ts">
import { useI18n } from 'vue-i18n'

import { Button } from '@/components/ui/button'
import { type DialColor, DialColorSwatchClasses } from '@/lib/dialColors'

interface Props {
  options: readonly DialColor[]
  filtersExpanded: boolean
}

defineProps<Props>()

const selectedColors = defineModel<DialColor[]>({ required: true })

const { t } = useI18n()

const toggleColor = (color: DialColor, checked: boolean): void => {
  selectedColors.value = checked
    ? [...selectedColors.value, color]
    : selectedColors.value.filter((value) => value !== color)
}
</script>

<template>
  <fieldset class="border-border border-t pt-5" :class="filtersExpanded ? '' : 'hidden lg:block'">
    <legend class="text-xs font-semibold tracking-widest uppercase">
      {{ t('site.explorer.dialColors') }}
    </legend>
    <div class="mt-3 flex flex-wrap gap-2">
      <Button
        v-for="color in options"
        :key="color"
        type="button"
        size="sm"
        :variant="selectedColors.includes(color) ? 'default' : 'outline'"
        :aria-pressed="selectedColors.includes(color)"
        class="h-7 rounded-full px-3 text-xs"
        @click="toggleColor(color, !selectedColors.includes(color))"
      >
        <span
          class="border-border size-3 shrink-0 rounded-full border"
          :class="DialColorSwatchClasses[color]"
          aria-hidden="true"
        />
        {{ t(`site.explorer.dialColor.${color}`) }}
      </Button>
    </div>
  </fieldset>
</template>
