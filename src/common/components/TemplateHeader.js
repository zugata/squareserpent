import React from 'react';
import Button from './controls/Button';
import ButtonMenu from './controls/ButtonMenu';
import MenuItem from './controls/MenuItem';
import TemplateSendTestForm from './TemplateSendTestForm';
import HeaderBreadcrumbMenu from './HeaderBreadcrumbMenu';
import BasicHeader from './BasicHeader';

/**
 * Props:
 * - currentAction: editor|preview|...
 * - currentProjectName
 * - currentTemplateName
 * - templateNames: Array<string>
 * - projectNames: Array<string>
 * - saveDisabled: true|false
 * - onViewSendTest(), onTogglePreview(), onNewTemplate(name),
 * 		onProjectChange(envName), onTemplateChange(templateName),
 * 		onViewSampleData(), onCopy(), onRename(), onDelete(),
 * - save(), publish(): should return promises for completion
 */
export default class TemplateHeader extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      saving: false,
      publishing: false
    };
  }

  handleSend(emailAddress) {
    this.refs.sendTestMenu.close();
    this.props.onSendTest(emailAddress);
  }

  doWithLoading(propMethodName, loadingStateKey) {
    this.setState({ [loadingStateKey]: true });
    const finish = () => this.setState({ [loadingStateKey]: false });

    Promise.resolve(this.props[propMethodName]()).then(finish, finish);
  }

  handleSave() {
    this.doWithLoading('save', 'saving');
  }

  handlePublish() {
    this.doWithLoading('publish', 'publishing');
  }

  render() {
    return <BasicHeader
      title="Template"
      menuContent={[
        <MenuItem key='new' onClick={this.props.onNewTemplate}>New...</MenuItem>,
        <MenuItem key='copy' onClick={this.props.onCopy}>Copy...</MenuItem>,
        <MenuItem key='rename' onClick={this.props.onRename}>Rename...</MenuItem>,
        <MenuItem key='metadata' onClick={this.props.onEditMetadata}>Edit Email Fields...</MenuItem>,
        <MenuItem key='sample-data' onClick={this.props.onViewSampleData}>Configure Sample Data...</MenuItem>,
        <MenuItem key='delete' onClick={this.props.onDelete}>Delete</MenuItem>
      ]}
      leftContent={[
        <HeaderBreadcrumbMenu
          key='envSelect'
          label='Select Project:'
          value={this.props.currentProjectName}
          options={this.props.projectNames.map(name => ({value: name}))}
          onChange={this.props.onProjectChange} />,
        "/",
        <HeaderBreadcrumbMenu
          key='templateSelect'
          label='Select Template:'
          value={this.props.currentTemplateName}
          options={this.props.templateNames.map(name => ({value: name}))}
          onChange={this.props.onTemplateChange} />
      ]}
      rightContent={[
        <Button
            key='previewButton'
            flat={true}
            onClick={this.props.onTogglePreview}>
          {this.props.currentPageAction === 'preview' ? 'Exit' : ''} Preview
        </Button>,
        <Button
            key='sendTestButton'
            flat={true}
            onClick={this.props.onViewSendTest}>
          Send Test
        </Button>,
        <Button
            key='saveButton'
            type="accent"
            flat={true}
            withSpinner={true}
            multiColorSpinner={true}
            loading={this.state.saving}
            onClick={() => this.handleSave()}
            disabled={!!this.props.saveDisabled}>
          Save
        </Button>,
        <Button
            key='publishButton'
            type='accent'
            flat={true}
            withSpinner={true}
            multiColorSpinner={true}
            loading={this.state.publishing}
            onClick={() => this.handlePublish()}>
          Publish
        </Button>
      ]}
    />;
  }
}
