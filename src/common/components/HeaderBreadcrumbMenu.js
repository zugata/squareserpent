import React from 'react';
import ButtonMenu from './controls/ButtonMenu';
import Icon from './controls/Icon';
import MenuItem from './controls/MenuItem';
const PT = React.PropTypes;

/**
 * Represents one segment of the breadcrumbs in the Squareserpent header, which
 * expands into a menu of selections of alternate values for that breadcrumb.
 *
 * Props:
 * - value: the selected value
 * - onChange(value): called when a new value is selected
 * - label: content displayed at the top of the menu when it's expanded
 * - options: Represents the menu items. Should be a list of objects with the
 *   following properties:
 * 	 - value: the value of the options
 * 	 - key: optional; defaults to `value`. Serves as the React key for the
 * 	 	 menu item
 *   - displayValue: optional; defaults to `value`. If provided, used as the
 *     content of the menu item.
 *
 */
export default function HeaderBreadcrumbMenu({value, label, options, onChange}) {
  return (
    <ButtonMenu
        buttonContent={<span>
          {value} <Icon small type='expand_more' />
        </span>}
        flatButton={true}>
      <MenuItem disabled style={{color: 'rgba(0,0,0,.87)'}}>{label}</MenuItem>
      <div style={{maxHeight: 300, width: 200, overflowX: 'hidden', overflowY: 'auto'}}>
        {options.map(({value, key = value, displayValue = value}) =>
          <MenuItem key={key} onClick={onChange && () => onChange(value)}>{displayValue}</MenuItem>)}
      </div>
    </ButtonMenu>);
}

HeaderBreadcrumbMenu.propTypes = {
  value: PT.any,
  label: PT.any.isRequired,
  options: PT.arrayOf(
    PT.shape({
      value: PT.any.isRequired,
      key: PT.any,
      displayValue: PT.any
    })
  ).isRequired,
  onChange: PT.func
};
