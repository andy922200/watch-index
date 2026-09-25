<script setup lang="ts">
import PriceComparePage from '@/features/price-compare/PriceComparePage.vue'

import { longinesPriceCompareConfig } from '../brand'
</script>

<template>
  <PriceComparePage :config="longinesPriceCompareConfig" />
</template>
