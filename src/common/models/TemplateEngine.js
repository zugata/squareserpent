export default class TemplateEngine {
  /**
   * @param config a config object with the following properties:
   *
   * 		- name: the name of the template engine, e.g., "handlebars"
   *   	- fileExtension: the file extension of files associated with this
   *   			template engine, e.g., ".hbs". Note that file extensions must be
   *   			unique among TemplateEngines
   */
  constructor({name, fileExtension}) {
    this.name = name;
    this.fileExtension = fileExtension;

  }

  /**
   * If `value` is a `TemplateEngine`, returns that. Otherwise,
   * interprets `value` as the name of a `TemplateEngine` and returns
   * the corresponding `TemplateEngine` instance.
   *
   * @example
   *    > assert(TemplateEngine.wrap(TemplateEngine.handlebars) === TemplateEngine.handlebars)
   *    > assert(TemplateEngine.wrap('handlebars') === TemplateEngine.handlebars)
   */
  static wrap(value) {
    if (value._isTemplateEngine) {
      return value;
    } else {
      var engine = TemplateEngine[value];
      if (engine && engine._isTemplateEngine) {
        return engine;
      } else {
        throw new Error(`unrecognized TemplateEngine name: "${value}"`);
      }
    }
  }

  static byFileExtension(fileExtension) {
    fileExtension = fileExtension.toLowerCase();

    for (const key of Object.keys(TemplateEngine)) {
      const engine = TemplateEngine[key];
      if (engine && engine._isTemplateEngine && engine.fileExtension === fileExtension) {
        return engine;
      }
    }

    throw new Error(`file extension not associated with a TemplateEngine: "${fileExtension}"`);
  }
}

TemplateEngine.prototype._isTemplateEngine = true;

TemplateEngine.handlebars = new TemplateEngine({ name: 'handlebars', fileExtension: '.hbs'});
