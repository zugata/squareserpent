import React from 'react';

export default ({className, children, style, ...otherProps}) =>
  <main className={`${className || ''} mdl-layout__content`}
        style={{display: 'flex', flexDirection: 'column', ...style}}
        {...otherProps}>
    {children}
  </main>;
