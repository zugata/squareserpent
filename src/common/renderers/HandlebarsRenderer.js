import _ from 'lodash';
import * as Handlebars  from 'handlebars';
import AbstractRenderer from './AbstractRenderer';

const slice = Array.prototype.slice;
const getRenderPlaceholder = i => `__RENDER__${i}`;
const renderPlaceholderRe = /__RENDER__\d+/g;

/**
 * Creates a dummy value that is used to mark variables that should be
 * "re-output" in the result (when a template is rendered to produce
 * another template).
 *
 * Attaches the __VAR_NAME__ property to the resulting value, so that it
 * can be identified by custom helpers.
 */
function _createVarForReoutput(varName, varFormatter) {
  // Using an array seems to trigger handlbars passing {{#abc}} expressions
  // to the "each" helper.
  const val = [];
  val.toString = () => varFormatter(varName);
  val.__VAR_NAME__ = varName;
  return val;
}

/**
 * Takes an object of configuration with the following properties:
 *
 * - handlebarsCreator: optional. a function to create a fresh instance of
 * 		Handlebars. No guarantees are made as to whether a single instance
 *   	or multiple instances are created, or when they're created. Defaults
 *    to `Handlebars.create`.
 *
 */
export default class HandlebarsRenderer extends AbstractRenderer {
  constructor({handlebarsCreator = Handlebars.create} = {}) {
    super();
    this.handlebarsCreator = handlebarsCreator;
  }


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
    this._checkEngineName(template.engineName);

    return this._internalRenderTemplate({template, templateList, loader, data, compiledTemplateCache});
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
  renderAsTemplate({template, templateList, loader, variableNames, variableFormatter, eachFormatter, ifFormatter}) {
    this._checkEngineName(template.engineName);

    // Render with special marker values that mark the variables for "re-output"
    const data = _(variableNames)
      .map(v => [v, _createVarForReoutput(v, variableFormatter)])
      .fromPairs()
      .value();

    const defaultEach = Handlebars.helpers.each,
      defaultIf = Handlebars.helpers.if;

    const helpers = {
      each: (value, options) =>
        value && value.__VAR_NAME__ ?
          eachFormatter(value.__VAR_NAME__, options.fn(this), options.inverse(this))
        : defaultEach(value, options),

      if: (value, options) =>
        value && value.__VAR_NAME__ ?
          ifFormatter(value.__VAR_NAME__, options.fn(this), options.inverse(this))
        : defaultIf(value, options)
    };

    return this._internalRenderTemplate({template, templateList, loader, data, helpers});
  }

  _checkEngineName(engineName) {
    if (engineName !== 'handlebars') {
      throw new Error(`HandlebarsRenderer can't render template with engineName: ${template.engineName}`);
    }
  }

  /**
   * Takes the same arguments and returns the same value as `renderTemplate`,
   * with an additional argument of `helpers` - on Object mapping helper names to
   * helpers to add to the handlebars instance during the render.
   */
  _internalRenderTemplate({template, templateList, loader, data, compiledTemplateCache = {}, helpers = {}}) {
    console.log('RENDER: template', template.name, 'templateList', templateList);

    // Compiled handlebars templates contain implicit links back to the `Handlebars` instace, so
    // we need to cache/reuse the Handlebars instance along with the compiled templates
    const handlebars = compiledTemplateCache.__HBS__ =
      compiledTemplateCache.__HBS__ || this.handlebarsCreator();

    // For all the passed-in helpers, save off the existing helpers (if any) so we can
    // restore them after render (as the `handlbars` instance may be reused).
    const oldHelpers = _.mapValues(helpers, (helper, name) => handlebars.helpers[name]);

    // Now, register the new helpers
    _.each(helpers, (helper, name) => handlebars.registerHelper(name, helper));

    // Compile the passed-in template and add it to the cache
    compiledTemplateCache[template.name] = handlebars.compile(template.content);

    /**
     * Tracks calls to partials for current render.
     *
     * @type {Array<{name, args, loader, placeholder}>}
     */
    let currentCallsToPartials = [];

    let nextPlaceholderId = 0;

    // Register partials that just insert a rendering placeholder. After a
    // rendering pass, we (possibly asynchronously) get the templates of
    // all the partials that were called, render them, and replace the appropriate
    // placeholders
    _.each(templateList, name =>
      handlebars.registerPartial(name, function() {
        const placeholder = getRenderPlaceholder(nextPlaceholderId++);
        currentCallsToPartials.push({name, args: slice.call(arguments), placeholder});
        return placeholder;
      })
    );

    const doRenderPass = (previousRendering) => {
      const callsToPartials = currentCallsToPartials;
      currentCallsToPartials = [];

      if (!callsToPartials.length) {
        return Promise.resolve(previousRendering);
      }

      // Promise for { placeholder -> renderOutput }
      const renderingsByPlaceholderPromise =
        Promise.all(
          callsToPartials.map(({name, args, placeholder}) => {
            const compiledTemplatePromise =
              compiledTemplateCache[name] ? Promise.resolve(compiledTemplateCache[name])
              : loader(name).then(template => {
                  let renderFn = compiledTemplateCache[name]; // may have been beaten to it
                  if (!renderFn) {
                    console.log('RENDER: compiling', name);
                    renderFn = compiledTemplateCache[name] = handlebars.compile(template.content);
                  }
                  return renderFn;
                });

            return compiledTemplatePromise.then(renderFn => {
              console.log('RENDER: rendering', name);
              return [placeholder, renderFn.apply(null, args)]
            });
          })
        ).then(_.fromPairs);

      return renderingsByPlaceholderPromise.then(renderingsByPlaceholder => {
        const nextRendering =
          previousRendering.replace(renderPlaceholderRe,
            placeholder => renderingsByPlaceholder[placeholder]);

        return doRenderPass(nextRendering);
      });
    };

    return doRenderPass(compiledTemplateCache[template.name](data))
      .then(body => {
        // Restore the old helpers now that compilation has completed
        _.each(oldHelpers, (helper, name) =>
          helper ? handlebars.registerHelper(name, helper)
          : handlebars.unregisterHelper(name));

        return {
          body,

          // TODO: cache
          subject: handlebars.compile(template.subject)(data)
        };
      });
  }
}
