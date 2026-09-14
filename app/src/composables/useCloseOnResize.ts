import { onBeforeUnmount, onMounted, type Ref, ref } from 'vue'

interface UseCloseOnResizeResult {
  isOpen: Ref<boolean>
  close: () => void
}

export const useCloseOnResize = (): UseCloseOnResizeResult => {
  const isOpen = ref(false)

  const close = (): void => {
    isOpen.value = false
  }

  onMounted(() => {
    window.addEventListener('resize', close)
  })

  onBeforeUnmount(() => {
    window.removeEventListener('resize', close)
  })

  return { isOpen, close }
}
