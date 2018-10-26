import * as yaml from 'js-yaml';

export default class SampleDataController {
  constructor({sampleDataService}) {
    this.sampleDataService = sampleDataService;
  }

  list({projectName, templateName, reply}) {
    reply(this.sampleDataService.list({projectName, templateName}));
  }

  /**
   * Expects request payload and a "name" query parameter.
   */
  save({projectName, templateName, request, reply}) {
    const {name} = request.query;
    const data = yaml.safeLoad(request.payload);
    reply(this.sampleDataService.save({projectName, templateName, name, data}));
  }

  /**
   * Query parameters:
   * - name - required.
   * - format: json|yaml. Optional. Defaults to "yaml"
   */
  load({projectName, templateName, request, reply}) {
    const {name} = request.query;
    reply(
      this.sampleDataService.load({projectName, templateName, name})
        .then(data => request.query.format === 'json' ? data : yaml.safeDump(data)));
  }

  /**
   * Expects a "name" query parameter.
   */
  delete({projectName, templateName, request, reply}) {
    const {name} = request.query;
    reply(this.sampleDataService.delete({projectName, templateName, name}));
  }
}
