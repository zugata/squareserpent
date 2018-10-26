import path from 'path';
import fs from 'fs';
import assert from 'assert';
import _ from 'lodash';
import meow from 'meow';
import {Mandrill} from 'mandrill-api/mandrill';
import {wrapNodeback} from '../src/server/util/promises';

const MANDRILL_MERGE_TAG_RE = /\*\|(?:([^:|]+):)?(.*?)\|\*/g;
const MANDRILL_COMPARISON_RE = /^\s*(.*?)\s*(=|!=|>=|<=|<|>)\s*(.*?)\s*$/;

const MANDRILL_OPERATOR_TO_HBS_HELPER = {
  // != is special-cased as {{#unless (equal ...)}}
  '=': 'equal',
  '>=': 'greaterThanOrEqual',
  '<=': 'lessThanOrEqual',
  '>': 'greaterThan',
  '<': 'lessThan',
};

const FOOTER_PARTIAL_NAME = "_footer";

const UNSUBSCRIBE_FOOTER_TEMPLATE = `<center>
    <br />
    <br />
    <br />
    <br />
    <br />
    <br />
    <table border="0" cellpadding="0" cellspacing="0" width="100%" id="canspamBarWrapper" style="background-color:#FFFFFF; border-top:1px solid #E5E5E5;">
        <tr>
            <td align="center" valign="top" style="padding-top:20px; padding-bottom:20px;">
                <table border="0" cellpadding="0" cellspacing="0" id="canspamBar">
                    <tr>
                        <td align="center" valign="top" style="color:#606060; font-family:Helvetica, Arial, sans-serif; font-size:11px; line-height:150%; padding-right:20px; padding-bottom:5px; padding-left:20px; text-align:center;">
                            This email was sent to <a href="mailto:{{EMAIL}}" target="_blank" style="color:#404040 !important;">{{EMAIL}}</a>
                            &nbsp;&nbsp;
                            <a href="{{unsub}}" style="color:#404040 !important;">unsubscribe from this list</a>
                        </td>
                    </tr>
                </table>
            </td>
        </tr>
    </table>
    <style type="text/css">
        @media only screen and (max-width: 480px){
            table[id="canspamBar"] td{font-size:14px !important;}
            table[id="canspamBar"] td a{display:block !important; margin-top:10px !important;}
        }
    </style>
</center>`;

const cli = meow({
  description: "Migrates templates from Mandrill to Handlebars.",
  version: false,
  help: `
    For each template in Mandrill, places a corresponding Handlebars template
    (.hbs) in the directory specified by --out-dir. Also places a .json file
    next to the template with the keys "fromName", "fromEmail", and "subject",
    with values taken from the Mandrill template, translated into Handlebars if
    necessary.

    Usage
      $ node ${process.argv[1]} [options]

    Options
      --mandrill-api-key    Mandrill API Key
      --out-dir             Destination for the generated Handlebars templates
      --include-footer      If specified, adds a "_footer.hbs" partial to the output
                            and adds a call to it at the bottom of each template
      --use-published       If specified, uses the published version of each template's code.
                            Otherwise, uses the draft version of the code.
  `
});

if (!(cli.flags.mandrillApiKey && cli.flags.outDir)) {
  cli.showHelp();
  assert(false, "cli.showHelp() should have exited the process");
}

if (!fs.statSync(cli.flags.outDir).isDirectory()) {
  throw new Error(`"${cli.flags.outDir}" is not a directory.`);
}

const mandrill = new Mandrill(cli.flags.mandrillApiKey);
const outDir = path.resolve(cli.flags.outDir);
const {includeFooter, usePublished} = cli.flags;

function mandrillCodeToHandlebarsCode(mandrillCode) {
  if (!mandrillCode) {
    return mandrillCode;
  }

  return mandrillCode.replace(MANDRILL_MERGE_TAG_RE, (match, directive, expression) => {
    switch (directive) {
      case 'IF':
      case 'ELSEIF':
        const tagOpening = directive === 'IF' ? '{{#if' : '{{else'
        const comparisonMatch = expression.match(MANDRILL_COMPARISON_RE);

        if (comparisonMatch) {
          const [left, op, right] = comparisonMatch.slice(1);

          if (op === '!=') {
            return `${tagOpening} unless (equal ${left} ${right})}}`;

          } else {
            const comparisonHelper = MANDRILL_OPERATOR_TO_HBS_HELPER[op];

            if (!comparisonHelper) {
              throw new Error(`Unexpected Mandrill comparison: "${op}"`);
            }

            return `${tagOpening} (${comparisonHelper} ${left} ${right})}}`;
          }
        } else {
          return `${tagOpening} ${expression}}}`;
        }

      case 'ELSE':
        return '{{else}}';

      case 'END':
        if (expression === 'IF') {
          return '{{/if}}';
        } else {
          throw new Error(`Unexpected Mandrill merge tag: *|END:${expression}|*`);
        }

      case 'HTML':
        return `{{{${expression}}}}`;

      case 'DATE':
      case 'UNSUB':
        return `{{${directive.toLowerCase()} ${JSON.stringify(expression)}}}`;

      default:
        const helperName = directive && directive.toLowerCase();
        return `{{${helperName ? `${helperName} ` : ''}${expression}}}`;
    }
  });
}

function injectCallToFooter(code) {
  let injectionIndex = code.lastIndexOf("</body");

  if (injectionIndex === -1) {
    injectionIndex = code.lastIndexOf("</html");
  }

  if (injectionIndex === -1) {
    injectionIndex = code.length;
  }

  return `${code.slice(0, injectionIndex)}{{> ${FOOTER_PARTIAL_NAME}}}${code.slice(injectionIndex)}`;
}

function getTemplateCode(template) {
  return usePublished ? template.publish_code : template.code;
}

function convertAndSaveMandrillTemplate(template) {
  if (!getTemplateCode(template)) {
    console.log(`${template.slug} has no code, skipping`);
    return null;
  }

  console.log(`Converting ${template.slug}...`);

  let handlebarsCode = mandrillCodeToHandlebarsCode(getTemplateCode(template));

  if (includeFooter) {
    handlebarsCode = injectCallToFooter(handlebarsCode);
  }

  const metadata = {
    fromName: mandrillCodeToHandlebarsCode(template.from_name),
    fromEmail: template.from_email,
    subject: mandrillCodeToHandlebarsCode(template.subject),
  };

  return Promise.all(
    [
      [`${template.slug}.hbs`, handlebarsCode],
      [`${template.slug}.json`, JSON.stringify(metadata)],
    ].map(([filename, content]) =>
      wrapNodeback(cb => fs.writeFile(path.join(outDir, filename), content, cb))
    )
  ).then(() => {
    console.log(`Converted ${template.slug}`);
  });
}

if (includeFooter) {
  console.log('Writing footer to output directory...');
  fs.writeFileSync(path.join(outDir, `${FOOTER_PARTIAL_NAME}.hbs`), UNSUBSCRIBE_FOOTER_TEMPLATE);
}

new Promise(_.bindKey(mandrill.templates, 'list', {}))
  .then(templates =>
    Promise.all(templates.map(convertAndSaveMandrillTemplate)));
