import _ from 'lodash';
import {Locales} from 'locale';
import Template from '../../common/models/Template';
import TemplateEngine from '../../common/models/TemplateEngine';
import { wrapNodeback } from '../util/promises';

export default class TemplateService {
  /**
   * Takes an object of configuration with the following properties:
   *
   * - projects: required. An Object mapping project names to
   * 		Objects with the following properties:
   *
   * 		- templateRepository: An AbstractTemplateRepository implementation,
   * 			used for storing drafts of templates in this project
   *    - sampleDataRepository: An AbstractSampleDataRepository implementation,
   *    	used for storing sample data parameters in this project
   *    - publisher: An AbstractPublisher implementation, used to publish
   *    	templates.
   *
   * 		For example:
   *
   * 				{
   *     			projects: {
   *        		myEnv: {
   *        			templateRepository: new S3TemplateRepository(...),
   *        		 	sampleDataRepository: new S3SampleDataRepository(...),
   *        		 	publisher: new MandrillPublisher(...)
   *        		}
   *     			}
   * 				}
   *
   * - nodemailerTransport: required. A transport returned by
   *   `nodemailer.createTransport(...)`
   *
   * - fromEmail: the default "From:" line to use for test emails
   *
   * - renderersByEngineName: a map from TemplateEngine names to renderers
   * 		(see "common/renderers/AbstractRenderer"). For example:
   *
   * 			{
   *    		renderersByEngineName: {
   *      		handlebars: new HandlebarsRenderer()
   *    		}
   * 			}
   */
  constructor({projects, nodemailerTransport, fromEmail, renderersByEngineName}) {
    this.projects = projects;
    this.nodemailerTransport = nodemailerTransport;
    this.fromEmail = fromEmail;
    this.renderersByEngineName = renderersByEngineName;
  }

  _getProject(projectName) {
    const result = this.projects[projectName];
    if (!result) {
      throw new Error(`no project matches provided name: "${projectName}"`);
    }
    return result;
  }

  _getTemplateRepository(projectName) {
    return this._getProject(projectName).templateRepository;
  }

  _saveDraft(projectName, template) {
    return this._getTemplateRepository(projectName).save(template);
  }

  _getRenderer(engineName) {
    const renderer = this.renderersByEngineName[engineName];

    if (!renderer) {
      throw new Error(`No renderer configured for template engine: ${engineName}`);
    }

    return renderer;
  }

  /**
   * Given a list of Template objects and an engineName, returns a list of
   * names of templates that match the engine.
   */
  _getTemplateNamesForEngine(templateList, engineName) {
    return _(templateList)
      .filter(t => t.engineName === engineName)
      .map(({name}) => name)
      .value();
  }

  /**
   * @returns {Promise<{template, subject, body}>}
   */
  _renderTemplate({
    projectName,
    templateName,
    templateEngine,
    state = 'draft',
    sampleDataName = null,
    data = {},
  }) {
    const engineName = TemplateEngine.wrap(templateEngine).name;
    const renderer = this._getRenderer(engineName);

    const {templateRepository, sampleDataRepository} = this._getProject(projectName);

    return Promise.all([
      sampleDataName ?
        sampleDataRepository.load(templateName, sampleDataName)
      :
        Promise.resolve(data),
      templateRepository.load(templateName, templateEngine, state),
      templateRepository.list(projectName)
    ]).then(([
        data,
        template,
        templateList
    ]) =>
      renderer.renderTemplate({
        template,
        templateList: this._getTemplateNamesForEngine(templateList, engineName),
        loader: templateName => this.load({projectName, templateName, templateEngine, state: 'published'}),
        data,
      }).then(({subject, body}) => ({
        subject,
        body,
        template
      }))
    );

  }

  _sendEmail({emailAddress, subject, body, template: {fromName, fromEmail}}) {
    fromEmail = fromEmail || this.fromEmail;

    const mailOpts = {
      from: fromName ? `${fromName} <${fromEmail}>` : fromEmail,
      to: emailAddress,
      subject: subject,
      text: '', // TODO
      html: body
    };

    return wrapNodeback(cb => this.nodemailerTransport.sendMail(mailOpts, cb));
  }

  publish({projectName, templateName, templateEngine}) {
    const engineName = TemplateEngine.wrap(templateEngine).name;
    const {templateRepository, sampleDataRepository, publisher} =
      this._getProject(projectName);

    // load all sample data objects to get all possible variable names.
    const allSampleDataObjectsPromise =
      sampleDataRepository.list(templateName)
        .then(names => Promise.all(
          names.map(name => sampleDataRepository.load(templateName, name))));

    const allVariableNamesPromise =
      allSampleDataObjectsPromise.then(objs =>
        // throw them all into _.assign to merge the keys
        objs.length > 0 ? Object.keys(_.assign.apply(_, objs)) : []);

    return Promise.all([
      allVariableNamesPromise,
      templateRepository.load(templateName, templateEngine),
      templateRepository.list(projectName)
    ]).then(([
        variableNames,
        template,
        templateList
    ]) =>
      Promise.all([
        templateRepository.save(template, 'published'),

        publisher.publish({
          template,
          templateList: this._getTemplateNamesForEngine(templateList, engineName),
          loader: templateName => this.load({projectName, templateName, templateEngine, state: 'published'}),
          variableNames
        })
      ])
    ).then(() => templateName);
  }

  list({projectName}) {
    return this._getTemplateRepository(projectName).list();
  }

  load({projectName, templateName, templateEngine, state = 'draft'}) {
    return this._getTemplateRepository(projectName).load(templateName, templateEngine, state);
  }

  // REVIEW: better result from create, update, etc. than just name?
  create({projectName, template}) {
    return this._saveDraft(projectName, template).then(() => template.name);
  }

  update({projectName, template}) {
    return this._saveDraft(projectName, template).then(() => template.name);
  }

  move({projectName, templateName, templateEngine, newName}) {
    const {sampleDataRepository, templateRepository} = this._getProject(projectName);

    // XXX this is totally not atomic.
    return templateRepository.move(templateName, templateEngine, newName)
      .then(() => sampleDataRepository.list(templateName))
      .then(sampleDataNames =>
        Promise.all(sampleDataNames.map(sampleDataName =>
          sampleDataRepository.move(templateName, sampleDataName, newName, sampleDataName)
        ))
      )
      .then(() => newName);
  }

  copy({projectName, templateName, templateEngine, newName}) {
    return this._getTemplateRepository(projectName).copy(templateName, templateEngine, newName)
      .then(() => newName);
  }

  delete({projectName, templateName, templateEngine}) {
    return this._getTemplateRepository(projectName).delete(templateName, templateEngine)
      .then(() => {});
  }

  sendTest({projectName, templateName, templateEngine, emailAddress, sampleDataName = null}) {
    return this._renderTemplate({projectName, templateName, templateEngine, sampleDataName})
      .then(({subject, body, template}) =>
        this._sendEmail({emailAddress, subject, body, template})
      )
      .then(() => null);
  }

  preview({projectName, templateName, templateEngine, sampleDataName = null}) {
    return this._renderTemplate({projectName, templateName, templateEngine, sampleDataName})
      .then(({body}) => body);
  }

  sendEmail({projectName, templateName, templateEngine, emailAddress, renderData, locale = null}) {
    const repository = this._getTemplateRepository(projectName);

    const localeVariantsPromise =
      locale ? repository.getLocaleVariants(templateName, 'published') : Promise.resolve({});

    return (
      localeVariantsPromise
        .then(localeVariants => {
          const availableLocales = new Locales(Object.keys(localeVariants));
          const localeToUse = new Locales(locale).best(availableLocales).toString();
          const localeTemplateName = localeVariants[localeToUse] || templateName;

          return this._renderTemplate({
            projectName,
            templateName: localeTemplateName,
            templateEngine,
            state: 'published',
            data: renderData,
          });
        })
        .then(({subject, body, template}) =>
          this._sendEmail({emailAddress, subject, body, template})
        )
        .then(() => null)
    );
  }

}
