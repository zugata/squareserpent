import React from 'react';

export default ({className, children, ...otherProps}) =>
  <div className={`${className || ''} mdl-menu__item`} {...otherProps}>
    {children}
  </div>;
