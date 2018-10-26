export default class AbstractSampleDataRepository {
  list(templateName) {
    throw new Error('not implemented');
  }

  load(templateName, name) {
    throw new Error('not implemented');
  }

  save(templateName, name, data) {
    throw new Error('not implemented');
  }
}
