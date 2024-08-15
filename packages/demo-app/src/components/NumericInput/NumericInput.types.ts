import { InputHTMLAttributes } from 'react';

type InputAttributes = Omit<InputHTMLAttributes<HTMLInputElement>, 'onChange'>;

export type Props = InputAttributes & {
  value: string;
  min: number;
  max: number;
  onChange: (value: string) => void;
};
