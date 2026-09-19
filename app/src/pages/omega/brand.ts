import type { PriceCompareBrandConfig } from '@/features/price-compare/types'
import type { WatchBrandConfig } from '@/features/watch-index/types'
import { type BrandId, brands } from '@/lib/brands'
import { isOmegaWatchCatalog } from '@/lib/validation/omegaWatch'
import type { OmegaWatch } from '@/types/omega-watch'

export const BRAND_ID: BrandId = 'omega'

const OMEGA_WATCH_ID_PATTERN = /^omega:[0-9]{3}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{2}\.[0-9]{3}$/

const omegaBrand = brands.find((brand) => brand.id === BRAND_ID)

if (!omegaBrand) {
  throw new Error('Omega brand configuration is unavailable')
}

const isOmegaWatchId = (watchId: string): boolean => OMEGA_WATCH_ID_PATTERN.test(watchId)

export const omegaWatchIndexConfig: WatchBrandConfig<OmegaWatch> = {
  brandId: BRAND_ID,
  defaultMarket: omegaBrand.defaultMarket,
  getWatchReference: (watch: OmegaWatch): string => watch.reference,
  isCatalog: isOmegaWatchCatalog,
  isWatchIdValid: isOmegaWatchId,
  marketOptions: omegaBrand.marketOptions,
  titleKey: 'site.brandTitle.omega',
}

export const omegaPriceCompareConfig: PriceCompareBrandConfig<OmegaWatch> = omegaWatchIndexConfig
