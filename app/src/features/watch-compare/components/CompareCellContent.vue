<script setup lang="ts">
import type { CompareCell } from '../utils/watchCompareDisplay'

interface Props {
  cell: CompareCell
}

defineProps<Props>()
</script>

<template>
  <template v-if="cell.kind === 'price'">
    <span class="font-medium">{{ cell.amountText }}</span>
    <span v-if="cell.showTypeLabel" class="text-muted-foreground mt-1 block text-xs">
      {{ cell.typeLabel }}
    </span>
    <span v-if="cell.showRetailerOnly" class="text-muted-foreground mt-1 block text-xs">
      {{ cell.retailerOnlyLabel }}
    </span>
    <span v-if="cell.updatedLabel" class="text-muted-foreground mt-2 block text-xs">
      {{ cell.updatedLabel }}
    </span>
  </template>
  <template v-else>{{ cell.text }}</template>
</template>
