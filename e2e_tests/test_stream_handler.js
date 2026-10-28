const assert = require('assert');

// Simulate the stream open handler logic from useLiveSearch
async function handleStreamOpen(response, onLogout) {
  const contentType = response.headers.get('content-type') || '';
  if (response.ok && contentType.includes('text/event-stream')) {
    return; // Valid SSE stream
  }

  let detailMsg = `Request failed (${response.status})`;
  try {
    const data = await response.json();
    if (typeof data.detail === 'string') {
      detailMsg = data.detail;
    } else if (Array.isArray(data.detail)) {
      detailMsg = data.detail.map(d => d.msg || d.message || JSON.stringify(d)).join('; ');
    } else if (data.message) {
      detailMsg = data.message;
    } else if (data.error) {
      detailMsg = data.error;
    }
  } catch {
    try {
      const text = await response.text();
      if (text) detailMsg = text.slice(0, 300);
    } catch {}
  }

  if (response.status === 401) {
    if (onLogout) {
      onLogout();
    }
    throw new Error(`Session expired or unauthorized (${detailMsg}). Please log in again.`);
  }

  throw new Error(detailMsg);
}

// Helper to mock fetch Response
function mockResponse(status, ok, contentType, bodyObj) {
  return {
    status,
    ok,
    headers: {
      get: (h) => (h.toLowerCase() === 'content-type' ? contentType : null)
    },
    json: async () => bodyObj,
    text: async () => JSON.stringify(bodyObj)
  };
}

async function runTests() {
  // 1. Success case: 200 with text/event-stream
  {
    const res = mockResponse(200, true, 'text/event-stream; charset=utf-8', {});
    await handleStreamOpen(res, null); // should not throw
  }

  // 2. 401 Unauthorized case: should call onLogout and throw with clear message
  {
    let loggedOut = false;
    const res = mockResponse(401, false, 'application/json', { detail: 'Invalid or inactive API key' });
    try {
      await handleStreamOpen(res, () => { loggedOut = true; });
      assert.fail('Should have thrown on 401');
    } catch (err) {
      assert.strictEqual(loggedOut, true, 'onLogout must be triggered on 401');
      assert(err.message.includes('Session expired or unauthorized'), 'Error must contain clear login instruction');
      assert(err.message.includes('Invalid or inactive API key'), 'Error must contain backend detail');
    }
  }

  // 3. 429 Rate limit case
  {
    const res = mockResponse(429, false, 'application/json', { detail: 'Rate limit exceeded: 5 requests/minute' });
    try {
      await handleStreamOpen(res, null);
      assert.fail('Should have thrown on 429');
    } catch (err) {
      assert.strictEqual(err.message, 'Rate limit exceeded: 5 requests/minute');
    }
  }

  // 4. 422 Validation error array case
  {
    const res = mockResponse(422, false, 'application/json', {
      detail: [{ loc: ['body', 'query'], msg: 'Field required' }]
    });
    try {
      await handleStreamOpen(res, null);
      assert.fail('Should have thrown on 422');
    } catch (err) {
      assert.strictEqual(err.message, 'Field required');
    }
  }

  // 5. 500 Internal error case
  {
    const res = mockResponse(500, false, 'application/json', { error: 'Database timeout' });
    try {
      await handleStreamOpen(res, null);
      assert.fail('Should have thrown on 500');
    } catch (err) {
      assert.strictEqual(err.message, 'Database timeout');
    }
  }

  console.log('All stream handler checks passed!');
}

runTests();

