import type { CardProps } from '@chakra-ui/react'
import { Card, CardBody } from '@chakra-ui/react'
import type { AssetId } from '@shapeshiftoss/caip'
import { btcAssetId, ethAssetId, foxAssetId } from '@shapeshiftoss/caip'
import { AnimatePresence } from 'framer-motion'
import { lazy, memo, Suspense, useEffect } from 'react'
import { FormProvider, useForm } from 'react-hook-form'
import { MemoryRouter, Route, Switch, useLocation, useParams } from 'react-router-dom'
import { useIsSnapInstalled } from 'hooks/useIsSnapInstalled/useIsSnapInstalled'
import { selectAssetById } from 'state/slices/assetsSlice/selectors'
import { swappers } from 'state/slices/swappersSlice/swappersSlice'
import { useAppDispatch, useAppSelector } from 'state/store'

import { TradeRoutePaths } from './types'

const Approval = lazy(() =>
  import('./components/Approval/Approval').then(({ Approval }) => ({ default: Approval })),
)
const TradeConfirm = lazy(() =>
  import('./components/TradeConfirm/TradeConfirm').then(({ TradeConfirm }) => ({
    default: TradeConfirm,
  })),
)
const TradeInput = lazy(() =>
  import('./components/TradeInput/TradeInput').then(({ TradeInput }) => ({ default: TradeInput })),
)
const VerifyAddresses = lazy(() =>
  import('./components/VerifyAddresses/VerifyAddresses').then(({ VerifyAddresses }) => ({
    default: VerifyAddresses,
  })),
)

const MultiHopEntries = [
  TradeRoutePaths.Input,
  TradeRoutePaths.Approval,
  TradeRoutePaths.Confirm,
  TradeRoutePaths.VerifyAddresses,
]

export type TradeCardProps = {
  defaultBuyAssetId?: AssetId
  defaultSellAssetId?: AssetId
} & CardProps

type MatchParams = {
  chainId?: string
  assetSubId?: string
}

export const MultiHopTrade = memo(
  ({
    defaultBuyAssetId: _defaultBuyAssetId = foxAssetId,
    defaultSellAssetId = ethAssetId,
    ...cardProps
  }: TradeCardProps) => {
    // Overrides the defaultBuyAssetId to BTC across all instances of this component, to avoid all consumers programmatically checking for isSnapInstalled
    const isSnapInstalled = useIsSnapInstalled()
    const defaultBuyAssetId =
      _defaultBuyAssetId === foxAssetId && isSnapInstalled ? btcAssetId : _defaultBuyAssetId
    const dispatch = useAppDispatch()
    const methods = useForm({ mode: 'onChange' })
    const { assetSubId, chainId } = useParams<MatchParams>()

    const defaultBuyAsset = useAppSelector(state => selectAssetById(state, defaultBuyAssetId))
    const routeBuyAsset = useAppSelector(state =>
      selectAssetById(state, `${chainId}/${assetSubId}`),
    )
    const defaultSellAsset = useAppSelector(state => selectAssetById(state, defaultSellAssetId))

    useEffect(() => {
      dispatch(swappers.actions.clear())
      if (defaultSellAsset) dispatch(swappers.actions.setSellAsset(defaultSellAsset))
      if (routeBuyAsset) dispatch(swappers.actions.setBuyAsset(routeBuyAsset))
      else if (defaultBuyAsset) dispatch(swappers.actions.setBuyAsset(defaultBuyAsset))
    }, [defaultBuyAsset, defaultSellAsset, dispatch, routeBuyAsset])

    return (
      <Card {...cardProps}>
        <CardBody px={0} py={0}>
          <FormProvider {...methods}>
            <MemoryRouter initialEntries={MultiHopEntries} initialIndex={0}>
              <MultiHopRoutes />
            </MemoryRouter>
          </FormProvider>
        </CardBody>
      </Card>
    )
  },
)

const MultiHopRoutes = memo(() => {
  const location = useLocation()
  const dispatch = useAppDispatch()

  useEffect(() => {
    return () => {
      // Reset the swapper slice to initial state on mount
      // Don't move me to one of the trade route components, this needs to be at router-level
      // We only want to clear swapper state when trade components are fully unmounted, not when trade routes change
      dispatch(swappers.actions.clear())
    }
  }, [dispatch])

  return (
    <Suspense>
      <AnimatePresence exitBeforeEnter initial={false}>
        <Switch location={location}>
          <Route key={TradeRoutePaths.Input} path={TradeRoutePaths.Input}>
            <TradeInput />
          </Route>
          <Route key={TradeRoutePaths.Confirm} path={TradeRoutePaths.Confirm}>
            <TradeConfirm />
          </Route>
          <Route key={TradeRoutePaths.Approval} path={TradeRoutePaths.Approval}>
            <Approval />
          </Route>
          <Route key={TradeRoutePaths.VerifyAddresses} path={TradeRoutePaths.VerifyAddresses}>
            <VerifyAddresses />
          </Route>
        </Switch>
      </AnimatePresence>
    </Suspense>
  )
})
