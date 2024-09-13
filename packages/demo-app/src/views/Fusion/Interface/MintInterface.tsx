import { memo, useMemo, useState } from 'react';
import { QueryObserverResult } from '@tanstack/react-query';

import { useWallet } from '@solana/wallet-adapter-react';
import { unwrapOption } from '@metaplex-foundation/umi';

import { FusionDataV1 } from '@stf/token-fusion';

import { Notification } from '@/components/Notification';
import { Button } from '@/components/Button';

import { useUmi } from '@/providers/useUmi';
import { fusionInto, useCollectionData } from '@/rpc/fusion';
import { useAccountData } from '@/rpc/user';
import { TokenAmount } from '@/utils/tokenAmount';
import { getErrorMessage } from '@/utils/getErrorMessage';

import { Animation } from './Animation';

import S from './Interface.module.scss';

type Props = {
  fusionData: FusionDataV1;
  refetchFusionData: () => Promise<QueryObserverResult<FusionDataV1, Error>>;
};
const Component: React.FC<Props> = ({ fusionData, refetchFusionData }) => {
  const [fusing, setFusing] = useState(false);

  const umi = useUmi();

  const { connected, publicKey } = useWallet();

  const { data: accountData, refetch: refetchAccountData } = useAccountData({ publicKey, data: fusionData });
  const { data: collectionData, refetch: refetchCollectionData } = useCollectionData(fusionData.collection);

  const tokenAmount = useMemo(() => {
    return new TokenAmount(
      fusionData.feeData.escrowAmount + fusionData.feeData.feeAmount + fusionData.feeData.burnAmount,
      '$MUMU'
    );
  }, [fusionData]);

  const isMintLimit = useMemo(() => {
    if (!collectionData) return false;
    return (
      collectionData.currentSize >=
      unwrapOption(fusionData.assetData.maxSupply, () => Number.POSITIVE_INFINITY)
    );
  }, [fusionData, collectionData]);

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
    if (!collectionData) return 'Internal Error';
    if (!connected) return 'Connect Wallet';
    if (isInsufficientFunds) return 'Insufficient balance';
    if (isMintLimit) return 'No more left';

    if (fusing) return 'Minting...';

    return 'Mint Mutardio';
  }, [fusionData, collectionData, connected, isInsufficientFunds, isMintLimit, fusing]);

  const buttonDisabled = useMemo(() => {
    // data checks
    if (!fusionData) return true;
    if (!collectionData) return true;
    // account checks
    if (!connected || isInsufficientFunds) return true;
    // mint limit check
    if (isMintLimit) return true;
    // status checks
    if (fusing) return true;
    // not disabled otherwise
    return false;
  }, [fusionData, collectionData, connected, isInsufficientFunds, isMintLimit, fusing]);

  const handleFusion = async () => {
    if (!fusionData || !collectionData || isInsufficientFunds) return;

    setFusing(true);

    try {
      // executing fusion_into instruction
      const { asset, tx } = fusionInto(umi, { data: fusionData });
      await tx;
      Notification.emit({
        message: 'Go check your new Mutardio',
        type: 'success',
        linkType: 'address',
        linkDest: asset.publicKey,
      });

      setFusing(false);

      refetch();
    } catch (e: unknown) {
      console.error(e);
      setFusing(false);

      Notification.emit({
        message: `Minting error: ${getErrorMessage(e)}`,
        type: 'error',
      });
    }
  };

  const refetch = () => {
    void refetchFusionData();
    void refetchAccountData();
    void refetchCollectionData();
  };

  return (
    <div className={S.interface}>
      <div className={S.animationSide}>
        <Animation url='media/splash.gif' />
      </div>

      <div className={S.contentSide}>
        <div>
          <div className={S.title}>The Transmumuter</div>
          <div className={S.description}>Use {tokenAmount.symbol} tokens to mint a unique Mutardio NFT.</div>
        </div>

        <div className={S.actionWrapper}>
          <div className={S.totalCost}>
            <span className={S.totalCostLabel}>Remaining: </span>
            <span>
              {collectionData?.currentSize} /{' '}
              {unwrapOption(fusionData.assetData.maxSupply, () => Number.POSITIVE_INFINITY)}
            </span>
          </div>
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
    </div>
  );
};

export const MintInterface = memo(Component);
MintInterface.displayName = 'MintInterface';
