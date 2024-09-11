import { APP_METADATA_URI } from '@/config';

export const shootAsset = async (id: string) => {
  await fetch(`${APP_METADATA_URI}/burnhook/${id}`, {
    method: 'POST',
  });
  return true;
};
