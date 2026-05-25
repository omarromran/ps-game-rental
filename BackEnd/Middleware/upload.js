const multer = require('multer');
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const cloudinary = require('cloudinary').v2;

// Configure Cloudinary directly here using your .env credentials
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Tell Multer to upload files to Cloudinary instead of your server disk
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

// Reject any file that is not an image
const fileFilter = (req, file, cb) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    return cb(
      new Error('Only JPG, PNG, and WEBP images are allowed'),
      false
    );
  }
};

// Create the final upload instance
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB per file
    files: 5,                   // max 5 images per request
  },
});

module.exports = upload;