const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'ps-rental/games',
    format: async (req, file) => {
      return 'png';
    },
    transformation: [{ width: 800, height: 1000, crop: 'limit' }],
  },
});

const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    // Flag this as a client-side upload error so the global error handler
    // returns HTTP 400 (with this message) instead of a generic 500.
    const uploadError = new Error('Only JPG, PNG, and WEBP images are allowed');
    uploadError.isUploadError = true;
    uploadError.statusCode = 400;
    return cb(uploadError, false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,                   // max 5 images per request
  },
});

module.exports = upload;