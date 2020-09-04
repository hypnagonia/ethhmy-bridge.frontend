import * as React from 'react';
import { Box } from 'grommet';
import { BaseContainer, PageContainer } from 'components';
import { observer } from 'mobx-react-lite';
import { useStores } from 'stores';
import * as styles from './styles.styl';
import { Exchange } from '../Exchange';
import { EXCHANGE_MODE, TOKEN } from 'stores/interfaces';
import cn from 'classnames';
import { Text } from 'components/Base';
import { WalletBalances } from './WalletBalances';
import { useEffect } from 'react';

const LargeButton = (props: {
  title: string;
  onClick: () => void;
  description: string;
  isActive: boolean;
  reverse?: boolean;
}) => {
  return (
    <Box
      direction="column"
      align="center"
      justify="center"
      className={cn(
        styles.largeButtonContainer,
        props.isActive ? styles.active : '',
      )}
      onClick={props.onClick}
      gap="10px"
    >
      <Box direction={props.reverse ? 'row-reverse' : 'row'} align="center">
        <Box direction="row" align="center">
          <img className={styles.imgToken} width="20" height="20" src="/bnb.svg" />
          <Text size="large" className={styles.title}>
            Binance
          </Text>
        </Box>
        <Box direction="row" margin={{ horizontal: 'small' }} align="center">
          <img src="/right.svg" />
        </Box>
        <Box direction="row" align="center">
          <img className={styles.imgToken} src="/one.svg" />
          <Text size="large" className={styles.title}>
            Harmony
          </Text>
        </Box>
      </Box>
      <Text size="xsmall" color="#748695" className={styles.description}>
        {props.description}
      </Text>
    </Box>
  );
};

export const EthBridge = observer((props: any) => {
  const { user, exchange, routing } = useStores();

  useEffect(() => {
    if (props.match.params.token) {

        routing.push('');

    }

  }, []);

  return (
    <BaseContainer>
      <PageContainer>
        <Box
          direction="row"
          wrap={true}
          fill={true}
          justify="between"
          align="start"
        >
          <Box
            direction="column"
            align="center"
            justify="center"
            className={styles.base}
          >
            {/*<Box*/}
            {/*  direction="row"*/}
            {/*  justify="center"*/}
            {/*  margin={{ top: 'large' }}*/}
            {/*>*/}
            {/*  <Title size="medium" color="BlackTxt" bold>*/}
            {/*    BUSD Bridge*/}
            {/*  </Title>*/}
            {/*</Box>*/}

            <Box
              direction="row"
              justify="between"
              width="560px"
              margin={{ vertical: 'large' }}
            >
              <LargeButton
                title="ETH -> ONE"
                description="(Math Wallet)"
                onClick={() => exchange.setMode(EXCHANGE_MODE.ETH_TO_ONE)}
                isActive={exchange.mode === EXCHANGE_MODE.ETH_TO_ONE}
              />
              <LargeButton
                title="ONE -> ETH"
                reverse={true}
                description="(ONE Wallet)"
                onClick={() => exchange.setMode(EXCHANGE_MODE.ONE_TO_ETH)}
                isActive={exchange.mode === EXCHANGE_MODE.ONE_TO_ETH}
              />
            </Box>

            <Exchange />

            {/*<Box*/}
            {/*  className={styles.walletBalancesContainer}*/}
            {/*>*/}
            {/*  <DisableWrap disabled={!user.isAuthorized}>*/}
            {/*    <WalletBalances />*/}
            {/*  </DisableWrap>*/}
            {/*</Box>*/}
          </Box>
          <WalletBalances />
        </Box>
      </PageContainer>
    </BaseContainer>
  );
});
