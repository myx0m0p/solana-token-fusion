import { useCountDown } from 'ahooks';
import _padStart from 'lodash/padStart';
import _partialRight from 'lodash/partialRight';
import { memo } from 'react';

import type { Props } from './CountdownTimer.types';

import S from './CountdownTimer.module.scss';

const addPad = _partialRight(_padStart, 2, '0');

const Component: React.FC<Props> = ({ endTime = 0, onFinished, showDays }) => {
  const [timeLeft, date] = useCountDown({
    targetDate: endTime,
    onEnd: onFinished,
  });

  if (timeLeft <= 0) {
    return (
      <span className={S.timer}>
        <span>00</span>
        <span>:</span>
        <span>00</span>
        <span>:</span>
        <span>00</span>
      </span>
    );
  }

  return (
    <span className={date.days > 0 && showDays ? S.timerWithDays : S.timer}>
      {date.days > 0 && showDays && (
        <>
          <span>{date.days}d</span>
          <span>:</span>
        </>
      )}
      <span>
        {date.days > 0 && showDays
          ? addPad(String(date.hours))
          : addPad(String(date.hours + 24 * date.days))}
      </span>
      <span>:</span>
      <span>{addPad(String(date.minutes))}</span>
      <span>:</span>
      <span>{addPad(String(date.seconds))}</span>
    </span>
  );
};

export const CountdownTimer = memo(Component);
CountdownTimer.displayName = 'CountdownTimer';
