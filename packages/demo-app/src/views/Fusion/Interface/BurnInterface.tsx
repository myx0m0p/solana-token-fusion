import { memo, useMemo, useState } from 'react';

import { useWallet } from '@solana/wallet-adapter-react';
import { base58 } from '@metaplex-foundation/umi/serializers';

import { Notification } from '@/components/Notification';
import { Button } from '@/components/Button';

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
import { shootAsset } from '@/rpc/webhook';

type Props = {
  fusionData: FusionDataV1;
  refetchFusionData: () => Promise<QueryObserverResult<FusionDataV1, Error>>;
};
const Component: React.FC<Props> = ({ fusionData, refetchFusionData }) => {
  const [fusing, setFusing] = useState(false);
  const [asset, setAsset] = useState<AssetV1>();

  const umi = useUmi();

  const { connected, publicKey } = useWallet();

  const { data: accountData, refetch: refetchAccountData } = useAccountData({ publicKey, data: fusionData });

  const tokenAmount = useMemo(() => {
    return new TokenAmount(fusionData.feeData.escrowAmount, '$MUMU');
  }, [fusionData]);

  const isInsufficientFunds = useMemo(() => {
    if (!accountData || !accountData.data.exists) return true;
    return false;
  }, [accountData]);

  const buttonText = useMemo(() => {
    if (!fusionData) return 'Internal Error';
    if (!connected) return 'Connect Wallet';
    if (isInsufficientFunds) return 'Insufficient balance';
    if (!asset) return 'Select Mutardio';
    if (fusing) return 'Burning...';

    return 'Burn Mutardio';
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
      const res = await fusionFrom(umi, { data: fusionData, asset: asset.publicKey });
      const [mintHash] = base58.deserialize(res.signature);
      Notification.emit({
        message: 'Successfully burned your Mutardio',
        type: 'success',
        linkType: 'tx',
        linkDest: mintHash,
      });

      void shootAsset(asset.name.split('#')[1]);

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
          <div className={S.title}>The Transmumuter</div>
          <div className={S.description}>
            Sacrifice your Mutardio NFT to extract {tokenAmount.symbol} tokens. Beware, your Mutardio NFT will
            be lost forever.
          </div>
        </div>

        <div className={S.actionWrapper}>
          <div className={S.totalCost}>
            <span className={S.totalCostLabel}>Assset: </span>
            <span>{getAssetName(asset?.name)}</span>
          </div>

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
    </div>
  );
};

export const BurnInterface = memo(Component);
BurnInterface.displayName = 'BurnInterface';
