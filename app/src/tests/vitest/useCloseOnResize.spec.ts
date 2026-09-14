import { fireEvent, render, screen } from '@testing-library/vue'
import { describe, expect, it } from 'vitest'
import { defineComponent } from 'vue'

import { useCloseOnResize } from '@/composables/useCloseOnResize'

const ResizeCloseHarness = defineComponent({
  setup() {
    return useCloseOnResize()
  },
  template: `
    <button type="button" @click="isOpen = true">Open</button>
    <button type="button" @click="close">Close</button>
    <output>{{ isOpen ? 'open' : 'closed' }}</output>
  `,
})

describe('useCloseOnResize', () => {
  it('exposes state and closes it explicitly or when the viewport is resized', async () => {
    render(ResizeCloseHarness)

    await fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    expect(screen.getByText('open')).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: 'Close' }))
    expect(screen.getByText('closed')).toBeTruthy()

    await fireEvent.click(screen.getByRole('button', { name: 'Open' }))
    await fireEvent(window, new Event('resize'))
    expect(screen.getByText('closed')).toBeTruthy()
  })
})
