import path  from 'path'
import { splitext } from '../util/paths'
import AbstractSampleDataRepository  from './AbstractTemplateRepository'

export default class S3SampleDataRepository extends AbstractSampleDataRepository {
  constructor({s3Folder}) {
    super();
    this.s3Folder = s3Folder;
  }

  list(templateName) {
    return this.s3Folder.listObjects(`${templateName}/`)
      .then(entries => entries.map(({filePath}) => splitext(filePath)[0]));
  }

  load(templateName, name) {
    return this.s3Folder.loadObject(path.join(templateName, name) + '.json')
      .then(({content}) => JSON.parse(content));
  }

  save(templateName, name, data) {
    return this.s3Folder.saveObject(path.join(templateName, name) + '.json', {
      content: JSON.stringify(data)
    });
  }

  move(templateName, name, newTemplateName, newName) {
    const oldPath = `${path.join(templateName, name)}.json`;
    const newPath = `${path.join(newTemplateName, newName)}.json`;

    return this.s3Folder.copyObject(oldPath, newPath)
      .then(() => this.s3Folder.deleteObject(oldPath));
  }

  delete(templateName, name) {
    return this.s3Folder.deleteObject(path.join(templateName, name) + '.json');
  }
}
