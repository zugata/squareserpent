import React from 'react';

export default class Layout extends React.Component {
  render() {
    const {className, children, ...otherProps} = this.props;

    return (
      <div className={`${className || ''} mdl-layout mdl-layout--fixed-header`} {...otherProps}>
        {children}
      </div>);
  }
}
