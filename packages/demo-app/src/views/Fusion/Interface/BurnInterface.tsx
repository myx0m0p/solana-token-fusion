import { memo, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { base58 } from '@metaplex-foundation/umi/serializers';

import { Notification } from '@/components/Notification';
import { Button } from '@/components/Button';

import { NO_BREAK_SPACE } from '@/config';

import { useAccountData } from '@/rpc/user';
import { useUmi } from '@/providers/useUmi';

import { getErrorMessage } from '@/utils/getErrorMessage';
import { QueryObserverResult } from '@tanstack/react-query';
import { FusionDataV1 } from '@stf/token-fusion';
import { TokenAmount } from '@/utils/tokenAmount';

import S from './Interface.module.scss';
import { AssetV1 } from '@metaplex-foundation/mpl-core';
import { AssetSelector } from './AssetSelector';
import { getAssetName } from '@/utils/getAssetName';
import { fusionFrom } from '@/rpc/fusion';

type Props = {
  fusionData: FusionDataV1;
  refetchFusionData: () => Promise<QueryObserverResult<FusionDataV1, Error>>;
};
const Component: React.FC<Props> = ({ fusionData, refetchFusionData }) => {
  const [fusing, setFusing] = useState(false);
  const [asset, setAsset] = useState<AssetV1>();

  const umi = useUmi();

  const { connected, publicKey } = useWallet();

  const { data: accountData, refetch: refetchAccountData } = useAccountData(publicKey);

  const tokenAmount = useMemo(() => {
    return new TokenAmount(fusionData.tokenData.fromAmount);
  }, [fusionData]);

  const isInsufficientFunds = useMemo(() => {
    if (!accountData || !accountData.data.exists) return true;
    return false;
  }, [accountData]);

  const buttonText = useMemo(() => {
    if (!fusionData) return 'Internal Error';
    if (!connected) return 'Connect Wallet';
    if (isInsufficientFunds) return 'Insufficient balance';
    if (!asset) return 'Select Asset';
    if (fusing) return 'Fusing...';

    return 'Burn your Asset';
  }, [fusionData, connected, isInsufficientFunds, fusing, asset]);

  const buttonDisabled = useMemo(() => {
    // data checks
    if (!fusionData) return true;
    // account checks
    if (!connected || isInsufficientFunds) return true;
    // select checks
    if (!asset) return true;
    // status checks
    if (fusing) return true;
    // not disabled otherwise
    return false;
  }, [fusionData, connected, isInsufficientFunds, fusing, asset]);

  const handleFusion = async () => {
    if (!fusionData || isInsufficientFunds || !asset) return;

    setFusing(true);

    try {
      // executing fusion_from instruction
      const res = await fusionFrom(umi, asset.publicKey);
      const [mintHash] = base58.deserialize(res.signature);
      Notification.emit({
        message: 'Successfully fused your Asset',
        txHash: mintHash,
        type: 'success',
      });

      setFusing(false);
      setAsset(undefined);

      refetch();
    } catch (e: unknown) {
      console.error(e);
      setFusing(false);
      setAsset(undefined);

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
        <AssetSelector assets={accountData?.assets} selected={asset} onSelect={setAsset} />
      </div>

      <div className={S.contentSide}>
        <div>
          <div className={S.title}>Fusion From</div>
          <div className={S.description}>
            Burn your non-fungible asset to receive {tokenAmount.toFormattedAmount()} {tokenAmount.symbol}{' '}
            fungible tokens.
          </div>
        </div>

        <div className={S.availableToMint}>
          <span className={S.availableToMintLabel}>Assset: </span>
          <span>{getAssetName(asset?.name)}</span>
        </div>

        <div className={S.amountRow}>{NO_BREAK_SPACE}</div>

        <div className={S.totalCost}>
          <span className={S.totalCostLabel}>Receive: </span>
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

export const BurnInterface = memo(Component);
BurnInterface.displayName = 'BurnInterface';
