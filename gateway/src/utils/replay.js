'use strict';
/** FR-03: reject anything older than the tolerance window (default 300 s). Future skew is capped too. */

function checkTimestamp(timestampSeconds, toleranceSeconds, nowMs = Date.now()) {
  if (!Number.isFinite(timestampSeconds)) return { ok: false, reason: 'Invalid timestamp' };
  const ageSeconds = nowMs / 1000 - timestampSeconds;
  if (ageSeconds > toleranceSeconds) {
    return { ok: false, reason: `Timestamp too old (${Math.round(ageSeconds)}s > ${toleranceSeconds}s)` };
  }
  if (ageSeconds < -toleranceSeconds) {
    return { ok: false, reason: 'Timestamp too far in the future' };
  }
  return { ok: true };
}

module.exports = { checkTimestamp };
