import React from 'react';

export default ({className, children, ...otherProps}) =>
  <header className={`${className || ''} mdl-layout__header`} {...otherProps}>
    {children}
  </header>;
