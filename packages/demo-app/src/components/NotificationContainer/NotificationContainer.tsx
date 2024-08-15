import { cssTransition, ToastContainer } from 'react-toastify';

import { timeUnit } from '@/utils/timeUnit';

import S from './NotificationContainer.module.scss';

const bounce = cssTransition({
  enter: 'animate__animated animate__bounceIn',
  exit: 'animate__animated animate__bounceOut',
});

export const NotificationContainer = () => (
  <ToastContainer
    closeButton={false}
    autoClose={timeUnit.s(5).toMs()}
    newestOnTop
    pauseOnHover
    draggable={false}
    pauseOnFocusLoss={false}
    closeOnClick={false}
    limit={4}
    className={S.toastContainer}
    toastClassName={S.toast}
    bodyClassName={S.toastBody}
    progressClassName={S.progressBar}
    transition={bounce}
  />
);
