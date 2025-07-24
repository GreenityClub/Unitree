const winston = require('winston');
const { env } = require('../config/env');

// =================================================================
// ==                      LOGGER SETUP                         ==
// =================================================================

/**
 * Custom log format for development console logging.
 * Includes colors, timestamps, and proper alignment.
 */
const devFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
  winston.format.printf(
    (info) => `${info.timestamp} [${info.level}]: ${info.message}`
  )
);

/**
 * JSON log format for file transports (production-ready).
 */
const jsonFormat = winston.format.combine(
  winston.format.timestamp(),
  winston.format.json()
);

const transports = [
  // Always log errors to a dedicated file.
  new winston.transports.File({
    filename: 'logs/error.log',
    level: 'error',
    format: jsonFormat,
  }),
  // Log all levels to a combined file.
  new winston.transports.File({
    filename: 'logs/combined.log',
    format: jsonFormat,
  }),
];

// In non-production environments, add a colorful and readable console transport.
if (env.NODE_ENV !== 'production') {
  transports.push(
    new winston.transports.Console({
      format: devFormat,
    })
  );
} else {
  // In production, use a simple JSON format for the console (e.g., for log aggregators).
  transports.push(
    new winston.transports.Console({
      format: jsonFormat,
    })
  );
}

/**
 * Winston logger instance.
 * Configured with different transports and formats for development vs. production.
 */
const logger = winston.createLogger({
  level: env.LOG_LEVEL || 'info',
  transports,
});

logger.info(`Logger initialized in ${env.NODE_ENV} mode with level ${logger.level}.`);

module.exports = logger; 