import { ArrowDownIcon, ArrowUpIcon, WarningTwoIcon } from '@chakra-ui/icons'
import type { StackDirection } from '@chakra-ui/react'
import { Box, Button, Flex, SimpleGrid, Stack, Tag, useColorModeValue } from '@chakra-ui/react'
import type { AssetId } from '@shapeshiftoss/caip'
import { TradeType, TransferType, TxStatus } from '@shapeshiftoss/unchained-client'
import React, { useMemo } from 'react'
import { FaArrowRight, FaExchangeAlt, FaStickyNote, FaThumbsUp } from 'react-icons/fa'
import { Amount } from 'components/Amount/Amount'
import { CircularProgress } from 'components/CircularProgress/CircularProgress'
import { IconCircle } from 'components/IconCircle'
import { Text } from 'components/Text'
import { TransactionLink } from 'components/TransactionHistoryRows/TransactionLink'
import { TransactionTime } from 'components/TransactionHistoryRows/TransactionTime'
import type { Fee, Transfer } from 'hooks/useTxDetails/useTxDetails'
import { Method } from 'hooks/useTxDetails/useTxDetails'
import { bnOrZero } from 'lib/bignumber/bignumber'
import { fromBaseUnit } from 'lib/math'
import type { TxId } from 'state/slices/txHistorySlice/txHistorySlice'
import { breakpoints } from 'theme/theme'

import { ApproveIcon } from './components/ApproveIcon'
import { AssetsTransfers } from './components/AssetsTransfers'
import { AssetTransfer } from './components/AssetTransfer'
import type { getTxMetadataWithAssetId } from './utils'

const buttonPadding = { base: 2, md: 4 }
const stackDivider = (
  <Box border={0} color='text.subtle' fontSize='sm'>
    <FaArrowRight />
  </Box>
)

export const GetTxLayoutFormats = ({ parentWidth }: { parentWidth: number }) => {
  const isLargerThanSm = parentWidth > parseInt(breakpoints['sm'], 10)
  const isLargerThanMd = parentWidth > parseInt(breakpoints['md'], 10)
  const isLargerThanLg = parentWidth > parseInt(breakpoints['lg'], 10)
  let columns = '1fr'
  let dateFormat = 'L LT'

  if (isLargerThanSm) {
    columns = '1fr 2fr'
    dateFormat = 'LT'
  }
  if (isLargerThanMd) {
    columns = '1fr 2fr'
  }
  if (isLargerThanLg) {
    columns = '1fr 2fr 1fr 1fr'
  }
  return { columns, dateFormat, breakPoints: [isLargerThanLg, isLargerThanMd, isLargerThanSm] }
}

const TransactionIcon = ({
  type,
  status,
  assetId,
  value,
  compactMode,
}: {
  type: string
  status: TxStatus
  assetId: AssetId | undefined
  value: string | undefined
  compactMode: boolean
}) => {
  const green = useColorModeValue('green.700', 'green.500')
  const red = useColorModeValue('red.700', 'red.500')
  if (status === TxStatus.Failed) return <WarningTwoIcon color={red} />

  switch (type) {
    case TransferType.Send:
      return <ArrowUpIcon />
    case TransferType.Receive:
      return <ArrowDownIcon color={green} />
    case TradeType.Trade:
      return <FaExchangeAlt />
    case Method.Approve: {
      return assetId && value ? (
        <ApproveIcon assetId={assetId} value={value} compactMode={compactMode} />
      ) : (
        <FaThumbsUp />
      )
    }
    default:
      return <FaStickyNote />
  }
}

type TransactionGenericRowProps = {
  type: string
  status: TxStatus
  title?: string
  showDateAndGuide?: boolean
  compactMode?: boolean
  transfersByType: Record<TransferType, Transfer[]>
  fee?: Fee
  txid: TxId
  txData?: ReturnType<typeof getTxMetadataWithAssetId>
  blockTime: number
  explorerTxLink: string
  toggleOpen: () => void
  parentWidth: number
}

export const TransactionGenericRow = ({
  type,
  status,
  title,
  transfersByType,
  fee,
  txid,
  txData,
  blockTime,
  explorerTxLink,
  compactMode = false,
  toggleOpen,
  parentWidth,
}: TransactionGenericRowProps) => {
  const {
    columns,
    dateFormat,
    breakPoints: [isLargerThanLg],
  } = GetTxLayoutFormats({ parentWidth })

  const transfers = useMemo(() => {
    return Object.values(transfersByType).map((transfersOfType, index) => {
      const hasManyTypeTransfers = transfersOfType.length > 1

      return (
        <React.Fragment key={index}>
          {hasManyTypeTransfers ? (
            <AssetsTransfers index={index} compactMode={compactMode} transfers={transfersOfType} />
          ) : (
            <AssetTransfer index={index} compactMode={compactMode} transfer={transfersOfType[0]} />
          )}
        </React.Fragment>
      )
    })
  }, [compactMode, transfersByType])

  const isNft = useMemo(() => {
    return Object.values(transfersByType)
      .flat()
      .some(transfer => !!transfer.id)
  }, [transfersByType])

  const cryptoValue = useMemo(() => {
    if (!fee) return '0'
    return fromBaseUnit(fee.value, fee.asset.precision)
  }, [fee])

  const fiatValue = useMemo(() => {
    return bnOrZero(fee?.marketData?.price)
      .times(cryptoValue)
      .toString()
  }, [fee?.marketData?.price, cryptoValue])

  const gridTemplateColumns = useMemo(() => ({ base: '1fr', md: columns }), [columns])
  const iconCircleBoxSize = useMemo(
    () => ({ base: '24px', lg: compactMode ? '24px' : '38px' }),
    [compactMode],
  )
  const stackDirection: StackDirection = useMemo(
    () => ({ base: 'row', md: 'column', xl: compactMode ? 'row' : 'column' }),
    [compactMode],
  )
  const stackFontSize = useMemo(
    () => ({ base: 'sm', lg: compactMode ? 'sm' : 'md' }),
    [compactMode],
  )

  const stackAlignItems = useMemo(
    () => ({ base: 'flex-start', xl: compactMode ? 'center' : 'flex-start' }),
    [compactMode],
  )
  const tagMinHeight = useMemo(
    () => ({ base: '1.2rem', md: compactMode ? '1.2rem' : '1.25rem' }),
    [compactMode],
  )
  const tagPx = useMemo(() => ({ base: 2, md: compactMode ? 2 : 2 }), [compactMode])
  const stackSpacing = useMemo(() => ({ base: 0, md: 4, xl: compactMode ? 0 : 4 }), [compactMode])
  const stackJustifyContent = useMemo(
    () => ({
      base: 'space-between',
      md: 'flex-start',
      xl: compactMode ? 'space-between' : 'flex-start',
    }),
    [compactMode],
  )

  return (
    <Button
      height='auto'
      fontWeight='inherit'
      variant='unstyled'
      w='full'
      p={buttonPadding}
      onClick={toggleOpen}
    >
      <SimpleGrid
        gridTemplateColumns={gridTemplateColumns}
        textAlign='left'
        justifyContent='flex-start'
        alignItems='center'
        columnGap={4}
      >
        <Flex alignItems='flex-start' flex={1} flexDir='column' width='full'>
          <Flex alignItems='center' width='full'>
            <IconCircle
              mr={2}
              boxSize={iconCircleBoxSize}
              bg={useColorModeValue('blackAlpha.100', 'whiteAlpha.200')}
              position='relative'
            >
              <TransactionIcon
                type={type}
                status={status}
                assetId={txData?.assetId}
                value={txData?.value}
                compactMode={compactMode}
              />
              {status === TxStatus.Pending && <CircularProgress position='absolute' size='100%' />}
            </IconCircle>
            <Stack
              direction={stackDirection}
              flex={1}
              spacing={0}
              fontSize={stackFontSize}
              alignItems={stackAlignItems}
            >
              <Flex alignItems='center' gap={2} flex={1}>
                <Text
                  fontWeight='bold'
                  translation={title ? title : `transactionRow.${type.toLowerCase()}`}
                />
                {txData && txData.parser === 'ibc' && (
                  <Tag
                    size='sm'
                    colorScheme='blue'
                    variant='subtle'
                    minHeight={tagMinHeight}
                    px={tagPx}
                  >
                    IBC
                  </Tag>
                )}
                {isNft && (
                  <Tag
                    size='sm'
                    colorScheme='blue'
                    variant='subtle'
                    minHeight={tagMinHeight}
                    px={tagPx}
                  >
                    NFT
                  </Tag>
                )}
              </Flex>
              <TransactionTime blockTime={blockTime} format={dateFormat} />
            </Stack>
          </Flex>
        </Flex>
        <Flex flex={2} flexDir='column' width='full'>
          <Stack
            direction='row'
            width='full'
            alignItems='center'
            spacing={stackSpacing}
            justifyContent={stackJustifyContent}
            fontSize={stackFontSize}
            divider={stackDivider}
          >
            {transfers}
          </Stack>
        </Flex>
        {isLargerThanLg && (
          <Flex alignItems='flex-start' flex={1} flexDir='column' textAlign='right'>
            {fee && bnOrZero(fee.value).gt(0) && (
              <Flex alignItems='flex-end' width='full'>
                <Box flex={1}>
                  <Amount.Crypto
                    color='inherit'
                    fontWeight='bold'
                    value={cryptoValue}
                    symbol={fee.asset.symbol}
                    maximumFractionDigits={6}
                  />
                  <Amount.Fiat color='text.subtle' fontSize='sm' lineHeight='1' value={fiatValue} />
                </Box>
              </Flex>
            )}
          </Flex>
        )}
        {isLargerThanLg && (
          <Flex flex={0} flexDir='column'>
            <Flex justifyContent='flex-end' alignItems='center'>
              <TransactionLink txid={txid} explorerTxLink={explorerTxLink} />
            </Flex>
          </Flex>
        )}
      </SimpleGrid>
    </Button>
  )
}
