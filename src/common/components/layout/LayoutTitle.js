import React from 'react';

export default ({className, children, ...otherProps}) =>
  <span className={`${className || ''} mdl-layout-title`} {...otherProps}>
    {children}
  </span>;
