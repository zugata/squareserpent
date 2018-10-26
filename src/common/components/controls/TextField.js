import React from 'react';
import _ from 'lodash';
import upgradeMaterialElement from '../util/upgradeMaterialElement';
import getUniqueId from '../util/getUniqueId';

const HTML_VALIDATION_PROPS = ['required', 'pattern', 'max', 'min'];

/**
 * Props:
 * - id
 * - style
 * - className
 * - label: string|Component
 * - ...otherProps: passed on to <input>
 */
export default class TextField extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      loaded: false,
    };
  }

  componentDidMount() {
    // used to work around weird behavior in MDL on initialization - see below
    this.setState({loaded: true});
  }

  componentDidUpdate() {
    if (this.elem) {
      // for MDL to adjust label depending on value set/unset
      this.elem.MaterialTextfield.checkDirty();
    }
  }

  render() {
    const {label, id = getUniqueId(this), style, className, ...otherProps} = this.props;
    const {loaded} = this.state;

    // When MDL's textfield initializes, it applies validation states even on
    // clean inputs. So we hold off on setting validation attributes until after
    // MDL initializes. This will potentially be fixed in MDL v2.
    const inputProps = loaded ? otherProps : _.omit(otherProps, HTML_VALIDATION_PROPS);

    return (
      <div className={`${className || ''} mdl-textfield mdl-js-textfield mdl-textfield--floating-label`}
          style={style}
          ref={elem => {
            this.elem = elem;
            upgradeMaterialElement(elem, 'MaterialTextfield');
          }}>
        <input className="mdl-textfield__input" type="text" id={id} {...inputProps} />
        <label className="mdl-textfield__label" htmlFor={id}>{label}</label>
      </div>);
  }
}
