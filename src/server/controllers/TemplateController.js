import Template from '../../common/models/Template';
import TemplateEngine  from '../../common/models/TemplateEngine';
import { splitext } from '../util/paths';

/**
 * Class defining a set of Hapi handlers.
 */
export default class TemplateController {
  constructor({templateService}) {
    this.templateService = templateService;
  }

  _templateNameAndEngineFromPath(templateFilePath) {
    const [templateName, templateExt] = splitext(templateFilePath);
    const templateEngine = TemplateEngine.byFileExtension(templateExt);
    return [templateName, templateEngine];
  }

  _templateFromTemplatePathAndRequest(templateFilePath, request) {
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);
    const {fromName, fromEmail, subject} = request.query;
    return new Template({
      name: templateName,
      engineName: templateEngine.name,
      content: request.payload || '',
      fromName: fromName || '',
      fromEmail: fromEmail || '',
      subject: subject || ''
    });
  }

  list({projectName, reply}) {
    reply(this.templateService.list({projectName}));
  }

  load({projectName, templateFilePath, request: {query: {state = 'draft'}}, reply}) {
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);
    reply(this.templateService.load({projectName, templateName, templateEngine, state}));
  }

  /**
   * Takes an optional request payload and query string params:
   * - fromName
   * - fromEmail
   * - subject
   */
  create({projectName, templateFilePath, request, reply}) {
    const template = this._templateFromTemplatePathAndRequest(templateFilePath, request);
    reply(this.templateService.create({ projectName, template }));
  }

  /**
   * Expects request payload and query string params:
   * - fromName
   * - fromEmail
   * - subject
   */
  update({projectName, templateFilePath, request, reply}) {
    const template = this._templateFromTemplatePathAndRequest(templateFilePath, request);
    reply(this.templateService.update({ projectName, template }));
  }

  /**
   * Expects query string params:
   * - newName
   */
  move({projectName, templateFilePath, request, reply}) {
    const {newName} = request.query;
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.move({projectName, templateName, templateEngine, newName}));
  }

  /**
   * Expects query string params:
   * - newName
   */
  copy({projectName, templateFilePath, request, reply}) {
    const {newName} = request.query;
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.copy({projectName, templateName, templateEngine, newName}));
  }

  delete({projectName, templateFilePath, reply}) {
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.delete({projectName, templateName, templateEngine}));
  }

  /**
   * Expects query string params:
   * - emailAddress
   * - sampleDataName
   */
  sendTest({projectName, templateFilePath, request, reply}) {
    const {emailAddress, sampleDataName} = request.query;
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.sendTest({
      projectName,
      templateName,
      templateEngine,
      emailAddress,
      sampleDataName
    }));
  }

  /**
   * Expects query string params:
   * - sampleDataName
   */
  preview({projectName, templateFilePath, request, reply}) {
    const {emailAddress, sampleDataName} = request.query;
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.preview({
      projectName,
      templateName,
      templateEngine,
      sampleDataName
    }));
  }

  publish({projectName, templateFilePath, reply}) {
    const [templateName, templateEngine] = this._templateNameAndEngineFromPath(templateFilePath);

    reply(this.templateService.publish({
      projectName,
      templateName,
      templateEngine
    }))
  }
}
