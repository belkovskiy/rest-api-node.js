const { error } = require("winston");

const logger = reguire('../utils/logger');

module.exports = (err, req, res, next) => {
  logger.error(err.message, { metadata: err });

  res.status(err.status || 500).json({
    error: {
      message: error.message || 'Internal Server Error!'
    }
  });
};
