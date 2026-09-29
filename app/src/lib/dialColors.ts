/** catalog 內 `dialColors` 允許的標準色 slug，需與 `data/schemas/watch-catalog.schema.json` 的 enum 同步。 */
export const DIAL_COLORS = [
  'white',
  'silver',
  'black',
  'grey',
  'blue',
  'green',
  'red',
  'pink',
  'purple',
  'brown',
  'yellow',
  'beige',
  'gold',
  'multicolor',
  'other',
] as const

export type DialColor = (typeof DIAL_COLORS)[number]

/** 判斷未知值是否為合法的錶盤標準色 slug。 */
export const isDialColor = (value: unknown): value is DialColor =>
  typeof value === 'string' && DIAL_COLORS.some((color) => color === value)

/** 色票用的 Tailwind 背景 class；`multicolor` 用漸層、`other` 用斜線條紋表示無單一顏色。 */
export const DialColorSwatchClasses: Record<DialColor, string> = {
  white: 'bg-white',
  silver: 'bg-zinc-300',
  black: 'bg-black',
  grey: 'bg-zinc-500',
  blue: 'bg-blue-600',
  green: 'bg-green-700',
  red: 'bg-red-600',
  pink: 'bg-pink-300',
  purple: 'bg-purple-600',
  brown: 'bg-amber-900',
  yellow: 'bg-yellow-400',
  beige: 'bg-amber-100',
  gold: 'bg-amber-400',
  multicolor: 'bg-linear-to-br from-red-500 via-yellow-400 to-blue-500',
  other: 'bg-muted',
}
