const HEX_PREFIX = '0x';

/**
 * Checks if the value is a hex
 *
 * @param {string} value the value to check
 * @returns {boolean} if the value is a hex
 */
export function isHex(value: string): boolean {
  const hexRegex = /^[0-9A-Fa-f]{2,}$/;
  return hexRegex.test(value);
}

/**
 * Checks if given value is hex prefixed
 *
 * @param {string} value the value to check
 * @returns {boolean} if the value is hex prefixed
 */
export function isHexPrefixed(value: string) {
  return value.slice(0, 2) === HEX_PREFIX;
}

/**
 * Ensure value is hex prefixed
 *
 * @param {string} value the value to check
 * @returns {string} hex prefixed value
 */
export function addHexPrefix(value: string) {
  return isHexPrefixed(value) ? value : HEX_PREFIX + value;
}

/**
 * Removes hex prefix from given value
 *
 * @param {string} value the value to check
 * @returns {string} value without hex previx
 */
export function stripHexPrefix(value: string) {
  return isHexPrefixed(value) ? value.slice(2) : value;
}
