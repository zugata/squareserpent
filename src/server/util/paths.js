import * as path from 'path';

/**
 * Like Python's `os.path.splitext`. Splits a path into a two parts:
 * everything up to the extension and the extension itself.
 *
 * @example
 *    > splitext('foo/bar/baz.txt')
 *    ['foo/bar/baz', '.txt']
 *    > splitext('foo/bar')
 *    ['foo/bar', '']
 *    > splitext('.bleh')
 *    ['.bleh', '']
 */
export function splitext(filepath) {
   const ext = path.extname(filepath);
   const basepath = ext.length > 0 ? filepath.slice(0, -ext.length) : filepath;
   return [basepath, ext];
}
