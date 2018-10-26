import React from 'react';
import upgradeMaterialElement from '../util/upgradeMaterialElement';

export default class Spinner extends React.Component {
  render() {
    const {active, multiColor} = this.props;

    return (
      <div
        className={
          `mdl-spinner ${multiColor ? '' : 'mdl-spinner--single-color'} ` +
          `mdl-js-spinner ${active ? 'is-active is-upgraded' : ''}`}
        ref={upgradeMaterialElement}
        style={{
          verticalAlign: 'middle',
          display: active ? '' : 'none'
        }} />
    );
  }
}
