'use strict';

const DEFAULT_DB_NAME = 'defaultdb';

const normalizeDatabaseUrl = (value) => {
  const configuredName = String(
    process.env.DB_NAME || DEFAULT_DB_NAME
  ).trim();

  if (!value || !configuredName) return value;

  try {
    const url = new URL(value);
    const currentName = decodeURIComponent(
      url.pathname.replace(/^\/+/, '')
    );

    if (currentName === configuredName) return value;

    console.warn(
      `[database] Overriding URL database "${currentName || '(none)'}" with DB_NAME "${configuredName}"`
    );

    url.pathname = `/${configuredName}`;
    return url.toString();
  } catch {
    return value;
  }
};

module.exports = { normalizeDatabaseUrl };
