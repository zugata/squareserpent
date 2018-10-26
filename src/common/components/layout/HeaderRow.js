import React from 'react';

export default ({className, children, ...otherProps}) => {
  const buttonSelector = ".mdl-button:not(.mdl-button--raised):not(.mdl-button--accent):not(.mdl-button--colored):not(.mdl-button--primary):not([disabled])";

  return <div className={`${className || ''} mdl-layout__header-row`} {...otherProps}>
    <style dangerouslySetInnerHTML={{__html:
    /* MDL doesn't account for the fact that the button's color declaration
        conflicts with the color specified by the header */
    `
      .mdl-layout__header-row ${buttonSelector} {
        color: inherit;
      }
    `}} />
    {children}
  </div>;
}
