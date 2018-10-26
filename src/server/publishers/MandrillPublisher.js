import _ from 'lodash';
import {Mandrill} from 'mandrill-api/mandrill';
import AbstractPublisher from './AbstractPublisher';

const MANDRILL_INVALID_TEMPLATE_ERROR_NAME = 'Invalid_Template';

export default class MandrillPublisher extends AbstractPublisher {
  /**
   * Takes an object of configuration:
   *
   * - apiKey: the Mandrill API key
   *
   * - templateNamePrefix: if supplied, will be prepended to all templates
   * 		pushed to Mandrill
   *
   * - templateNameSuffix: if supplied, will be appended to all templates
   * 		pushed to Mandrill
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
  constructor({apiKey, renderersByEngineName, templateNamePrefix = '', templateNameSuffix = ''}) {
    super();
    this.mandrill = new Mandrill(apiKey);
    this.templateNamePrefix = templateNamePrefix;
    this.templateNameSuffix = templateNameSuffix;
    this.renderersByEngineName = renderersByEngineName;
  }

  /**
   * Takes an object of parameters:
   *
   * - template: the Template object to publish
   * - templateList: Array<string>. Templates that `template` may use
   * 		as partials. Should all match the same template engine as `template`.
   * - loader: string => Promise<Template>. a function that can load
   * 		one of the templates in `templateNames`
   * - variableNames: Array<string>. The available variables for `template`
   * 		at runtime.
   */
  publish({template, templateList, loader, variableNames}) {
    const renderer = this.renderersByEngineName[template.engineName];

    if (!renderer) {
      throw new Error(`No configured renderer for template engine: ${template.engineName}`);
    }

    return renderer.renderAsTemplate({
      template,
      templateList,
      loader,
      variableNames,

      // Render to handlebars
      variableFormatter: (expr) => `{{${expr}}}`,
      eachFormatter: (expr, block, else_) => `{{#each ${expr}}}${block}{{else}}${else_}{{/each}}`,
      ifFormatter: (expr, block, else_) => `{{#if ${expr}}}${block}{{else}}${else_}{{/if}}`
    })
    .then(({subject, body}) => {
      const opts = {
        name: this.templateNamePrefix + template.name + this.templateNameSuffix,
        from_name: template.fromName,
        from_email: template.fromEmail,
        subject: subject,
        code: body,
        text: '', // TODO
        publish: true
      };

      console.log('MandrillPublisher: publishing', opts);

      // Mandrill's methods take an options argument followed by success
      // and error callbacks.
      // First try add, then fall back on update
      return new Promise(_.bindKey(this.mandrill.templates, 'add', opts))
        .catch(e => {
          if (e.name === MANDRILL_INVALID_TEMPLATE_ERROR_NAME) {
            console.log('MandrillPublisher: template', template.name, 'may already exist. Trying "update"...');
            return new Promise(_.bindKey(this.mandrill.templates, 'update', opts));
          } else {
            return Promise.reject(e);
          }
        });
    })
  }
}
