import { ok as assert } from 'assert'
import * as path  from 'path'
import _ from 'lodash'
import Template  from '../../common/models/Template'
import TemplateEngine  from '../../common/models/TemplateEngine'
import { splitext } from '../util/paths'
import { wrapNodeback } from '../util/promises'
import { stripPrefix, ensureSuffix } from '../util/strings'
import AbstractTemplateRepository  from './AbstractTemplateRepository'

// S3 limits the total size of metadata, so we encode each custom key as
// a four-char abbreviation
const S3_METADATA_SUBJECT_KEY = 'subj'
const S3_METADATA_FROM_NAME_KEY = 'fnam';
const S3_METADATA_FROM_EMAIL_KEY = 'feml';

export default class S3TemplateRepository extends AbstractTemplateRepository {
  /**
   * @param {S3Folder} s3Folder - from 'server/external-services/S3Folder.js'
   */
  constructor({s3Folder}) {
    super();
    this.s3Folder = s3Folder;
  }

  _getFilePath(templateName, templateEngine, state = 'draft') {
    return `${state}/${templateName}${TemplateEngine.wrap(templateEngine).fileExtension}`;
  }

  /**
   * @returns {Promise<Array<{name: string, engineName: string}>>}
   */
  list() {
    return this.s3Folder.listObjects('draft/').then(entries =>
      _(entries).map(({filePath}) => {
        const [templateName, ext] = splitext(filePath);

        let engine;
        try {
          engine = TemplateEngine.byFileExtension(ext);
        } catch (e) {
          // TODO: real logging
          console.warn(`Error getting TemplateEngine for file path "${filePath}": ${e}`);
        }

        return engine && {name: templateName, engineName: engine.name};
      })
      .filter()
      .value()
    );
  }

  /**
   * @param {string} name
   * @param {string|TemplateEngine} templateEngine
   * @param {string} state - draft|published
   */
  load(name, templateEngine, state = 'draft') {
    return this.s3Folder.loadObject(this._getFilePath(name, templateEngine, state))
      .then(({content, metadata}) =>
        new Template({
          name,
          content,
          engineName: TemplateEngine.wrap(templateEngine).name,
          subject: metadata[S3_METADATA_SUBJECT_KEY],
          fromEmail: metadata[S3_METADATA_FROM_EMAIL_KEY],
          fromName: metadata[S3_METADATA_FROM_NAME_KEY]
        }));
  }


  /**
   * Templates can have locale variants, which are separate templates sharing the same base file
   * name but with a locale before the file extension: `some-template.hbs` ->
   * `some-template.fr.hbs`.
   *
   * @param {string} name - base template name
   * @param {string} state - draft|published
   * @return {Promise<Object<string, string>>} - Object mapping locale names to their corresponding
   *    template names.
   */
  getLocaleVariants(name, state = 'draft') {
    return this.s3Folder.listObjects(`${state}/${name}.`)
      .then((fileSuffixes) =>
        _(fileSuffixes)
          .map(({filePath: suffix}) => {
            const [locale, extension] = splitext(suffix);

            if (locale && extension) {
              return [locale, `${name}.${locale}`];
            }
          })
          .compact()
          .zipObject()
          .value()
      );
  }

  /**
   * @param {Template} template
   * @param {string} state - draft|published
   */
  save(template, state = 'draft') {
    const filePath = this._getFilePath(template.name, template.engineName, state);
    return this.s3Folder.saveObject(filePath, {
      content: template.content,
      metadata: {
        [S3_METADATA_SUBJECT_KEY]: template.subject,
        [S3_METADATA_FROM_NAME_KEY]: template.fromName,
        [S3_METADATA_FROM_EMAIL_KEY]: template.fromEmail
      }
    });
  }

  copy(name, templateEngine, newName) {
    const oldPath = this._getFilePath(name, templateEngine);
    const newPath = this._getFilePath(newName, templateEngine);

    return this.s3Folder.copyObject(oldPath, newPath);
  }

  move(name, templateEngine, newName) {
    const oldPath = this._getFilePath(name, templateEngine);
    const newPath = this._getFilePath(newName, templateEngine);

    return this.s3Folder.copyObject(oldPath, newPath)
      .then(() => this.s3Folder.deleteObject(oldPath));
  }

  delete(name, templateEngine) {
    // Deletion is just a move to the "deleted" folder with a timestamp added
    // to the path for uniqueness (e.g., if a template with the same name is
    // later created and deleted).

    const oldPath = this._getFilePath(name, templateEngine);
    const newPath = this._getFilePath(`${name}.${Date.now()}`, templateEngine, 'deleted');

    return this.s3Folder.copyObject(oldPath, newPath)
      .then(() => this.s3Folder.deleteObject(oldPath));
  }
}
