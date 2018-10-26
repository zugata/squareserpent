import React from 'react';
import Modal from './layout/Modal';
import DocumentNameForm from './DocumentNameForm';

export default class DocumentNameModal extends React.Component {
  open() {
    this.refs.modal.open();
  }

  close() {
    this.refs.modal.close();
    this.refs.form.clear();
  }

  render() {
    const {dismissable, ...otherProps} = this.props;

    return (
      <Modal ref='modal' dismissable={dismissable}>
        <DocumentNameForm ref='form' {...otherProps} />
      </Modal>);
  }
}

DocumentNameModal.defaultProps = {
  dismissable: true
};
