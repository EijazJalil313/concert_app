const logger = require("../config/logger");

const validationMiddleware = (schema) => (req, res, next) => {
  try {
    schema.parse(req.body);
    next();
  } catch (err) {
    logger.error("Validation error", { err });

    res.status(400).json({
      error: err.errors,
    });
  }
};

module.exports = validationMiddleware;
