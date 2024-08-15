import { useMemo } from 'react';
import { toast } from 'react-toastify';

import { ClusterExplorer } from '@/config';

import { Icon } from '@/components/Icon';

import S from './Notification.module.scss';
import type { Props } from './Notification.types';

export const Notification = ({ message, txHash }: Props) => {
  const txURL = useMemo(() => {
    return ClusterExplorer.tx(txHash).link;
  }, [txHash]);

  return (
    <div className={S.popup}>
      <div className={S.info}>
        {message}
        {txHash && (
          <a href={txURL} target='_blank' rel='noreferrer noopener' className={S.link}>
            View in Explorer <Icon className={S.icon} kind='external-link' />
          </a>
        )}
      </div>
    </div>
  );
};

Notification.emit = (options: Props) => {
  if (options.type === 'error') {
    toast.error(<Notification {...options} />, { icon: false });
  } else if (options.type === 'success') {
    toast.success(<Notification {...options} />, { icon: false });
  } else {
    toast.info(<Notification {...options} />, { icon: false });
  }
};
