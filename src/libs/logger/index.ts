import winston, { createLogger } from 'winston'

export const appLogger = createLogger({
  level: process.env.LOG_LEVEL || 'info',
  format: winston.format.simple(),
  transports: [new winston.transports.Stream({ stream: process.stdout })],
})
