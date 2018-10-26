// TODO: add validation/docs to routes (esp. query string params)
/**
 * Maps controller names (camelCased) to lists of tuples of
 * `[method, route, methodName, (optional) routeConfig]`
 * where `methodName` is a method on the corresponding controller. The last
 * element is an optional object that should be merged into the Hapi route config.
 */
export default {
  templateController: [
    ['GET', '/api/v1/templates/{projectName}/{templateFilePath*}', 'load'],
    ['POST', '/api/v1/templates/{projectName}/{templateFilePath*}', 'create'],
    ['PUT', '/api/v1/templates/{projectName}/{templateFilePath*}', 'update'],
    ['DELETE', '/api/v1/templates/{projectName}/{templateFilePath*}', 'delete'],
    ['POST', '/api/v1/templates/move/{projectName}/{templateFilePath*}', 'move'],
    ['POST', '/api/v1/templates/copy/{projectName}/{templateFilePath*}', 'copy'],
    ['GET', '/api/v1/templates/list/{projectName}', 'list'],
    ['POST', '/api/v1/templates/send-test/{projectName}/{templateFilePath*}', 'sendTest'],
    ['GET', '/api/v1/templates/preview/{projectName}/{templateFilePath*}', 'preview'],
    ['POST', '/api/v1/templates/publish/{projectName}/{templateFilePath*}', 'publish']
  ],
  sampleDataController: [
    ['GET', '/api/v1/sample-data/list/{projectName}/{templateName*}', 'list'],
    ['GET', '/api/v1/sample-data/{projectName}/{templateName*}', 'load'],
    ['POST', '/api/v1/sample-data/{projectName}/{templateName*}', 'save'],
    ['PUT', '/api/v1/sample-data/{projectName}/{templateName*}', 'save'],
    ['DELETE', '/api/v1/sample-data/{projectName}/{templateName*}', 'delete']
  ]
}
