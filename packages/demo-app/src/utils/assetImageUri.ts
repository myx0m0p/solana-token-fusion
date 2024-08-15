import { APP_METADATA_URI } from '@/config';

export const assetImageUri = (uri: string) => {
  const id = uri.split('/')[uri.split('/').length - 1];
  return `${APP_METADATA_URI.replaceAll('/metadata/', '/image/')}${id}`;
};
