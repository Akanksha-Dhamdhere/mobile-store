export const safeNum = (v) => (Number.isFinite(Number(v)) ? Number(v) : 0);

export const safeToFixed = (v, digits = 2) => {
  return safeNum(v).toFixed(digits);
};

export const safeStr = (v) => {
  if (v == null) return '';
  return typeof v === 'string' ? v : String(v);
};
