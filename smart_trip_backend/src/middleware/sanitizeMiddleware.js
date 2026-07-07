// Recursive helper to escape HTML characters from strings to prevent Stored XSS
const escapeHtml = (str) => {
  if (typeof str !== 'string') return str;
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
};

// In-place NoSQL sanitizer to prevent injection keys starting with $ or containing .
const sanitizeNoSql = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (key.startsWith('$') || key.includes('.')) {
        delete obj[key];
      } else if (typeof obj[key] === 'object') {
        sanitizeNoSql(obj[key]);
      }
    }
  }
};

const isLikelyBase64 = (str, key) => {
  if (key === 'image' || key === 'photo' || key === 'coverImage' || key === 'logo' || key === 'mimeType') {
    return true;
  }
  if (str.startsWith('data:image/') || str.startsWith('image/')) {
    return true;
  }
  if (str.length > 100 && !/\s/.test(str) && /^[a-zA-Z0-9+/=]+$/.test(str)) {
    return true;
  }
  return false;
};

// In-place XSS sanitizer to escape HTML string properties
const sanitizeXss = (obj) => {
  if (obj && typeof obj === 'object') {
    for (const key in obj) {
      if (typeof obj[key] === 'string') {
        if (!isLikelyBase64(obj[key], key)) {
          obj[key] = escapeHtml(obj[key]);
        }
      } else if (typeof obj[key] === 'object') {
        sanitizeXss(obj[key]);
      }
    }
  }
};

const xssSanitizer = (req, res, next) => {
  if (req.body) sanitizeXss(req.body);
  if (req.query) sanitizeXss(req.query);
  if (req.params) sanitizeXss(req.params);
  next();
};

const noSqlSanitizer = (req, res, next) => {
  if (req.body) sanitizeNoSql(req.body);
  if (req.query) sanitizeNoSql(req.query);
  if (req.params) sanitizeNoSql(req.params);
  next();
};

module.exports = {
  noSqlSanitizer,
  xssSanitizer
};
