import React from 'react';

/**
 * Props:
 * - type: string
 * - small: boolean
 */
export default ({type, small}) =>
  <i className="material-icons"
      style={{fontSize: small ? '16px' : ''}}>
    {type}
  </i>;
