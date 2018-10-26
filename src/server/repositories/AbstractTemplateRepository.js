/**
 * "Abstract" base class for TemplateRepository. Mostly defines the structure of
 * template repositories.
 */
export default class AbstractTemplateRepository {
  /**
   * @returns {Promise<Array<{name: string, engine: TemplateEngine}>>}
   */
  list() { throw new Error("not implemented"); }

  /**
   * @param {string} name
   * @param {string|TemplateEngine} templateEngine
   * @param {string} state - draft|published
   */
  load(name, templateEngine, state = 'draft') { throw new Error("not implemented"); }

  /**
   * @param {Template} template
   * @param {string} state - draft|published
   */
  save(template, state = 'draft') { throw new Error("not implemented"); }

  delete(name, templateEngine) { throw new Error("not implemented"); }
}
