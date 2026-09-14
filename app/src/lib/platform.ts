export const isIosDevice = (): boolean => {
  if (typeof window === 'undefined' || !window.navigator) {
    return false
  }

  const userAgent = window.navigator.userAgent

  return (
    /iP(?:ad|hone|od)/.test(userAgent) ||
    (window.navigator.maxTouchPoints > 2 && /Macintosh/.test(userAgent))
  )
}
