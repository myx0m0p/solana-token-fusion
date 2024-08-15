import { MouseEvent } from 'react';
import cn from 'classnames';
import Link from 'next/link';

import S from './Button.module.scss';
import type { Props } from './Button.types';

export const Button: React.FC<Props> = (props) => {
  const handleButtonClick = (event: MouseEvent<HTMLButtonElement>) => {
    if (props.type === 'link' || props.isDisabled) return;
    props.onClick?.(event);
  };

  switch (props.type) {
    case 'link': {
      const {
        className,
        isFilled = true,
        children,
        size = 'medium',
        href = '/mock',
        isExternal,
        ...rest
      } = props;

      if (isExternal) {
        return (
          <a
            rel='noreferrer noopener'
            target='_blank'
            {...rest}
            href={href}
            className={cn(S.button, className, S[size], {
              [S.isFilled]: isFilled,
            })}
          >
            {children}
          </a>
        );
      }

      return (
        <Link href={href} passHref>
          <a
            {...rest}
            className={cn(S.button, className, S[size], {
              [S.isFilled]: isFilled,
            })}
          >
            {children}
          </a>
        </Link>
      );
    }

    default: {
      const { isDisabled, className, isFilled = true, children, size = 'medium', ...rest } = props;

      const content = (() => {
        return children;
      })();

      return (
        <button
          {...rest}
          onClick={handleButtonClick}
          className={cn(S.button, className, S[size], {
            [S.isFilled]: isFilled,
            [S.isDisabled]: isDisabled,
          })}
        >
          {content}
        </button>
      );
    }
  }
};
