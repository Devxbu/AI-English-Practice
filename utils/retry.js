function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

async function withRetry(fn, { attempts = 3, baseDelayMs = 300, factor = 2, onError } = {}) {
  let lastErr;
  for (let i = 0; i < attempts; i++) {
    try {
      return await fn();
    } catch (err) {
      lastErr = err;
      if (onError) {
        try { onError(err, i + 1); } catch {}
      }
      const delay = baseDelayMs * Math.pow(factor, i);
      await sleep(delay);
    }
  }
  throw lastErr;
}

module.exports = { withRetry };
