import { beforeEach, describe, expect, it, vi } from 'vitest'

const { useFetchDataMock } = vi.hoisted(() => ({
  useFetchDataMock: vi.fn<(options: { url: string }) => Promise<unknown>>(),
}))

vi.mock('@/composables/useFetchData', () => ({
  Method: { GET: 'get' },
  useFetchData: useFetchDataMock,
}))

const manifest = {
  schemaVersion: 5,
  catalog: 'catalog.taiwan.json',
  catalogs: { TW: 'catalog.taiwan.json', JP: 'catalog.japan.json' },
  comparison: 'comparison.abc123.json',
  currencies: ['JPY', 'TWD'],
}

const respondByFileName = (): void => {
  useFetchDataMock.mockImplementation(({ url }) => {
    const data = url.includes('manifest.json') ? manifest : { url }

    return Promise.resolve({ result: [{ data }, null] })
  })
}

const requestedUrls = (): string[] => useFetchDataMock.mock.calls.map(([options]) => options.url)

describe('watchDataApi request caching', () => {
  beforeEach(() => {
    vi.resetModules()
    useFetchDataMock.mockReset()
    respondByFileName()
  })

  it('requests the brand-scoped manifest only once across repeated calls', async () => {
    const { getWatchDataManifest } = await import('@/api/watchDataApi')

    await Promise.all([getWatchDataManifest('rolex'), getWatchDataManifest('rolex')])
    await getWatchDataManifest('rolex')

    expect(requestedUrls().filter((url) => url.includes('manifest.json'))).toHaveLength(1)
    expect(requestedUrls()[0]).toContain('/watch-data/rolex/manifest.json')
  })

  it('shares one request per versioned file name and refetches distinct ones', async () => {
    const { getWatchDataFile } = await import('@/api/watchDataApi')

    await Promise.all([
      getWatchDataFile('rolex', 'catalog.taiwan.json'),
      getWatchDataFile('rolex', 'catalog.taiwan.json'),
    ])
    await getWatchDataFile('rolex', 'catalog.japan.json')

    expect(requestedUrls().filter((url) => url.includes('catalog.taiwan.json'))).toHaveLength(1)
    expect(requestedUrls().filter((url) => url.includes('catalog.japan.json'))).toHaveLength(1)
  })

  it('clears the manifest cache when a versioned file request fails', async () => {
    const { getWatchDataFile, getWatchDataManifest } = await import('@/api/watchDataApi')

    await getWatchDataManifest('rolex')
    useFetchDataMock.mockResolvedValueOnce({ result: [null, new Error('not found')] })

    await expect(getWatchDataFile('rolex', 'catalog.taiwan.json')).rejects.toThrow('not found')

    respondByFileName()
    await getWatchDataManifest('rolex')

    expect(requestedUrls().filter((url) => url.includes('manifest.json'))).toHaveLength(2)
  })
})
