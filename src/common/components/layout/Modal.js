import React from 'react';
import _ from 'lodash';

/**
 * Props:
 * - opened
 * - children
 * - dismissable: true|false. Defaults to `true`.
 * - style: set on floating <div/>
 * - onClose
 */
export default class Modal extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      // DEPRECATED
      open: false
    };
  }

  open() {
    // DEPRECATED
    this.setState({open: true});
  }

  close() {
    // DEPRECATED
    this.setState({open: false});
    this.props.onClose();
  }

  handleDismiss() {
    if (this.props.dismissable) {
      this.close();
    }
  }

  render() {
    const transition = 'all .3s';
    const {opened = this.state.open, style, children} = this.props;

    return (
      // This is a really quick implementation of a modal. MDL doesn't
      // currently provide any
      // TODO replace with ... something
      <div style={{
            position: 'fixed',
            visibility: opened ? 'visible' : 'hidden',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: `rgba(0,0,0, ${opened ? ".7" : "0"})`,
            transition: transition,
            zIndex: 1000
          }}
          onClick={() => this.handleDismiss()}>
        <div style={{
          width: '100%',
          height: opened ? '30%' : '25%',
          transition: transition
        }} />
        <div style={
            _.assign({
              margin: '0 auto',
              backgroundColor: 'white',
              borderRadius: 4,
              opacity: opened ? 1 : 0,
              transition: transition,
              width: 300,
              padding: '1em',
            }, style)}
            onClick={e => e.stopPropagation()}>
          {children}
        </div>
      </div>
    );
  }
}

Modal.defaultProps = {
  dismissable: true,
  onClose: _.noop,
};
