/**
 * @fileoverview Builds and configures this application's services and controllers.
 */

import * as https  from 'https';
import * as _  from 'lodash';
import * as nodemailer  from 'nodemailer';
import SampleDataController  from '../controllers/SampleDataController';
import TemplateController  from '../controllers/TemplateController';
import S3Folder  from '../external-services/S3Folder';
import S3SampleDataRepository  from '../repositories/S3SampleDataRepository';
import S3TemplateRepository  from '../repositories/S3TemplateRepository';
import SampleDataService  from '../services/SampleDataService';
import TemplateService  from '../services/TemplateService';
import HandlebarsRenderer from '../../common/renderers/HandlebarsRenderer';
import NoopPublisher from '../publishers/NoopPublisher';
import { stripSuffix, stringAsBoolean } from '../util/strings';

const s3KeyPrefix = stripSuffix(process.env.SQUARESERPENT_S3_KEY_PREFIX || '', '/'),
  s3TlsAllowUnauthorized = stringAsBoolean(process.env.SQUARESERPENT_S3_TLS_ALLOW_UNAUTHORIZED || ''),
  s3AccessKeyId = process.env.SQUARESERPENT_S3_ACCESS_KEY_ID,
  s3SecretAccessKey = process.env.SQUARESERPENT_S3_SECRET_ACCESS_KEY,
  s3BucketName = process.env.SQUARESERPENT_S3_BUCKET_NAME,
  smtpHost = process.env.SQUARESERPENT_SMTP_HOST,
  smtpPort = Number(process.env.SQUARESERPENT_SMTP_PORT),
  smtpUsername = process.env.SQUARESERPENT_SMTP_USERNAME,
  smtpPassword = process.env.SQUARESERPENT_SMTP_PASSWORD,
  smtpUseTls = stringAsBoolean(process.env.SQUARESERPENT_SMTP_USE_TLS),
  defaultProjectName = process.env.SQUARESERPENT_DEFAULT_PROJECT;


const s3FolderOpts = {
  accessKeyId: s3AccessKeyId,
  secretAccessKey: s3SecretAccessKey,
  bucketName: s3BucketName
};

if (s3TlsAllowUnauthorized) {
  s3FolderOpts.httpAgent = new https.Agent({ rejectUnauthorized: false });
}

const templateS3Folder = new S3Folder(_.assign({
  keyPrefix: `${s3KeyPrefix}/templates/`,
}, s3FolderOpts));

const sampleDataS3Folder = new S3Folder(_.assign({
  keyPrefix: `${s3KeyPrefix}/sample-data/`,
}, s3FolderOpts));

const templateRepository = new S3TemplateRepository({
  s3Folder: templateS3Folder,
});

const sampleDataRepository = new S3SampleDataRepository({
  s3Folder: sampleDataS3Folder
});

const nodemailerTransport = nodemailer.createTransport({
  host: smtpHost,
  port: smtpPort,
  secure: smtpUseTls,
  auth: {
    user: smtpUsername,
    pass: smtpPassword,
  },
});

const handlebarsRenderer = new HandlebarsRenderer();

const renderersByEngineName = {
  handlebars: handlebarsRenderer
};

export const templateService = new TemplateService({
  projects: {
    [defaultProjectName]: {
      templateRepository,
      sampleDataRepository,

      // No publish behavior needed currently, as the production templates
      // are used from the S3 folder that the S3TemplateRepository places them in
      publisher: new NoopPublisher(),
    }
  },
  renderersByEngineName,
  nodemailerTransport,
  fromEmail: smtpUsername,
});

export const sampleDataService = new SampleDataService({
  repositoriesByProject: {
    [defaultProjectName]: sampleDataRepository
  }
});

export const templateController = new TemplateController({templateService});

export const sampleDataController = new SampleDataController({sampleDataService});
