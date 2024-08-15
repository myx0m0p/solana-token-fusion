export type NotificationType = 'error' | 'success' | 'info';

export type Props = {
  message: string;
  type?: NotificationType;
  txHash?: string;
};
