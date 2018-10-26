import React from 'react';
import TextField from './controls/TextField.js'
import Button from './controls/Button';

/**
 * Props:
 * - submit(name): should return a promise for completion
 * - message - optional.
 * - inputLabel, buttonLabel
 */
export default class DocumentNameForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      name: this.props.initialName || '',
      loading: false
    };
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ loading: true });

    Promise.resolve(this.props.submit(this.state.name))
      .then(() => this.clear())
      .catch(() => this.setState({ loading: false }));
  }

  clear() {
    this.setState({
      name: this.props.initialName || '',
      loading: false
    });
  }

  handleNameChange(e) {
    this.setState({ name: e.target.value });
  }

  render() {
    const {inputLabel, buttonLabel, message} = this.props;

    return <form onSubmit={e => this.handleSubmit(e)}>
      {message ? <p>{message}</p> : null}

      <TextField
        label={inputLabel}
        value={this.state.name}
        onChange={e => this.handleNameChange(e)}
        required />

      <Button type="primary" withSpinner={true} loading={this.state.loading}>
        {buttonLabel}
      </Button>
    </form>;
  }
}
