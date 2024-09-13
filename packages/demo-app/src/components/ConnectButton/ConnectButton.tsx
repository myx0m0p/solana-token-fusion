import { memo } from 'react';
import dynamic from 'next/dynamic';

const WalletMultiButtonDynamic = dynamic(
  async () => (await import('@solana/wallet-adapter-react-ui')).WalletMultiButton,
  { ssr: false }
);

type ButtonSize = 'lg' | 'sm';
type Props = {
  size: ButtonSize;
};
const Component: React.FC<Props> = ({ size = 'lg' }) => {
  const fontSize = size === 'lg' ? '15px' : '12px';
  return (
    // This fucking button don't accept className as param, so lets hardcode stuff
    <WalletMultiButtonDynamic
      style={{
        color: '#000',
        height: '44px',
        padding: '12px 20px 10px',
        fontWeight: '700',
        fontSize,
        lineHeight: '1.25',
        borderRadius: 0,
        border: '2px solid #eaaa00',
        backgroundColor: '#f2f2ed',
        fontFamily: 'Indie Flower, sans-serif',
      }}
    />
  );
};

export const ConnectButton = memo(Component);
ConnectButton.displayName = 'ConnectButton';
