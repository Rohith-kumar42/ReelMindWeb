function asyncHandler(fn) {
  return (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);
}

function clampNumber(value, fallback, min, max) {
  const number = Number(value);
  if (!Number.isFinite(number)) return fallback;
  return Math.min(max, Math.max(min, number));
}

function normalizeList(data) {
  return Array.isArray(data) ? data : [];
}

module.exports = {
  asyncHandler,
  clampNumber,
  normalizeList,
};
