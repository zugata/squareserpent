import React from 'react';
import Modal from '../components/layout/Modal';
import Layout from '../components/layout/Layout';
import BasicHeader from '../components/BasicHeader';
import Button from '../components/controls/Button';

export default class NotFoundPage extends React.Component {
  componentDidMount() {
    this.refs.modal.open();
  }

  render() {
    const {history} = this.props;

    return (
      <Layout>
        <BasicHeader
          title="Templates"
          menuContent={[]}
          leftContent={[]}
          rightContent={[]}
        />

        <Modal ref="modal" dismissable={false}>
          <p>
            Sorry, we couldn{"'"}t find that page!
          </p>
          <div>
            <Button
                type="primary"
                flat={true}
                onClick={() => history.pushState(null, "/templates/editor")}>
              Back to Templates
            </Button>
          </div>
        </Modal>
      </Layout>
    );
  }
}
