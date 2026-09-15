<script setup lang="ts">
import PriceComparePage from '@/features/price-compare/PriceComparePage.vue'

import { rolexPriceCompareConfig } from '../brand'
</script>

<template>
  <PriceComparePage :config="rolexPriceCompareConfig" />
</template>
