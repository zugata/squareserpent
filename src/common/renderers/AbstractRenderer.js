
/**
 * Represents a class that can render templates for a particular engine.
 * This class exists mostly to outline the required methods of such a class. For
 * an example, see "HandlebarsRenderer.js" in this directory.
 */
export default class AbstractRenderer {
  /**
   * Takes an object of params:
   *
   * - template: Template - the template to compile. Its `engineName` should
   * 		correspond with the template engine this Renderer supports.
   *
   * - templateList: Array<string>. The names of all possible partials. These
   * 		should all reference templates with the same `engineName`; a template
   *    can't use a template written for a different template engine as a partial
   *
   * - loader: string => Promise<Template> - should take a template name (from
   * 		`templateList`) and return a promise for a Template
   *
   * - data: the rendering data
   *
   * - compiledTemplateCache: Object; optional. If the same Object is repeatedly
   *    passed in for this value, it will be used to cache template loading and
   *    compilation across renders. This value should be initialized as an
   *    empty object and treated opaquely by the caller.
   *
   *    Caveats:
   *    - templates cached in this way are cached permanently; no eviction is
   *    	attempted.
   *    - when sharing a cache between calls, the previous promise should
   *    	complete before making the next call. No guarantees are made that
   *    	the cache can be used by two calls simultaneously.
   *
   * @returns {Promise<{subject, body}>}
   */
  renderTemplate({template, templateList, loader, data, compiledTemplateCache = {}}) {
    throw new Error('Not implemented');
  }

  /**
   * Renders a template, "re-outputting" variable expressions, iteration, and
   * conditionals. In effect, it "simplifies" a template by just evaluating
   * its partials, outputting a template in a potentially different language.
   *
   * Takes an object of params:
   *
   * - template, templateList, loader: see `renderTemplate`
   *
   * - variableNames: Array<string> - the names of variables that should
   *  	be "re-output" in the resulting template.
   *
   * - variableFormatter: a string formatter for variable expressions. If the target
   * 		output were handlebars, this would be "v => `{{${v}}}`".
   *
   * - eachFormatter: a string formatter for iteration expressions. Takes the
   * 		iteration variable, the "each" block, and the "else" block. If the target
   * 		output were handlebars, this might be
   * 		"(expr, block, else_) => `{{#each ${expr}}}${block}{{else}}${else}{{/each}}`
   *
   * - ifFormatter: a string formatter for conditional expressions. Takes the
   * 		conditional variable, the block, and the "else" block. If the target
   * 		output were handlebars, this might be
   * 		"(expr, block, else_) => `{{#if ${expr}}}${block}{{else}}${else_}{{/each}}`"
   */
  renderAsTemplate({template, templateList, loader, variableNames, eachFormat, }) {
    throw new Error('Not implemented');
  }
}
