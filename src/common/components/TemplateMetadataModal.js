import React, {PropTypes} from 'react';
import _ from 'lodash';
import Modal from './layout/Modal';
import Button from './controls/Button';
import TextField from './controls/TextField';

export default ({template, onClose, onSubmit}) =>
  <Modal opened={!!template} onClose={onClose}>
    {
      template ?
        <TemplateMetadataModalContent
          key={template.name}
          template={template}
          onClose={onClose}
          onSubmit={onSubmit}
          />
      :
        null
    }
  </Modal>;

class TemplateMetadataModalContent extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      templateParams: _.pick(props.template, 'fromName', 'fromEmail', 'subject'),
      loading: false,
    };
  }

  handleParamChange(name, value) {
    this.setState({templateParams: {...this.state.templateParams, [name]: value}});
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({loading: true});
    this.props.onSubmit(this.state.templateParams);
  }

  render() {
    const {templateParams: {fromName, fromEmail, subject}, loading} = this.state;

    return <form onSubmit={this.handleSubmit.bind(this)}>
      <h5 style={{marginTop: 8, marginBottom: 12}}>Email Fields</h5>
      <TextField
        value={fromName}
        label='From Name'
        onChange={e => this.handleParamChange('fromName', e.target.value)}
        />
      <TextField
        value={fromEmail}
        label='From Email'
        onChange={e => this.handleParamChange('fromEmail', e.target.value)}
        />
      <TextField
        value={subject}
        label='Subject'
        onChange={e => this.handleParamChange('subject', e.target.value)}
        />
      <div style={{marginTop: 8}}>
        <Button
            type='primary'
            withSpinner={true}
            loading={loading}
            style={{marginRight: '1em'}}>
          Save
        </Button>
      </div>
    </form>;
  }
}
