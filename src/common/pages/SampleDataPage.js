import React from 'react';
import EditorEvents from '../util/EditorEvents';
import StateUpdater from '../util/StateUpdater';
import TemplateEngine from '../models/TemplateEngine';
import Editor from '../components/controls/Editor';
import Layout from '../components/layout/Layout';
import LayoutContent from '../components/layout/LayoutContent';
import Modal from '../components/layout/Modal';
import SampleDataHeader from '../components/SampleDataHeader';
import DocumentNameModal from '../components/DocumentNameModal';
import DeleteModal from '../components/DeleteModal';
import * as templateApi from '../../client/api/templateApi';
import * as sampleDataApi from '../../client/api/sampleDataApi';

export default class SampleDataPage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      code: '',
      dirty: false,
      templateNames: [],
      sampleDataNames: []
    };

    this.editorEvents = new EditorEvents({
      document: typeof document !== 'undefined' ? document : null,
      isDirty: () => this.state.dirty,
      onSave: () => this.saveCode()
    });

    this.stateUpdater = new StateUpdater(this, {
      code: {
        arePropsEqual: (props1, props2) =>
          props1.projectName === props2.projectName &&
            props1.templateName === props2.templateName &&
            props1.sampleDataName === props2.sampleDataName,

        getNewState: ({projectName, templateName, sampleDataName, history}) =>
          sampleDataApi.load({projectName, templateName, name: sampleDataName})
            .then(content => ({
              code: content,
              dirty: false
            }))
            .catch(() =>
              history.pushState(null, '/not-found'))
      },
      templateNames: {
        arePropsEqual: (props1, props2) =>
          props1.projectName === props2.projectName,

        getNewState: ({projectName, history}) =>
          templateApi.list({projectName})
            .then(templates => ({
              templateNames: templates.map(({name}) => name)
            }))
      },
      sampleDataNames: {
        arePropsEqual: (props1, props2) =>
          props1.projectName === props2.projectName &&
            props1.templateName === props2.templateName,

        getNewState: ({projectName, templateName, history}) =>
          sampleDataApi.list({projectName, templateName})
            .then(sampleDataNames => ({sampleDataNames}))
      }
    });
  }

  componentWillMount() {
    if (__CLIENT__) {
      this.stateUpdater.willMount();
    }
  }

  componentDidMount() {
    this.editorEvents.start();
  }

  componentWillReceiveProps(newProps) {
    this.stateUpdater.willReceiveProps(newProps);
  }

  componentWillUnmount() {
    this.editorEvents.stop();
  }

  handleCodeChange(code) {
    if (code !== this.state.code) {
      this.setState({
        code: code,
        dirty: true
      });
    }
  }

  saveCode() {
    if (this.state.dirty) {
      const {projectName, templateName, sampleDataName} = this.props;
      return sampleDataApi.save({
        projectName,
        templateName,
        name: sampleDataName,
        code: this.state.code
      }).then(() =>
        this.setState({ dirty: false })
      );
    } else {
      return Promise.resolve();
    }
  }

  createNewSampleData(name) {
    const {projectName, templateName, history} = this.props;

    return this.saveCode()
      .then(() => sampleDataApi.save({
        projectName,
        templateName,
        name,
        code: 'someKey: someValue'
      }))
      .then(() => {
        this.refs.newSampleDataModal.close();
        this.stateUpdater.refresh('sampleDataNames');
        history.pushState(null, `/sample-data/editor/${projectName}/${templateName}?name=${name}`);
      });
  }

  deleteSampleData() {
    const {projectName, templateName, sampleDataName, history} = this.props;

    return sampleDataApi.deleteSampleData({projectName, templateName, name: sampleDataName})
      .then(() => history.pushState(null, `/sample-data/editor/${projectName}/${templateName}`));
  }

  handleTemplateChange(templateName) {
    const {projectName, history} = this.props;

    // bake in hbs for now.
    const templateFilePath = templateName + TemplateEngine.handlebars.fileExtension;

    this.saveCode()
      .then(() => history.pushState(null, `/templates/editor/${projectName}/${templateFilePath}`));
  }

  handleSampleDataChange(name) {
    const {projectName, templateName, history} = this.props;

    this.saveCode()
      .then(() => history.pushState(null, `/sample-data/editor/${projectName}/${templateName}?name=${name}`))
  }

  viewTemplate() {
    this.handleTemplateChange(this.props.templateName);
  }

  render() {
    const {projectName, templateName, sampleDataName} = this.props;
    const {dirty, code, templateNames, sampleDataNames} = this.state;

    return <Layout style={{minHeight: '400px'}}>
      <DocumentNameModal
        ref='newSampleDataModal'
        inputLabel='Name'
        buttonLabel='Create'
        submit={name => this.createNewSampleData(name)}
      />

      <DeleteModal
        ref='deleteModal'
        objectName={sampleDataName}
        execute={() => this.deleteSampleData()} />

      <SampleDataHeader
        currentProjectName={projectName}
        projectNames={[projectName]}
        currentTemplateName={templateName}
        templateNames={templateNames}
        currentSampleDataName={sampleDataName}
        sampleDataNames={sampleDataNames}
        saveDisabled={!dirty}
        onSave={() => this.saveCode()}
        onViewTemplate={() => this.viewTemplate()}
        onNewSampleData={() => this.refs.newSampleDataModal.open()}
        onDelete={() => this.refs.deleteModal.open()}
        onProjectChange={() => {}}
        onTemplateChange={name => this.handleTemplateChange(name)}
        onSampleDataChange={name => this.handleSampleDataChange(name)} />
      <LayoutContent>
        <Editor
          style={{flex: 'auto'}}
          code={code}
          onCodeChange={c => this.handleCodeChange(c)} />
      </LayoutContent>
    </Layout>;
  }
}
