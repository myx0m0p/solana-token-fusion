import { memo } from 'react';
import { NextSeo } from 'next-seo';

import { APP_URL } from '@/config';

const Component: React.FC = () => {
  return (
    <>
      <NextSeo
        title='Mutardio'
        // eslint-disable-next-line max-len
        description='Mutardio in control.'
        openGraph={{
          title: 'Mutardio',
          description: 'Mutardio in control.',
          images: [
            {
              url: `${APP_URL}/media/splash.png`,
              width: 600,
              height: 315,
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
