import { AnchorHTMLAttributes, ButtonHTMLAttributes, PropsWithChildren } from 'react';

export type Sizes = 'small' | 'medium' | 'big' | 'wideBig';

type CommonProps = PropsWithChildren<{
  size: Sizes;
  isFilled?: boolean;
}>;

type ButtonProps = {
  type: 'submit' | 'button' | 'reset';
  isDisabled?: boolean;
} & Omit<ButtonHTMLAttributes<HTMLButtonElement>, 'type'> &
  CommonProps;

type LinkProps = {
  type: 'link';
  isExternal?: boolean;
} & AnchorHTMLAttributes<HTMLAnchorElement> &
  CommonProps;

export type Props = ButtonProps | LinkProps;
