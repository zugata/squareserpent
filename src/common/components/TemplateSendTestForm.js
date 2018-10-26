import React from 'react';
import Button from './controls/Button';
import TextField from './controls/TextField';
import Dropdown from './controls/Dropdown';
import Spinner from './controls/Spinner';

/**
 * Props:
 * - sampleDataNames: Array<string>; required.
 * - initialSampleDataName, initialEmailAddress: string; optional.
 * - send({emailAddress, sampleDataName}) - should return a promise for
 * 		completion
 */
export default class TemplateSendTestForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = { loading: false };
  }

  getCurrentEmailAddress() {
    return this.state.inputEmailAddress !== undefined ? this.state.inputEmailAddress
      : this.props.initialEmailAddress || null;
  }

  getCurrentSampleDataName() {
    if (this.state.inputSampleDataName !== undefined) {
      return this.state.inputSampleDataName;
    } else {
      let defaultSampleDataName = this.props.initialSampleDataName;
      if (!defaultSampleDataName) {
        const {sampleDataNames} = this.props;
        defaultSampleDataName = sampleDataNames && sampleDataNames[0] || null;
      }
      return defaultSampleDataName;
    }
  }

  clear() {
    this.setState({
      inputEmailAddress: undefined,
      inputSampleDataName: undefined,
      loading: false
    });
  }

  handleEmailAddressChange(e) {
    this.setState({ inputEmailAddress: e.target.value });
  }

  handleSampleDataChange(inputSampleDataName) {
    this.setState({ inputSampleDataName });
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ loading: true });

    Promise.resolve(
      this.props.send({
        emailAddress: this.getCurrentEmailAddress(),
        sampleDataName: this.getCurrentSampleDataName()
      }))
    .then(() => this.clear())
    .catch(() => this.setState({ loading: false }));

  }

  render() {
    return (
      <form className='TemplateSendTestForm' onSubmit={e => this.handleSubmit(e)} style={{padding: '0 1em 1em'}}>

        {this.props.sampleDataNames.length > 0 ?
          <Dropdown
            label="Sample Data"
            value={this.getCurrentSampleDataName()}
            options={this.props.sampleDataNames.map(name => ({value: name}))}
            onChange={value => this.handleSampleDataChange(value)}
          />
          : null}

        <TextField
          label='Email Address'
          value={this.getCurrentEmailAddress()}
          onChange={v => this.handleEmailAddressChange(v)}
          required
        />

        <Button type='primary' withSpinner={true} loading={this.state.loading}>
          Send
        </Button>

      </form>);
  }
}
