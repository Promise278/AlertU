require("dotenv").config();

const { Sequelize } = require("sequelize");
const { normalizeDatabaseUrl } = require("./databaseUrl");

const useSsl = process.env.DB_SSL !== "false";
const rejectUnauthorized =
  process.env.DB_SSL_REJECT_UNAUTHORIZED === "true";
const ca = process.env.DB_SSL_CA_BASE64
  ? Buffer.from(process.env.DB_SSL_CA_BASE64, "base64").toString("utf8")
  : undefined;

const options = {
  dialect: "postgres",
  logging: process.env.DB_LOGGING === "true" ? console.log : false,
  pool: {
    max: Number(process.env.DB_POOL_MAX) || 10,
    min: Number(process.env.DB_POOL_MIN) || 0,
    acquire: 30000,
    idle: 10000,
  },
  ...(useSsl
    ? {
        dialectOptions: {
          ssl: {
            require: true,
            rejectUnauthorized,
            ...(ca ? { ca } : {}),
          },
        },
      }
    : {}),
};

const hasDiscreteDatabase = Boolean(
  process.env.DB_NAME && process.env.DB_USER && process.env.DB_HOST
);
const databaseUrl = normalizeDatabaseUrl(
  process.env.DATABASE_URL || process.env.DB_URL
);

// Prefer explicit DB_* settings when complete. This keeps the runtime on the
// configured host and port instead of silently using a stale DATABASE_URL.
const connection = hasDiscreteDatabase
  ? new Sequelize(
      process.env.DB_NAME,
      process.env.DB_USER,
      process.env.DB_PASSWORD,
      {
        ...options,
        host: process.env.DB_HOST,
        port: Number(process.env.DB_PORT) || 5432,
      }
    )
  : databaseUrl
    ? new Sequelize(databaseUrl, options)
    : new Sequelize(
        process.env.DB_NAME,
        process.env.DB_USER,
        process.env.DB_PASSWORD,
        {
          ...options,
          host: process.env.DB_HOST,
          port: Number(process.env.DB_PORT) || 5432,
        }
      );

module.exports = connection;
