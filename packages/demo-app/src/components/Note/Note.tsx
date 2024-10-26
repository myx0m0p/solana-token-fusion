import { memo } from 'react';

import S from './Note.module.scss';

const Component: React.FC = () => (
  <div className={S.container}>
    <p className={S.title}>HOW TO MINT MUTARDIO NFT?</p>
    <p className={S.text}>Put 200,000 $MUMU into The Transmumuter and mint yourself a unique MUTARDIO NFT.</p>
    <p className={S.title}>HOW TO BURN MUTARDIO NFT?</p>
    <p className={S.text}>Put 1 MUTARDIO NFT into The Transmumuter and burn it to get 198,000 $MUMU back.</p>
    <p className={S.title}>WHAT IS MUTARDIO NFT MAX SUPPLY?</p>
    <p className={S.text}>3000 NFT</p>
  </div>
);

export const Note = memo(Component);
Note.displayName = 'Note';
