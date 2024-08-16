import { memo, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { base58 } from '@metaplex-foundation/umi/serializers';

import { Notification } from '@/components/Notification';
import { Button } from '@/components/Button';

import { NO_BREAK_SPACE } from '@/config';

import { useAccountData } from '@/rpc/user';
import { useUmi } from '@/providers/useUmi';

import { Animation } from './Animation';
import { getErrorMessage } from '@/utils/getErrorMessage';
import { QueryObserverResult } from '@tanstack/react-query';
import { FusionDataV1 } from '@stf/token-fusion';
import { TokenAmount } from '@/utils/tokenAmount';

import S from './Interface.module.scss';
import { fusionInto } from '@/rpc/fusion';

type Props = {
  fusionData: FusionDataV1;
  refetchFusionData: () => Promise<QueryObserverResult<FusionDataV1, Error>>;
};
const Component: React.FC<Props> = ({ fusionData, refetchFusionData }) => {
  const [fusing, setFusing] = useState(false);

  const umi = useUmi();

  const { connected, publicKey } = useWallet();

  const { data: accountData, refetch: refetchAccountData } = useAccountData(publicKey);

  const tokenAmount = useMemo(() => {
    return new TokenAmount(fusionData.tokenData.intoAmount);
  }, [fusionData]);

  const isInsufficientFunds = useMemo(() => {
    if (
      !accountData ||
      !accountData.data.exists ||
      accountData.balance.amount.basisPoints < tokenAmount.amount.basisPoints
    )
      return true;
    return false;
  }, [accountData, tokenAmount]);

  const buttonText = useMemo(() => {
    if (!fusionData) return 'Internal Error';
    if (!connected) return 'Connect Wallet';
    if (isInsufficientFunds) return 'Insufficient balance';

    if (fusing) return 'Fusing...';

    return 'Mint new Asset';
  }, [fusionData, connected, isInsufficientFunds, fusing]);

  const buttonDisabled = useMemo(() => {
    // data checks
    if (!fusionData) return true;
    // account checks
    if (!connected || isInsufficientFunds) return true;
    // status checks
    if (fusing) return true;
    // not disabled otherwise
    return false;
  }, [fusionData, connected, isInsufficientFunds, fusing]);

  const handleFusion = async () => {
    if (!fusionData || isInsufficientFunds) return;

    setFusing(true);

    try {
      // executing fusion_into instruction
      const res = await fusionInto(umi);
      const [mintHash] = base58.deserialize(res.signature);
      Notification.emit({
        message: 'Successfully fused your Tokens',
        txHash: mintHash,
        type: 'success',
      });

      setFusing(false);

      refetch();
    } catch (e: unknown) {
      console.error(e);
      setFusing(false);

      Notification.emit({
        message: `Fusion error: ${getErrorMessage(e)}`,
        type: 'error',
      });
    }
  };

  const refetch = () => {
    void refetchFusionData();
    void refetchAccountData();
  };

  return (
    <div className={S.interface}>
      <div className={S.animationSide}>
        <Animation url='media/splash.jpg' />
      </div>

      <div className={S.contentSide}>
        <div>
          <div className={S.title}>Fusion Into</div>
          <div className={S.description}>
            Combine your {tokenAmount.toFormattedAmount()} {tokenAmount.symbol} fungible tokens into a single
            unique non-fungible asset.
          </div>
        </div>

        <div className={S.amountRow}>{NO_BREAK_SPACE}</div>
        <div className={S.amountRow}>{NO_BREAK_SPACE}</div>

        <div className={S.totalCost}>
          <span className={S.totalCostLabel}>Cost: </span>
          <span>
            {tokenAmount.toFormattedAmount()} {tokenAmount.symbol}
          </span>
        </div>

        <div className={S.buttonContainer}>
          <Button
            className={S.button}
            type='button'
            size='wideBig'
            onClick={() => {
              void handleFusion();
            }}
            isDisabled={buttonDisabled}
          >
            <span>{buttonText}</span>
          </Button>
        </div>
      </div>
    </div>
  );
};

export const MintInterface = memo(Component);
MintInterface.displayName = 'MintInterface';
