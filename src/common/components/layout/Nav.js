import React from 'react';

export default ({className, children, ...otherProps}) =>
  <nav className={`${className || ''} mdl-navigation`} {...otherProps}>
    {children}
  </nav>;
