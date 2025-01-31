import { ChevronDownIcon, WarningTwoIcon } from '@chakra-ui/icons'
import {
  Box,
  Button,
  ButtonGroup,
  Flex,
  HStack,
  Menu,
  MenuButton,
  MenuGroup,
  MenuItem,
  MenuList,
  useColorModeValue,
} from '@chakra-ui/react'
import type { FC } from 'react'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import { FaWallet } from 'react-icons/fa'
import { useTranslate } from 'react-polyglot'
import { MemoryRouter } from 'react-router-dom'
import type { Address } from 'viem'
import { WalletConnectedRoutes } from 'components/Layout/Header/NavBar/hooks/useMenuRoutes'
import { WalletConnectedMenu } from 'components/Layout/Header/NavBar/WalletConnectedMenu'
import { WalletImage } from 'components/Layout/Header/NavBar/WalletImage'
import { MiddleEllipsis } from 'components/MiddleEllipsis/MiddleEllipsis'
import { RawText, Text } from 'components/Text'
import { WalletActions } from 'context/WalletProvider/actions'
import type { InitialState } from 'context/WalletProvider/WalletProvider'
import { useWallet } from 'hooks/useWallet/useWallet'
import { viemEthMainnetClient } from 'lib/viem-client'

export const entries = [WalletConnectedRoutes.Connected]

const maxWidthProp = { base: 'full', md: 'xs' }
const minWidthProp = { base: 0, md: 'xs' }
const widthProp = { base: '100%', lg: 'auto' }

const NoWallet = ({ onClick }: { onClick: () => void }) => {
  const translate = useTranslate()
  return (
    <MenuGroup title={translate('common.noWallet')} ml={3} color='text.subtle'>
      <MenuItem onClick={onClick} alignItems='center' justifyContent='space-between'>
        {translate('common.connectWallet')}
        <ChevronDownIcon />
      </MenuItem>
    </MenuGroup>
  )
}

export type WalletConnectedProps = {
  onDisconnect: () => void
  onSwitchProvider: () => void
} & Pick<InitialState, 'walletInfo' | 'isConnected' | 'connectedType'>

export const WalletConnected = (props: WalletConnectedProps) => {
  return (
    <MemoryRouter initialEntries={entries}>
      <WalletConnectedMenu
        isConnected={props.isConnected}
        walletInfo={props.walletInfo}
        onDisconnect={props.onDisconnect}
        onSwitchProvider={props.onSwitchProvider}
        connectedType={props.connectedType}
      />
    </MemoryRouter>
  )
}

type WalletButtonProps = {
  isConnected: boolean
  isDemoWallet: boolean
  isLoadingLocalWallet: boolean
  onConnect: () => void
} & Pick<InitialState, 'walletInfo'>

const WalletButton: FC<WalletButtonProps> = ({
  isConnected,
  isDemoWallet,
  walletInfo,
  onConnect,
  isLoadingLocalWallet,
}) => {
  const [walletLabel, setWalletLabel] = useState('')
  const [shouldShorten, setShouldShorten] = useState(true)
  const bgColor = useColorModeValue('gray.200', 'gray.800')
  const [ensName, setEnsName] = useState<string | null>('')

  useEffect(() => {
    if (!walletInfo?.meta?.address) return
    viemEthMainnetClient
      .getEnsName({ address: walletInfo.meta.address as Address })
      .then(setEnsName)
  }, [walletInfo?.meta?.address])

  useEffect(() => {
    setWalletLabel('')
    setShouldShorten(true)
    if (!walletInfo || !walletInfo.meta) return setWalletLabel('')
    // Wallet has a native label, we don't care about ENS name here
    if (!walletInfo?.meta?.address && walletInfo.meta.label) {
      setShouldShorten(false)
      return setWalletLabel(walletInfo.meta.label)
    }

    // ENS is registered for address and is successfully fetched. Set ENS name as label
    if (ensName) {
      setShouldShorten(false)
      return setWalletLabel(ensName!)
    }

    // No label or ENS name, set regular wallet address as label
    return setWalletLabel(walletInfo?.meta?.address ?? '')
  }, [ensName, walletInfo])

  const rightIcon = useMemo(() => <ChevronDownIcon />, [])
  const leftIcon = useMemo(
    () => (
      <HStack>
        {!(isConnected || isDemoWallet) && <WarningTwoIcon ml={2} w={3} h={3} color='yellow.500' />}
        <WalletImage walletInfo={walletInfo} />
      </HStack>
    ),
    [isConnected, isDemoWallet, walletInfo],
  )
  const connectIcon = useMemo(() => <FaWallet />, [])

  return Boolean(walletInfo?.deviceId) || isLoadingLocalWallet ? (
    <MenuButton
      as={Button}
      width={widthProp}
      justifyContent='flex-start'
      rightIcon={rightIcon}
      leftIcon={leftIcon}
    >
      <Flex>
        {walletLabel ? (
          <MiddleEllipsis
            rounded='lg'
            fontSize='sm'
            p='1'
            pl='2'
            pr='2'
            shouldShorten={shouldShorten}
            bgColor={bgColor}
            value={walletLabel}
          />
        ) : (
          <RawText>{walletInfo?.name}</RawText>
        )}
      </Flex>
    </MenuButton>
  ) : (
    <Button onClick={onConnect} leftIcon={connectIcon}>
      <Text translation='common.connectWallet' />
    </Button>
  )
}

export const UserMenu: React.FC<{ onClick?: () => void }> = memo(({ onClick }) => {
  const { state, dispatch, disconnect } = useWallet()
  const { isConnected, isDemoWallet, walletInfo, connectedType, isLocked, isLoadingLocalWallet } =
    state

  if (isLocked) disconnect()
  const hasWallet = Boolean(walletInfo?.deviceId)
  const handleConnect = useCallback(() => {
    onClick && onClick()
    dispatch({ type: WalletActions.SET_WALLET_MODAL, payload: true })
  }, [dispatch, onClick])
  return (
    <ButtonGroup width='full'>
      <Box>
        <Menu autoSelect={false}>
          <WalletButton
            onConnect={handleConnect}
            walletInfo={walletInfo}
            isConnected={isConnected}
            isDemoWallet={isDemoWallet}
            isLoadingLocalWallet={isLoadingLocalWallet}
            data-test='navigation-wallet-dropdown-button'
          />
          <MenuList
            maxWidth={maxWidthProp}
            minWidth={minWidthProp}
            overflow='hidden'
            // Override zIndex to prevent InputLeftElement displaying over menu
            zIndex={2}
          >
            {hasWallet || isLoadingLocalWallet ? (
              <WalletConnected
                isConnected={isConnected || isDemoWallet}
                walletInfo={walletInfo}
                onDisconnect={disconnect}
                onSwitchProvider={handleConnect}
                connectedType={connectedType}
              />
            ) : (
              <NoWallet onClick={handleConnect} />
            )}
          </MenuList>
        </Menu>
      </Box>
    </ButtonGroup>
  )
})
