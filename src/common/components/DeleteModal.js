import React from 'react';
import Modal from './layout/Modal';
import Button from './controls/Button';

/**
 * Props:
 * - objectName: string
 * - execute(): should return a promise for completion
 */
export default class DeleteModal extends React.Component {
  constructor(props) {
    super(props);

    this.state = {loading: false};
  }

  open() {
    this.refs.modal.open();
  }

  close() {
    this.refs.modal.close();
  }

  execute() {
    this.setState({loading: true});

    Promise.resolve(this.props.execute())
      .then(() => {
        this.setState({loading: false});
        this.close()
      })
      .catch(() =>
        this.setState({loading: false}));
  }

  render() {
    const {objectName} = this.props;
    return (
      <Modal ref='modal'>
        <p>
          Are you sure you want to delete {objectName}?
        </p>
        <div>
          <Button
              type='accent'
              withSpinner={true}
              loading={this.state.loading}
              style={{marginRight: '1em'}}
              onClick={() => this.execute()}>
            Delete
          </Button>
          <Button
              flat={true}
              onClick={() => this.close()}>
            Cancel
          </Button>
        </div>
      </Modal>);
  }
}
