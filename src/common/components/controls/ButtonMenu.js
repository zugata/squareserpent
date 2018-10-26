import React from 'react';
import Button from './Button';
import upgradeMaterialElement from '../util/upgradeMaterialElement';
import getUniqueId from '../util/getUniqueId';

/**
 * Props:
 * - id
 * - buttonContent
 * - buttonType: primary|accent|none
 * - flatButton: true|false
 * - buttonIcon: string
 * - buttonStyle
 * - anchorAt: bottom-left|bottom-right|...
 * - persistent: boolean. If true, clicks inside the menu will Note
 * 		cause it to close. Use for, e.g., popovers.
 */
export default class ButtonMenu extends React.Component {
  upgradeMenu(elem) {
    upgradeMaterialElement(elem, ['MaterialMenu', 'MaterialRipple']);

    // MDL menu listens for click on document to hide itself. In "persistent"
    // mode, we block that from happening. Note that React events can't do
    // this; all React events are handled at the document level.
    // TODO: check if we've done this already
    if (elem) {
      elem.addEventListener('click', e => {
        if (this.props.persistent) {
          e.stopPropagation();
        }
      });
    }
  }

  close() {
    if (document && document.body) {
      document.body.click();
    }
  }

  render() {
    const {
      id = getUniqueId(this), anchorAt, buttonContent, buttonStyle, buttonType,
      flatButton, buttonIcon, children
    } = this.props;

    return <div style={{position: 'relative'}}>
        <Button id={id}
            flat={!!flatButton}
            type={buttonType}
            icon={buttonIcon}
            ripple={false}
            style={buttonStyle}>
          {buttonContent}
        </Button>

        <div className={`mdl-menu mdl-menu--${ anchorAt || 'bottom-left' } mdl-js-menu mdl-js-ripple-effect`}
            htmlFor={id}
            style={{color: 'rgba(0,0,0,.87)' /* from MDL */}}
            ref={e => this.upgradeMenu(e)}>
          {children}
        </div>
      </div>;
  }
}
