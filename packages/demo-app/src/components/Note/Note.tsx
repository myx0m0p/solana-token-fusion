import { memo } from 'react';

import S from './Note.module.scss';

const Component: React.FC = () => (
  <div className={S.container}>
    <p className={S.title}>
      Hear me out – MUMU is the problem. Bull run won&#39;t happen with this kind of mascot.
    </p>
    <p className={S.subtitle}>
      Look at you fuckers, where ya at? Bears are raping the market and all we got is stupid-ass normie MUMU.
      This gay bull is the problem. It’s time to fix that.
    </p>
    <p className={S.title_center}>
      Please welcome “MUTARDIO”. The real mascot of the bull run. Mint it with $MUMU. Wear it with pride!
    </p>
    <br />
    <p className={S.title}>HOW TO MINT MUTARDIO NFT?</p>
    <p className={S.text}>Put 500,000 $MUMU into The Transmumuter and mint yourself a unique MUTARDIO NFT.</p>
    <p className={S.title}>HOW TO BURN MUTARDIO NFT?</p>
    <p className={S.text}>Put 1 MUTARDIO NFT into The Transmumuter and burn it to get 495,000 $MUMU back.</p>
    <p className={S.title}>WHAT IS MUTARDIO NFT MAX SUPPLY?</p>
    <p className={S.text}>5000 NFT</p>
  </div>
);

export const Note = memo(Component);
Note.displayName = 'Note';
