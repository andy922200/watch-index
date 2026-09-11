import { describe, expect, it } from 'vitest'

import {
  getBrandLanguagePrefix,
  getBrandPageFilePath,
  getBrandPagePublicPath,
  PageLanguage,
  toLanguagePathname,
} from '@/lib/pageRoutes'

describe('brand page paths', () => {
  it('keeps the default language at the brand root and nests the other language', () => {
    expect(getBrandLanguagePrefix({ brandId: 'rolex', language: PageLanguage.zhTw })).toBe('rolex')
    expect(getBrandLanguagePrefix({ brandId: 'rolex', language: PageLanguage.enUs })).toBe(
      'rolex/en-us',
    )
  })

  it('always names a file for build output', () => {
    expect(
      getBrandPageFilePath({ brandId: 'rolex', language: PageLanguage.zhTw, page: 'index' }),
    ).toBe('rolex/index.html')
    expect(
      getBrandPageFilePath({
        brandId: 'rolex',
        language: PageLanguage.enUs,
        page: 'price-compare',
      }),
    ).toBe('rolex/en-us/watch-price-compare.html')
  })

  it('hides index.html from the public path but keeps other filenames', () => {
    expect(
      getBrandPagePublicPath({ brandId: 'rolex', language: PageLanguage.zhTw, page: 'index' }),
    ).toBe('rolex/')
    expect(
      getBrandPagePublicPath({ brandId: 'rolex', language: PageLanguage.enUs, page: 'index' }),
    ).toBe('rolex/en-us/')
    expect(
      getBrandPagePublicPath({
        brandId: 'rolex',
        language: PageLanguage.zhTw,
        page: 'price-compare',
      }),
    ).toBe('rolex/watch-price-compare.html')
  })
})

describe('switching an existing pathname to another language', () => {
  it('adds and removes the language segment on a directory-style index path', () => {
    expect(
      toLanguagePathname({ pathname: '/watch-index/app/rolex/', language: PageLanguage.enUs }),
    ).toBe('/watch-index/app/rolex/en-us/')
    expect(
      toLanguagePathname({
        pathname: '/watch-index/app/rolex/en-us/',
        language: PageLanguage.zhTw,
      }),
    ).toBe('/watch-index/app/rolex/')
  })

  it('keeps the language segment before the filename on a page that names a file', () => {
    expect(
      toLanguagePathname({
        pathname: '/watch-index/app/rolex/watch-price-compare.html',
        language: PageLanguage.enUs,
      }),
    ).toBe('/watch-index/app/rolex/en-us/watch-price-compare.html')
    expect(
      toLanguagePathname({
        pathname: '/watch-index/app/rolex/en-us/watch-price-compare.html',
        language: PageLanguage.zhTw,
      }),
    ).toBe('/watch-index/app/rolex/watch-price-compare.html')
  })

  it('is a no-op when the pathname is already in the requested language', () => {
    expect(
      toLanguagePathname({
        pathname: '/watch-index/app/rolex/en-us/watch-price-compare.html',
        language: PageLanguage.enUs,
      }),
    ).toBe('/watch-index/app/rolex/en-us/watch-price-compare.html')
    expect(
      toLanguagePathname({ pathname: '/watch-index/app/rolex/', language: PageLanguage.zhTw }),
    ).toBe('/watch-index/app/rolex/')
  })

  it('works at the site root where there is no base or brand prefix', () => {
    expect(toLanguagePathname({ pathname: '/rolex/', language: PageLanguage.enUs })).toBe(
      '/rolex/en-us/',
    )
  })
})
