import React from 'react';
import Button from './controls/Button';
import ButtonMenu from './controls/ButtonMenu';
import MenuItem from './controls/MenuItem';
import TemplateSendTestForm from './TemplateSendTestForm';
import HeaderBreadcrumbMenu from './HeaderBreadcrumbMenu';
import BasicHeader from './BasicHeader';

/**
 * Props:
 * - currentProjectName
 * - currentTemplateName
 * - currentSampleDataName
 * - templateNames: Array<string>
 * - projectNames: Array<string>
 * - sampleDataNames: Array<string>
 * - saveDisabled: true|false
 * - onSave(), onNewSampleData(name), onProjectChange(envName),
 * 			onTemplateChange(templateName), onSampleDataChange(sampleDataName),
 * 			onViewTemplate(), onDelete()
 */
export default class SampleDataHeader extends React.Component {
  render() {
    return <BasicHeader
      title="Sample Data"
      menuContent={[
        <MenuItem key='new' onClick={this.props.onNewSampleData}>New...</MenuItem>,
        <MenuItem key='template' onClick={this.props.onViewTemplate}>Edit Template...</MenuItem>,
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
          onChange={this.props.onTemplateChange} />,
        "/",
        <HeaderBreadcrumbMenu
          key='sampleDataSelect'
          label='Select Sample Data:'
          value={this.props.currentSampleDataName}
          options={this.props.sampleDataNames.map(name => ({value: name}))}
          onChange={this.props.onSampleDataChange} />
      ]}
      rightContent={[
        <Button
            key='saveButton'
            type="accent"
            flat={true}
            onClick={this.props.onSave}
            disabled={!!this.props.saveDisabled}>
          Save
        </Button>
      ]}
    />;
  }
}
