import _ from 'lodash';
import React from 'react';
import Spinner from './Spinner';
import upgradeMaterialElement from '../util/upgradeMaterialElement';

/**
 * Props:
 * - className
 * - flat = true|false
 * - ripple = true|false - defaults to true
 * - type = primary|accent|none
 * - icon: string. If provided, overrides any children
 * - withSpinner: true|false
 * - multiColorSpinner: true|false
 * - loading: true|false. When `true`, a loading indicator is shown.
 * 			`withSpinner` must be set to true (even when `loading` is false) in
 * 			order to use this.
 * - ...otherProps - forwarded to <button>
 */
export default class Button extends React.Component {
  render() {
    // TODO: incorporate flat & ripple into button types instead of/in addition to
    // exposing them directly
    const {
      className, style, icon, children, ref, flat, ripple = true, type, withSpinner,
      multiColorSpinner, loading, ...otherProps
    } = this.props;

    let extraClasses = '';

    if (!flat) {
      extraClasses += ' mdl-button--raised';
    }

    switch (type) {
      case 'primary':
        extraClasses += ' mdl-button--primary';
        break;
      case 'accent':
        extraClasses += ' mdl-button--accent';
        break;
    }

    if (icon) {
      extraClasses += ' mdl-button--icon';
    } else if (ripple) {
      extraClasses += ' mdl-js-ripple-effect';
    }

    return <div style={{position: 'relative', display: 'inline-block'}}>
      <button {...otherProps}
          style={_.assign({
            lineHeight: withSpinner ? '32px' : '',
            visibility: withSpinner && loading ? 'hidden' : ''
          }, style)}
          className={`${className || ''} mdl-button mdl-js-button ${extraClasses}`}
          ref={upgradeMaterialElement}>
        {icon ? <i className="material-icons">{icon}</i> : children}
      </button>

      {
        withSpinner && loading ?
          <div style={{
                position: 'absolute',
                left: 0,
                top: 0,
                bottom: 0,
                right: 0,
                textAlign: 'center'
              }}>
            <Spinner active={true} multiColor={multiColorSpinner} />
          </div>
        : null
      }
    </div>;
  }
}
