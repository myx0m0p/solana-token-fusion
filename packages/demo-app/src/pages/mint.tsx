import { Fusion } from '@/views/Fusion';
import { NextSeo } from 'next-seo';

export default function MintPage() {
  return (
    <>
      <NextSeo title='Mutardio | Mint' />
      <Fusion op='mint' />
    </>
  );
}
