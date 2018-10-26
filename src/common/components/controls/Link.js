import React from 'react';

export default ({isNav, className, href, children, ...otherProps}) =>
  <a className={`${className || ''} ${isNav ? 'mdl-navigation__link' : ''}`}
      href={href || 'javascript: void 0'}
      {...otherProps}>
    {children}
  </a>;
