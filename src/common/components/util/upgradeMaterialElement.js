const componentHandler = __CLIENT__ ? require('material-design-lite/material') : null;

/**
 * Null-safe, isomorphic-safe wrapper around MDL's `componentHandler.upgradeElement`.
 */
export default (elem, optClasses) => {
  if (componentHandler && elem) {
    if (!optClasses) {
      componentHandler.upgradeElement(elem);
    } else {
      for (const cls of (Array.isArray(optClasses) ? optClasses : [optClasses])) {
        componentHandler.upgradeElement(elem, cls);
      }
    }
  }
}
