import React from 'react';
import TemplateEngine from '../models/TemplateEngine';
import Layout from '../components/layout/Layout';
import BasicHeader from '../components/BasicHeader';
import DocumentNameModal from '../components/DocumentNameModal';
import * as templateApi from '../../client/api/templateApi';
import * as sampleDataApi from '../../client/api/sampleDataApi';

/**
 * "Landing page" for resolving partial routes to the template or sample data
 * editor. If no template/sample data was specified and at least one exists,
 * routes to the first one. Otherwise, prompts the user to create their first
 * one.
 *
 * Props:
 * - type: templates|sample-data
 * - history
 * - projectName
 * - if type is 'sample-data', templateName
 */
export default class DocumentResolutionPage extends React.Component {
  componentDidMount() {
    const {type, projectName, history} = this.props;

    if (type === 'templates') {
      templateApi.list({projectName})
        .then(templates => {
          const firstTemplate = templates && templates[0];

          if (firstTemplate) {
            const templateFilePath =
              firstTemplate.name + TemplateEngine.wrap(firstTemplate.engineName).fileExtension;

            history.pushState(null, `/templates/editor/${projectName}/${templateFilePath}`);

          } else {
            this.refs.newDocumentModal.open();
          }
        })
        .catch(() => history.pushState(null, '/not-found'));

    } else {
      const templateNamePromise =
        this.props.templateName ? Promise.resolve(this.props.templateName)
        : templateApi.list({projectName})
            .then(templates => templates && templates[0] && templates[0].name);

      templateNamePromise.then(templateName => {
        if (templateName) {
          sampleDataApi.list({projectName, templateName})
            .then(sampleDataNames => {
              const firstSampleDataName = sampleDataNames && sampleDataNames[0];

              if (firstSampleDataName) {
                history.pushState(null, `/sample-data/editor/${projectName}/${templateName}?name=${firstSampleDataName}`);
              } else {
                this.refs.newDocumentModal.open();
              }
            });
        } else {
          history.pushState(null, `/templates/editor/${projectName}`);
        }
      })
      .catch(() => history.pushState(null, '/not-found'));
    }
  }

  createNewDocument(name) {
    const {type, projectName, history} = this.props;

    if (type === 'templates') {
      // Bake in hbs for now
      const templateFilePath = name + TemplateEngine.handlebars.fileExtension;

      return templateApi.create({projectName, templateFilePath})
        .then(() => history.pushState(null, `/templates/editor/${projectName}/${templateFilePath}`));

    } else {
      const {templateName} = this.props;

      return sampleDataApi.save({
          projectName,
          templateName,
          name,
          code: 'sampleKey: sampleValue'
        })
        .then(() =>
          history.pushState(null, `/sample-data/editor/${projectName}/${templateName}?name=${name}`));
    }
  }

  render() {
    const {type} = this.props;

    return (
      <Layout>
        <BasicHeader
          title={type === 'templates' ? 'Templates' : 'Sample Data'}
          menuContent={[]}
          leftContent={[]}
          rightContent={[]}
        />

        <DocumentNameModal
          ref='newDocumentModal'
          dismissable={false}
          inputLabel="Name"
          buttonLabel="Create"
          message={`
            Hey! It looks like you don't have any
            ${type === 'templates' ? 'templates' : 'sample data'} yet. Enter a
            name to create your first one:
          `}
          submit={name => this.createNewDocument(name)} />
      </Layout>
    );
  }
}
