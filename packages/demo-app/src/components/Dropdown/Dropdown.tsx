import { useRef, useState } from 'react';

import { useClickAway } from 'ahooks';
import cn from 'classnames';
import { OverlayScrollbarsComponent } from 'overlayscrollbars-react';

import { ArrowIcon } from './Icon';
import S from './Dropdown.module.scss';
import type { Props, ItemProps } from './Dropdown.types';

export const Dropdown = (props: Props) => {
  const { title, children, className, headerClassName, menuClassName } = props;
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const toggle = () => setIsOpen((prevState) => !prevState);
  const close = () => setIsOpen(false);

  useClickAway(close, dropdownRef);

  return (
    <div className={cn(S.root, className)} ref={dropdownRef}>
      <button
        type='button'
        onClick={toggle}
        className={cn(S.header, headerClassName, { [S.isOpen]: isOpen })}
      >
        <span className={S.title}>{title}</span>
        <ArrowIcon />
      </button>

      {isOpen && (
        <div className={cn(S.menu, menuClassName)}>
          <OverlayScrollbarsComponent className={S.content}>
            {typeof children === 'function' ? children({ close }) : children}
          </OverlayScrollbarsComponent>
        </div>
      )}
    </div>
  );
};

// eslint-disable-next-line react/display-name
Dropdown.Item = (props: ItemProps) => {
  const { className, children, onClick } = props;
  const isClickable = typeof onClick === 'function';

  return (
    <div className={cn(S.item, className, { [S.isClickable]: isClickable })} onClick={onClick}>
      {children}
    </div>
  );
};
