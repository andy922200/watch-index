import '@/assets/base.css'
import '@/assets/global.scss'

import { createApp } from 'vue'

import CollectionExplorerPage from '@/features/collection-explorer/CollectionExplorerPage.vue'
import { i18n } from '@/plugins/i18n'

createApp(CollectionExplorerPage).use(i18n).mount('#app')
