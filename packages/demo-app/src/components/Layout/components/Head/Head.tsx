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
          description:
            'Mutardio is the real mascot of the bull run. Mint him or burn – all hail to the Saylor',
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
