import { memo } from 'react';
import { NextSeo } from 'next-seo';

import { APP_URL } from '@/config';

const Component: React.FC = () => {
  return (
    <>
      <NextSeo
        title='Token Fusion Protocol'
        // eslint-disable-next-line max-len
        description='Token Fusion Protocol is a decentralized protocol that allows users fuse spl tokens into asset and vice versa.'
        openGraph={{
          title: 'Token Fusion Protocol',
          description:
            'Token Fusion Protocol is a decentralized protocol that allows users fuse spl tokens into asset and vice versa.',
          images: [
            {
              url: `${APP_URL}/media/splash.jpg`,
              width: 600,
              height: 600,
              alt: 'TokenFusion',
              type: 'image/jpeg',
            },
          ],
          site_name: 'Token Fusion Protocol',
        }}
      />
    </>
  );
};

export const Head = memo(Component);
Head.displayName = 'Head';
