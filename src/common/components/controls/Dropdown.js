import React from 'react';
import upgradeMaterialElement from '../util/upgradeMaterialElement';
import getUniqueId from '../util/getUniqueId';

/**
 * Props:
 * - id: string
 * - label: string|Component
 * - anchorAt: bottom-left|bottom-right|...
 * - value: the selected value
 * - options: Represents the menu items. Should be a list of objects with the
 *   following properties:
 * 	 - value: the value of the options
 * 	 - key: optional; defaults to `value`. Serves as the React key for the
 * 	 	 menu item
 *   - displayValue: optional; defaults to `value`. If provided, used as the
 *     content of the menu item.
 * - onChange(value)
 */
export default class Dropdown extends React.Component {
  componentDidUpdate() {
    if (this.textFieldElem) {
      // for MDL to adjust label depending on value set/unset
      this.textFieldElem.MaterialTextfield.checkDirty();
    }
  }

  render() {
    const {
      label, id = getUniqueId(this), anchorAt, options, value,
      style, fieldStyle, inputStyle, iconStyle, onChange} = this.props;

    return <div style={{position: 'relative', ...style}}>
      <div id={id}
          className={`mdl-textfield mdl-js-textfield ${label ? 'mdl-textfield--floating-label' : ''}`}
          ref={elem => {
            this.textFieldElem = elem;
            upgradeMaterialElement(elem);
          }}
          style={{
            cursor: 'pointer',
            position: 'relative',
            ...fieldStyle
          }}>

        <input className="mdl-textfield__input"
            id={`${id}__input`}
            type="text"
            value={value}
            style={{
              cursor: 'pointer',
              ...inputStyle,
            }}
            readOnly />

        {
          label ?
            <label className="mdl-textfield__label" htmlFor={`${id}__input`}>{label}</label>
          :
            null
        }

        <i className="material-icons"
            style={{
              position: 'absolute',
              right: 0,
              top: '50%',
              fontSize: '125%',
              lineHeight: '1.2em',
              marginTop: '-0.6em',
              ...iconStyle,
            }}>
          expand_more
        </i>

      </div>

      <div className={`mdl-menu mdl-menu--${ anchorAt || 'bottom-left' } mdl-js-menu mdl-js-ripple-effect`}
          htmlFor={id}
          style={{
            color: 'rgba(0,0,0,.87)' /* from MDL */,
            maxHeight: 300,
            width: 200,
            overflowX: 'hidden',
            overflowY: 'auto'
          }}
          ref={upgradeMaterialElement}>

        {options.map(({value, key = value, displayValue = value}) =>
          <div className='mdl-menu__item'
              key={key}
              onClick={onChange && () => onChange(value)}>
            {displayValue}
          </div>)}

      </div>
    </div>;
  }
}
