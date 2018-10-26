
// TODO: add failure to all

/**
 * Returns a promise for the list of names.
 */
export function list({ projectName, templateName }) {
  return fetch(`/api/v1/sample-data/list/${projectName}/${templateName}`)
    .then(resp => resp.json());
}

/**
 * Returns a promise for the sample data as YAML code.
 */
export function load({ projectName, templateName, name, format }) {
  return fetch(`/api/v1/sample-data/${projectName}/${templateName}?name=${name}&v=${Date.now()}&format=${format || ''}`)
    .then(resp =>
        !resp.ok ? Promise.reject(resp)
        : format === 'json' ? resp.json()
        : resp.text());
}

/**
 * `code` should be the YAML code of the sample data. Returns a promise for
 * the completion of saving.
 */
export function save({ projectName, templateName, name, code }) {
  return fetch(`/api/v1/sample-data/${projectName}/${templateName}?name=${name}`, {
    method: 'POST',
    body: code
  });
}

export function deleteSampleData({ projectName, templateName, name }) {
  return fetch(`/api/v1/sample-data/${projectName}/${templateName}?name=${name}`, {
    method: 'DELETE'
  });
}
