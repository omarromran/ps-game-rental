const multer = require('multer');

const errorMiddleware = (err, req, res, next) => {
  console.error(err.stack);

  let statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";

  // Upload problems (file too large, too many files, unexpected field, or a
  // rejected file type from the image fileFilter) are client errors, not
  // server errors — surface them as 400 with their real message.
  if (err instanceof multer.MulterError || err.isUploadError) {
    statusCode = 400;
  }

  res.status(statusCode).json({
    success: false,
    message: statusCode === 500 ? "Something went wrong, please try again." : message
  });
};

module.exports = errorMiddleware;