/**
 * safeResponse - send a JSON response with sensible defaults when data is missing.
 * @param {object} res Express response object
 * @param {*} data The payload to send (may be null/undefined)
 * @param {'array'|'object'|'number'|'string'} [type='array'] Desired default type when data is null/undefined
 */
function safeResponse(res, data, type = 'array') {
  if (data == null) {
    const defaults = {
      array: [],
      object: {},
      number: 0,
      string: ''
    };
    data = defaults[type] ?? {};
  }
  return res.json({ success: true, data });
}

module.exports = { safeResponse };
