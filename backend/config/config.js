require('dotenv').config();

const { normalizeDatabaseUrl } = require('./databaseUrl');

const useSsl = process.env.DB_SSL !== 'false';
const rejectUnauthorized = process.env.DB_SSL_REJECT_UNAUTHORIZED === 'true';
const ca = process.env.DB_SSL_CA_BASE64
  ? Buffer.from(process.env.DB_SSL_CA_BASE64, 'base64').toString('utf8')
  : undefined;

const dialectOptions = useSsl
  ? {
      ssl: {
        require: true,
        rejectUnauthorized,
        ...(ca ? { ca } : {}),
      },
    }
  : {};

const hasDiscreteDatabase = Boolean(
  process.env.DB_NAME && process.env.DB_USER && process.env.DB_HOST
);

const envVar = hasDiscreteDatabase
  ? null
  : process.env.DATABASE_URL
    ? 'DATABASE_URL'
    : process.env.DB_URL
      ? 'DB_URL'
      : null;

const common = {
  dialect: 'postgres',
  dialectOptions,
};

const urlConfig = envVar
  ? (() => {
      const rawUrl = process.env[envVar];
      const normalizedUrl = normalizeDatabaseUrl(rawUrl);

      return normalizedUrl === rawUrl
        ? {
            use_env_variable: envVar,
            ...common,
          }
        : {
            url: normalizedUrl,
            ...common,
          };
    })()
  : null;

const discreteConfig = {
  username: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  ...common,
};

module.exports = {
  development: hasDiscreteDatabase
    ? discreteConfig
    : urlConfig || discreteConfig,
  production: hasDiscreteDatabase
    ? discreteConfig
    : urlConfig || discreteConfig,
};
