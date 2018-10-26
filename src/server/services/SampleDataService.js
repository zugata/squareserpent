export default class SampleDataService {
  /**
   * Takes an object of configuration with the following properties:
   *
   * - repositoriesByProject: required. An Object mapping project names to
   * 	 AbstractSampleDataRepository implementations. For example:
   *
   * 				{
   *     			repositoriesByProject: {
   *        		myEnv: new S3SampleDataRepository(...)
   *     			}
   * 				}
   */
  constructor({repositoriesByProject}) {
    this.repositoriesByProject = repositoriesByProject;
  }

  _getRepository(projectName) {
    const result = this.repositoriesByProject[projectName];
    if (!result) {
      throw new Error(`no project matches provided name: "${projectName}"`);
    }
    return result;
  }

  list({projectName, templateName}) {
    return this._getRepository(projectName).list(templateName);
  }

  save({projectName, templateName, name, data}) {
    return this._getRepository(projectName).save(templateName, name, data).then(() => name);
  }

  load({projectName, templateName, name}) {
    return this._getRepository(projectName).load(templateName, name);
  }

  delete({projectName, templateName, name}) {
    return this._getRepository(projectName).delete(templateName, name).then(() => {});
  }
}
