/**
 * Represents something that can publish templates. This class
 * exists to define the required structure.
 */
export default class AbstractPublisher {
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
    throw new Error("not implemented");
  }
}
