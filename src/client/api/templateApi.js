import Template from '../../common/models/Template';

// TODO: add failure to all

export function load({ projectName, templateFilePath, state = 'draft' }) {
  return fetch(`/api/v1/templates/${projectName}/${templateFilePath}?state=${encodeURIComponent(state)}`)
    .then(resp => resp.ok ? resp.json() : Promise.reject(resp))
    .then(data => new Template(data));
}

export function list({ projectName }) {
  return fetch(`/api/v1/templates/list/${projectName}`)
    .then(resp => resp.ok ? resp.json() : Promise.reject(resp));
}

export function update({ projectName, templateFilePath, content, ...otherProps }) {
  const qs = _(otherProps)
    .map((value, key) => `${key}=${encodeURIComponent(value || '')}`)
    .join('&');

  return fetch(`/api/v1/templates/${projectName}/${templateFilePath}?${qs}`, {
    method: 'PUT',
    body: content
  });
}

export function create({ projectName, templateFilePath }) {
  return fetch(`/api/v1/templates/${projectName}/${templateFilePath}`, {
    method: 'POST',
    body: '<!-- code -->'
  });
}

export function move({ projectName, templateFilePath, newName }) {
  return fetch(`/api/v1/templates/move/${projectName}/${templateFilePath}?newName=${encodeURIComponent(newName)}`, {
    method: 'POST'
  });
}

export function copy({ projectName, templateFilePath, newName }) {
  return fetch(`/api/v1/templates/copy/${projectName}/${templateFilePath}?newName=${encodeURIComponent(newName)}`, {
    method: 'POST'
  });
}

export function deleteTemplate({ projectName, templateFilePath }) {
  return fetch(`/api/v1/templates/${projectName}/${templateFilePath}`, {
    method: 'DELETE'
  });
}

export function sendTest({ projectName, templateFilePath, emailAddress, sampleDataName }) {
  return fetch(`/api/v1/templates/send-test/${projectName}/${templateFilePath}?emailAddress=${encodeURIComponent(emailAddress)}&sampleDataName=${sampleDataName || ''}`, {
    method: 'POST'
  });
}

export function getPreviewUrl({ projectName, templateFilePath, sampleDataName }) {
  return `/api/v1/templates/preview/${projectName}/${templateFilePath}?v=${Date.now()}&sampleDataName=${sampleDataName || ''}`;
}

export function publish({ projectName, templateFilePath }) {
  return fetch(`/api/v1/templates/publish/${projectName}/${templateFilePath}`, {
    method: 'POST'
  });
}
