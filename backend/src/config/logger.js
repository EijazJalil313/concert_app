const winston = require("winston");
const { MongoDB } = require("winston-mongodb");

const transports = [
    new winston.transports.Console(),
    new winston.transports.File({ filename: "error.log", level: "error" }),
    new winston.transports.File({ filename: "combined.log", level: "info" })
];

if (process.env.DATABASE_URL) {
    transports.push(
        new MongoDB({
            db: process.env.DATABASE_URL,
            collection: "logs",
            level: "info",
        })
    );
}

const logger = winston.createLogger({
    level: "info",
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.json()
    ),
    transports
});

module.exports = logger;