import { memo } from 'react';
import { NextSeo } from 'next-seo';

import { APP_URL } from '@/config';

const Component: React.FC = () => {
  return (
    <>
      <NextSeo
        title='Mutardio'
        // eslint-disable-next-line max-len
        description=''
        openGraph={{
          title: 'Mutardio',
          description: '',
          images: [
            {
              url: `${APP_URL}/media/splash.jpg`,
              width: 600,
              height: 600,
              alt: 'Mutardio',
              type: 'image/jpeg',
            },
          ],
          site_name: 'Mutardio',
        }}
      />
    </>
  );
};

export const Head = memo(Component);
Head.displayName = 'Head';
