const falseRe = /^\s*(?:false|no|0)\s*$/i;

/**
 * @example
 * 		> stringAsBoolean("yes")
 *    true
 *    > stringAsBoolean("anything")
 *    true
 *    > stringAsBoolean(null)
 *    false
 *    > stringAsBoolean("no")
 *    false
 *    > stringAsBoolean("false")
 *    false
 *    > stringAsBoolean("0")
 *    false
 */
export function stringAsBoolean(s) {
  return s ? !falseRe.test(s) : false;
}

export function stripPrefix(s, prefix) {
  return s.lastIndexOf(prefix, 0) === 0 ? s.substring(prefix.length) : s;
}

export function stripSuffix(s, suffix) {
  return s.indexOf(suffix, s.length - suffix.length) === -1 ? s : s.slice(0, -suffix.length);
}

export function ensureSuffix(s, suffix) {
  return s.indexOf(suffix, s.length - suffix.length) === -1 ? s + suffix : s;
}
