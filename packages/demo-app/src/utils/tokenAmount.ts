import { createAmount } from '@metaplex-foundation/umi';

export class TokenAmount {
  private _a;
  private _h;
  private _f;

  constructor(amount: bigint, symbol = 'STF', decimals = 9) {
    this._a = createAmount(amount, symbol, decimals);
    this._h = Intl.NumberFormat('en', { notation: 'compact' });
    this._f = Intl.NumberFormat('en');
  }

  get amount() {
    return this._a;
  }

  get symbol() {
    return this._a.identifier;
  }

  get decimals() {
    return this._a.decimals;
  }

  public toHumanReadable(): string {
    return this._h.format(this._a.basisPoints / 10n ** BigInt(this._a.decimals));
  }

  public toFormattedAmount(): string {
    return this._f.format(this._a.basisPoints / 10n ** BigInt(this._a.decimals));
  }
}
