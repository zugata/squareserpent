import path from 'path';
import fs from 'fs';
import assert from 'assert';
import yaml from 'js-yaml';
import _ from 'lodash';
import meow from 'meow';
import TemplateEngine from '../src/common/models/TemplateEngine';
import Template from '../src/common/models/Template';
import {stripSuffix} from '../src/server/util/strings';
import {splitext} from '../src/server/util/paths';
import {wrapNodeback} from '../src/server/util/promises';
import S3Folder from '../src/server/external-services/S3Folder';
import S3TemplateRepository from '../src/server/repositories/S3TemplateRepository';
import S3SampleDataRepository from '../src/server/repositories/S3SampleDataRepository';

const DEFAULT_FILE_ENCODING = 'utf8';
const JSON_EXT = '.json';
const COMMON_TEMPLATE_VARS = ['EMAIL'];

const cli = meow({
  description: "Uploads templates in a folder to S3 for use by SquareSerpent",
  version: false,
  help: `
    Uploads each template in the source folder to S3, setting it up for use by
    SquareSerpent. If there's a .json file in the directory with the same name
    as the template (e.g., "my-template.json" for "my-template.hbs"), it will be
    parsed, and the values for "fromName", "fromEmail", and "subject", if
    present, will be added as metadata to the uploaded template.

    The mandrillToHandlebars.js script in this project, which exports templates
    from Mandrill, creates a directory of templates that can be used as input
    for this script.

    Usage
      $ node ${process.argv[1]} [options]

    Options
      --src-dir               Source directory for the templates
      --s3-access-key-id
      --s3-secret-access-key
      --s3-bucket-name
      --s3-key-prefix=""
      --master-vars-file=""   If provided, should be a YAML file mapping variable
                              names to sample values. Will be used to initialize
                              sample data for the uploaded templates.
      --global-from-email=""  If provided, will change the from email on all templates to the
                              given value
      --file-encoding="${DEFAULT_FILE_ENCODING}"
  `
});

const {flags} = cli;

if (!(flags.srcDir && flags.s3AccessKeyId && flags.s3SecretAccessKey && flags.s3BucketName)) {
  cli.showHelp();
  assert(false, "cli.showHelp() should have exited the process");
}

if (!fs.statSync(flags.srcDir).isDirectory()) {
  throw new Error(`"${flags.srcDir}" is not a directory.`);
}

const srcDir = path.resolve(flags.srcDir);
const fileEncoding = flags.fileEncoding || DEFAULT_FILE_ENCODING;
const masterVarsFilePath = flags.masterVarsFile ? path.resolve(flags.masterVarsFile) : null;
const keyPrefix = stripSuffix(flags.s3KeyPrefix || '', '/');
const {globalFromEmail} = flags;

const s3FolderOpts = {
  accessKeyId: flags.s3AccessKeyId,
  secretAccessKey: flags.s3SecretAccessKey,
  bucketName: flags.s3BucketName,
};

const templateRepository = new S3TemplateRepository({
  s3Folder: new S3Folder({
    ...s3FolderOpts,
    keyPrefix: `${keyPrefix}/templates/`,
  }),
});

const sampleDataRepository = new S3SampleDataRepository({
  s3Folder: new S3Folder({
    ...s3FolderOpts,
    keyPrefix: `${keyPrefix}/sample-data/`,
  }),
});

async function maybeLoadTemplateFromFile(filename, filenameSet) {
  const [filenameBase, fileExt] = splitext(filename);

  if (fileExt === JSON_EXT) {
    return null;
  }

  const templateEngine = TemplateEngine.byFileExtension(fileExt);

  if (!templateEngine) {
    return null;
  }

  console.log(`Reading ${filenameBase} from file...`);

  const jsonFilename = `${filenameBase}${JSON_EXT}`;

  const metadata =
    filenameSet[jsonFilename] ?
      JSON.parse(
        await wrapNodeback(cb =>
          fs.readFile(path.join(srcDir, jsonFilename), fileEncoding, cb)))
    :
      {};

  const templateContent =
    await wrapNodeback(cb => fs.readFile(path.join(srcDir, filename), fileEncoding, cb));

  return new Template({
    name: filenameBase,
    content: templateContent,
    engineName: templateEngine.name,
    subject: metadata.subject || '',
    fromName: metadata.fromName || '',
    fromEmail: globalFromEmail || metadata.fromEmail || '',
  });
}

function getSampleDataForTemplate(template, masterVarMapping, varNameRegex) {
  return (
    _(template.content.match(varNameRegex))
      .concat(template.subject.match(varNameRegex))
      .concat(COMMON_TEMPLATE_VARS)
      .uniq()
      .map(varName => [varName, masterVarMapping[varName]])
      .fromPairs()
      .value()
  );
}

~async function() {
  const filenames = await wrapNodeback(cb => fs.readdir(srcDir, cb));
  const filenameSet = _(filenames).invert().mapValues(() => true).value();

  let masterVarMapping = null, varNameRegex = null;

  if (masterVarsFilePath) {
    console.log(`Loading master variables file from ${masterVarsFilePath}...`);

    masterVarMapping =
      yaml.safeLoad(await wrapNodeback(cb => fs.readFile(masterVarsFilePath, fileEncoding, cb)));

    varNameRegex = new RegExp(_(masterVarMapping).keys().map(_.escapeRegExp).join("|"), "g");
  }

  await Promise.all(filenames.map(async filename => {
    const template = await maybeLoadTemplateFromFile(filename, filenameSet);

    if (!template) {
      return;
    }

    const sampleData =
      masterVarMapping && getSampleDataForTemplate(template, masterVarMapping, varNameRegex);

    console.log(`Uploading ${template.name}...`);

    await Promise.all([
      templateRepository.save(template, 'draft'),
      templateRepository.save(template, 'published'),
      sampleData && sampleDataRepository.save(template.name, 'sample-data-1', sampleData),
    ]);

    console.log(`Uploaded ${template.name}`);

  }));
}();
