import React from 'react';
import Template from '../models/Template';
import TextField from './controls/TextField';
import Editor from './controls/Editor';
import Preview from './Preview';

/**
 * Props:
 * - projectName, templateName, engineName, code, subject, fromName, fromEmail
 * - sampleDataNames
 * - onChange(prop, value)
 */
export default class TemplateEditor extends React.Component {
  render() {
    const {sampleDataNames, projectName, template, onChange} = this.props;

    return (
      // TODO: extract grid into layout component
      <div className="mdl-grid" style={{flex: 'auto', margin: 0}}>
        <Editor
          className="mdl-cell mdl-cell--6-col mdl-cell--8-col-tablet"
          style={{boxSizing: 'border-box', border: '1px solid #e0e0e0'}}
          code={template && template.content || ''}
          onCodeChange={v => onChange('content', v)} />
        <Preview
          className="mdl-cell mdl-cell--6-col mdl-cell--hide-tablet"
          style={{border: '1px solid #e0e0e0'}}
          sampleDataNames={sampleDataNames}
          projectName={projectName}
          template={template} />
      </div>
    );
  }
}
