export default class Template {
  constructor({name, content, engineName, subject, fromEmail, fromName}) {
    this.name = name;
    this.content = content;
    this.engineName = engineName;
    this.fromName = fromName;
    this.fromEmail = fromEmail;
    this.subject = subject;
  }
}
