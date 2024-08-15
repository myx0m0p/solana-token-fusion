import { ChangeEvent, memo } from 'react';
import cn from 'classnames';

import S from './NumericInput.module.scss';
import type { Props } from './NumericInput.types';

const Component: React.FC<Props> = (props) => {
  const { value, min, max, className, onChange, readOnly, ...rest } = props;

  const handleInputChange = (event: ChangeEvent<HTMLInputElement>) => {
    event.preventDefault();

    let result = event.target.value;

    // Print without validation
    if (result === '-') {
      onChange(result);
      return;
    }

    // Exclude values that cannot be a valid number
    // Don't exclude values with dot in the end like 123.
    // Don't exclude values with zero padding in the begging like 0001
    const regex = /^(-(?!\.))?[0-9]*\.?[0-9]*$/;
    if (!regex.test(result)) return;

    // Exclude values with zero padding in the begging like 0001
    if (/^-?00/.test(result)) return;

    // if max value is one positive digit
    // but input ChangeEvent got two digits
    // the second digit will overwrite the first one
    // ex. range is 0 - 5, current value is '2', you typed digit '3'
    // ChangeEvent got '23', the code above will omit '2' and return '3'
    // it let you type values faster instead of select and overwrite them
    if (max && max >= 0 && max <= 9) {
      if (!result.includes('-') && result.length === 2) {
        result = result[result.length - 1];
      }
    }

    // Round values above the top bound
    if (max && Number(result) > max) {
      onChange(String(max));
      return;
    }

    // Round values below the bottom bound
    if (min && Number(result) < min) {
      onChange(String(min));
      return;
    }

    // Print without validation
    if (result[result.length - 1] === '.') {
      onChange(result);
      return;
    }

    // Converting value to number format string
    // ex. .2 will be 0.2, 2.0 will be 2
    const resultAsNumber = Number(result);

    onChange(String(resultAsNumber));
  };

  const decrease = () => {
    if (Number(value) <= min) {
      onChange(String(min));
      return;
    }

    const subtract = Number(value) - 1;
    onChange(String(subtract));
  };

  const increase = () => {
    if (Number(value) >= max) {
      onChange(String(max));
      return;
    }

    const add = Number(value) + 1;
    onChange(String(add));
  };

  const maximize = () => {
    onChange(String(max));
  };

  return (
    <div className={cn(S.numericInput, className)}>
      <button
        type='button'
        onClick={decrease}
        className={cn(S.decreaseButton, { [S.isDisabled]: Number(value) === min })}
      />
      {/* eslint-disable-next-line jsx-a11y/label-has-associated-control */}
      <label className={S.inputContainer}>
        <input
          {...rest}
          type='text'
          inputMode='numeric'
          readOnly={readOnly}
          className={S.input}
          onChange={handleInputChange}
          value={String(value)}
        />
      </label>
      <button
        type='button'
        onClick={increase}
        className={cn(S.increaseButton, { [S.isDisabled]: Number(value) === max })}
      />
      <button
        type='button'
        onClick={maximize}
        className={cn(S.maxButton, { [S.isDisabled]: Number(value) === max })}
      >
        Max
      </button>
    </div>
  );
};

export const NumericInput = memo(Component);
NumericInput.displayName = 'NumericInput';
