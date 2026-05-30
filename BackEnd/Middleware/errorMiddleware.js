const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong, please try again." : message
  });
};

module.exports = errorMiddleware;