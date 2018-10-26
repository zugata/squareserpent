'use strict';

const {templateService} = require('./lib/server/config');
const TemplateEngine = require("./lib/common/models/TemplateEngine");
const {splitext} = require("./lib/server/util/paths");

exports.handler = (event, context, callback) => {
  const {project, email, data, locale = null} = event;
  const [templateName, templateExt] = splitext(event.template);

  templateService.sendEmail({
    projectName: project,
    templateName,
    templateEngine: TemplateEngine.byFileExtension(templateExt),
    emailAddress: email,
    renderData: data,
    locale,
  })
  .then(
    () => { callback(null, {ok: true}); },
    err => { callback(err); }
  );
}
