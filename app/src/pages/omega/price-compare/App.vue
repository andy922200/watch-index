<script setup lang="ts">
import PriceComparePage from '@/features/price-compare/PriceComparePage.vue'

import { omegaPriceCompareConfig } from '../brand'
</script>

<template>
  <PriceComparePage :config="omegaPriceCompareConfig" />
</template>
