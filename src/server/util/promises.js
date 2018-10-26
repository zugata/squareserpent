/**
 * Wraps an expression (function call, method call, etc.) that takes a
 * node-style callback (i.e., fn(err, result)) and returns a corresponding
 * ES6 Promise.
 *
 * Takes a function which itself takes a node-style callback, and returns
 * a promise tied to the outcome of that callback.
 *
 * @example
 *    return wrapNodeback(cb => fs.readFile("foo.txt", cb));
 *
 * @param {function(function(*, *))} func the function that will pass the
 *    node-style callback into the expression
 * @returns {Promise} a promise tied to the outcome of the node-style
 *    callback
 */
export function wrapNodeback(func) {
  return new Promise((resolve, reject) => {
    func((err, result) => {
      if (err) {
        reject(err);
      } else {
        resolve(result);
      }
    });
  });
}
