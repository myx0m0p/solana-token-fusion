import { isBrowser } from './isBrowser';

export function isMobileDevice() {
  if (!isBrowser()) return false;
  return window.innerWidth <= 768;
}
