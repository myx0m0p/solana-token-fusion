import { PropsWithChildren, ReactNode } from 'react';

type PropsForChildren = {
  close: () => void;
};

export type Props = {
  title?: string;
  className?: string;
  headerClassName?: string;
  menuClassName?: string;
  children: ReactNode | ((props: PropsForChildren) => ReactNode);
};

export type ItemProps = PropsWithChildren<{
  className?: string;
  onClick?: () => void;
}>;
