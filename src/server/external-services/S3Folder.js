import * as path from 'path';
import * as AWS from 'aws-sdk';
import * as base32 from 'thirty-two';
import _ from 'lodash';
import {stripPrefix, ensureSuffix} from '../util/strings';
import {wrapNodeback} from '../util/promises.js';

const AWS_S3_API_VERSION = '2006-03-01';

export default class S3Folder {
  constructor({accessKeyId, secretAccessKey, bucketName, keyPrefix = '', httpAgent = null}) {
    const opts = {
      accessKeyId,
      secretAccessKey,
      apiVersion: AWS_S3_API_VERSION
    };

    if (httpAgent) {
      opts.httpOptions = {
        agent: httpAgent
      };
    }

    this.s3 = new AWS.S3(opts);
    this.bucketName = bucketName;
    this.keyPrefix = stripPrefix(keyPrefix, '/');
  }

  _createKey(filePath) {
    if (!(filePath || this.keyPrefix)) {
      // path.join would return '.' in this case
      return '';
    }
    return path.join(this.keyPrefix, stripPrefix(filePath, '/'));
  }

  // S3 requires metdata to be ascii and case-insensitive if you intend
  // to use the REST API. Thus, we encode the possibly UTF-8 metdata as
  // base32.
  _encodeMetadata(metadata) {
    return _.mapValues(metadata, v => base32.encode(v).toString());
  }

  _decodeMetadata(metadata) {
    // S3 requires metdata to be ascii and case-insensitive if you intend
    // to use the REST API. Thus, we encode the possibly UTF-8 metdata as
    // base32.
    return _.mapValues(metadata, v => base32.decode(v).toString());
  }

  /**
   * @returns {Promise<Array<{filePath: string}>>}
   */
  listObjects(prefix = '') {
    const keyPrefix = stripPrefix(this._createKey(prefix), '/');

    return wrapNodeback(cb =>
       this.s3.listObjects({
        Bucket: this.bucketName,
        Prefix: keyPrefix
      }, cb)
    ).then(({Contents}) =>
      Contents.map(s3Object => ({
        filePath: stripPrefix(s3Object.Key, keyPrefix)
      })));
  }

  /**
   * @returns {Promise<{content: string, metadata: Object}>}
   */
  loadObject(filePath) {
    return wrapNodeback(cb =>
        this.s3.getObject({
          Bucket: this.bucketName,
          Key: this._createKey(filePath)
        }, cb))
      .then(({Body, Metadata}) => ({
        content: Body.toString('utf-8'),
        metadata: this._decodeMetadata(Metadata)
      }));
  }

  saveObject(filePath, {content, metadata}) {
    return wrapNodeback(cb => this.s3.putObject({
      Bucket: this.bucketName,
      Key: this._createKey(filePath),
      Body: new Buffer(content, 'utf-8'),
      Metadata: this._encodeMetadata(metadata)
    }, cb));
  }

  copyObject(filePath, destPath, destS3Folder = this) {
    // the S3 API requires a "CopySource" which is {bucket}/{key}
    const copySource = `${this.bucketName}/${this._createKey(filePath)}`;

    const destBucketName = destS3Folder.bucketName;
    const destKey = destS3Folder._createKey(destPath);

    return wrapNodeback(cb => this.s3.copyObject({
      Bucket: destBucketName,
      Key: destKey,
      CopySource: copySource,
      MetadataDirective: 'COPY'
    }, cb));
  }

  deleteObject(filePath) {
    return wrapNodeback(cb => this.s3.deleteObject({
      Bucket: this.bucketName,
      Key: this._createKey(filePath)
    }, cb));
  }
}
