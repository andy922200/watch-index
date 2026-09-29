import '@/assets/base.css'
import '@/assets/global.scss'

import { createApp } from 'vue'

import WatchComparePage from '@/features/watch-compare/WatchComparePage.vue'
import { i18n } from '@/plugins/i18n'

createApp(WatchComparePage).use(i18n).mount('#app')
