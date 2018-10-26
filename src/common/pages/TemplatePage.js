import React from 'react';
import {splitext} from '../../server/util/paths';
import EditorEvents from '../util/EditorEvents';
import Template from '../models/Template';
import TemplateEngine from '../models/TemplateEngine';
import Preview from '../components/Preview';
import Layout from '../components/layout/Layout';
import LayoutContent from '../components/layout/LayoutContent';
import Modal from '../components/layout/Modal';
import TemplateHeader from '../components/TemplateHeader';
import TemplateSendTestForm from '../components/TemplateSendTestForm';
import TemplateEditor from '../components/TemplateEditor';
import DocumentNameModal from '../components/DocumentNameModal';
import DeleteModal from '../components/DeleteModal';
import TemplateMetadataModal from '../components/TemplateMetadataModal';
import * as templateApi from '../../client/api/templateApi';
import * as sampleDataApi from '../../client/api/sampleDataApi';

export default ({history, params: {action, projectName, splat}}) => {
  const templateName = splitext(splat)[0];

  return (
    <TemplatePage
      key={`${projectName},${templateName},${action}`}
      history={history}
      action={action}
      projectName={projectName}
      templateName={templateName}
      templateFilePath={splat} />
  );
};

class TemplatePage extends React.Component {
  constructor(props) {
    super(props);

    this.state = {
      template: null,
      dirty: false,
      metadataModalShown: false,
      templateNames: [],
      sampleDataNames: []
    };

    this.editorEvents = new EditorEvents({
      document: typeof document !== 'undefined' ? document : null,
      isDirty: () => this.state.dirty,
      onSave: () => this.save()
    });
  }

  componentDidMount() {
    const {projectName, templateName, templateFilePath} = this.props;

    this.editorEvents.start();

    Promise.all([
      templateApi.list({projectName}),
      templateApi.load({projectName, templateFilePath})
    ])
    .then(([templateList, template]) => {
      this.setState({
        templateNames: templateList.map(({name}) => name),
        template,
        dirty: false
      });
    })
    .catch(() => {
      history.pushState(null, "/not-found");
    });

    sampleDataApi.list({projectName, templateName})
      .then(sampleDataNames => {
        this.setState({sampleDataNames});
      });
  }

  componentWillUnmount() {
    this.editorEvents.stop();
  }

  handleTemplatePropertyChange(name, value) {
    if (this.state.template && this.state.template[name] !== value) {
      this.setState({
        template: new Template({...this.state.template, [name]: value}),
        dirty: true
      });
    }
  }

  save() {
    if (this.state.dirty) {
      const {projectName, templateFilePath} = this.props;
      const {template} = this.state;

      return templateApi.update({
        projectName,
        templateFilePath,
        ..._.pick(template, 'content', 'fromName', 'fromEmail', 'subject'),
      }).then(() =>
        this.setState({ dirty: false })
      );

    } else {
      return Promise.resolve();
    }
  }

  saveMetadata({fromEmail, fromName, subject}) {
    const {projectName, templateFilePath} = this.props;

    return templateApi.update({
      projectName,
      templateFilePath,
      content: this.state.template.content,
      fromEmail,
      fromName,
      subject,
    }).then(() =>
      this.setState({
        dirty: false,
        metadataModalShown: false,
        template: new Template({
          ...this.state.template,
          fromEmail,
          fromName,
          subject,
        }),
      })
    );
  }

  sendTest({emailAddress, sampleDataName}) {
    const {projectName, templateFilePath} = this.props;
    return this.save()
      .then(() =>
        templateApi.sendTest({
          projectName,
          templateFilePath,
          emailAddress,
          sampleDataName
        }))
      .then(() =>
        this.refs.sendTestModal.close());
  }

  togglePreview() {
    const {action, history, projectName, templateFilePath} = this.props;
    const {dirty} = this.state;
    const newUrlSuffix = `${projectName}/${templateFilePath}`;

    if (action === 'preview') {
      history.pushState(null, `/templates/editor/${newUrlSuffix}`);
    } else if (dirty) {
      this.save().then(() => history.pushState(null, `/templates/preview/${newUrlSuffix}`));
    } else {
      history.pushState(null, `/templates/preview/${newUrlSuffix}`);
    }
  }

  viewSampleData() {
    const {history, projectName, templateName} = this.props;

    this.save().then(() =>
      history.pushState(null, `/sample-data/editor/${projectName}/${templateName}`));
  }

  /**
   * Saves the current template, then calls `action()`, which should return
   * a promise for the file path of a new template. On completion, switches
   * to the new template.
   */
  _doActionWithTemplateCreation(action) {
    const {projectName, history} = this.props;

    return this.save()
      .then(() => action())
      .then(templateFilePath =>
        history.pushState(null, `/templates/editor/${projectName}/${templateFilePath}`));
  }

  createNewTemplate(name) {
    const {projectName} = this.props;

    // bake in hbs for now.
    const templateFilePath = name + TemplateEngine.handlebars.fileExtension;

    return this._doActionWithTemplateCreation(() =>
      templateApi.create({ projectName, templateFilePath })
        .then(() => {
          this.refs.newTemplateModal.close();
          return templateFilePath;
        }));
  }

  copyTemplate(newName) {
    const {templateFilePath, projectName} = this.props;

    return this._doActionWithTemplateCreation(() =>
      templateApi.copy({ projectName, templateFilePath, newName })
        .then(() => {
          this.refs.copyModal.close();
          return newName + TemplateEngine.handlebars.fileExtension;
        }));
  }

  renameTemplate(newName) {
    const {templateFilePath, projectName} = this.props;

    return this._doActionWithTemplateCreation(() =>
      templateApi.move({ projectName, templateFilePath, newName })
        .then(() => {
          this.refs.renameModal.close();
          return newName + TemplateEngine.handlebars.fileExtension;
        }));
  }

  editMetadata() {
    this.setState({metadataModalShown: true});
  }

  deleteTemplate() {
    const {history, templateFilePath, projectName} = this.props;

    return templateApi.deleteTemplate({ projectName, templateFilePath })
      .then(() => history.pushState(null, '/templates/editor/'));
  }

  handleTemplateChange(name) {
    const {projectName, history} = this.props;

    // bake in hbs for now.
    const templateFilePath = name + TemplateEngine.handlebars.fileExtension;

    this.save()
      .then(() => history.pushState(null, `/templates/editor/${projectName}/${templateFilePath}`));
  }

  publish() {
    const {projectName, templateFilePath} = this.props;
    return this.save().then(() => templateApi.publish({projectName, templateFilePath}));
  }

  handleDismissMetadataModal() {
    this.setState({metadataModalShown: false});
  }

  render() {
    const {action, projectName, templateFilePath, templateName} = this.props;
    const {dirty, template, templateNames, sampleDataNames, metadataModalShown} = this.state;

    return <Layout style={{minHeight: '400px'}}>
      <DocumentNameModal
        ref='newTemplateModal'
        inputLabel='Name'
        buttonLabel='Create'
        submit={name => this.createNewTemplate(name)}
      />

      <DocumentNameModal
        ref='copyModal'
        inputLabel='New Name'
        buttonLabel='Copy'
        submit={name => this.copyTemplate(name)}
      />

      <DocumentNameModal
        ref='renameModal'
        inputLabel='New Name'
        buttonLabel='Rename'
        submit={name => this.renameTemplate(name)}
      />

      <DeleteModal
        ref='deleteModal'
        objectName={templateName}
        execute={() => this.deleteTemplate()} />

      <Modal ref='sendTestModal'>
        <TemplateSendTestForm
          sampleDataNames={sampleDataNames}
          send={data => this.sendTest(data)}
        />
      </Modal>

      <TemplateMetadataModal
        template={metadataModalShown ? template : null}
        onClose={this.handleDismissMetadataModal.bind(this)}
        onSubmit={this.saveMetadata.bind(this)} />

      <TemplateHeader
        currentPageAction={action}
        currentProjectName={projectName}
        projectNames={[projectName]}
        currentTemplateName={templateName}
        templateNames={templateNames}
        saveDisabled={!dirty}

        onViewSendTest={() => this.refs.sendTestModal.open()}
        onTogglePreview={() => this.togglePreview()}
        onViewSampleData={() => this.viewSampleData()}
        onEditMetadata={() => this.editMetadata()}

        save={() => this.save()}
        publish={() => this.publish()}

        onNewTemplate={() => this.refs.newTemplateModal.open()}
        onCopy={() => this.refs.copyModal.open()}
        onRename={() => this.refs.renameModal.open()}
        onDelete={() => this.refs.deleteModal.open()}

        onTemplateChange={name => this.handleTemplateChange(name)}
        onProjectChange={() => {}} />

      <LayoutContent>
      {
        action === 'editor' ?
          <TemplateEditor
            projectName={projectName}
            sampleDataNames={sampleDataNames}
            template={template}
            onChange={(name, value) => this.handleTemplatePropertyChange(name, value)}
          />
        : <Preview
            style={{
              boxSizing: 'border-box',
              margin: '16px auto',
              width: 600,
              border: '1px solid #e0e0e0',
              flex: 'auto',
            }}
            sampleDataNames={sampleDataNames}
            projectName={projectName}
            template={template}
          />
      }
      </LayoutContent>
    </Layout>;
  }
}
