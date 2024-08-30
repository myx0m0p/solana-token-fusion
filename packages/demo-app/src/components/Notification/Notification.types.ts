export type NotificationType = 'error' | 'success' | 'info';
export type LinkType = 'address' | 'tx';

export type Props = {
  message: string;
  type?: NotificationType;
  linkType?: LinkType;
  linkDest?: string;
};
