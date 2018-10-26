import React from 'react';

/**
 * Helper function taking any number of components and returning
 * an array of components that will result in the input components
 * being pulled right in the header.
 */
export default (...components) => {
  components.unshift(<div key='mdl-layout-spacer' className='mdl-layout-spacer' />);
  return components;
}
