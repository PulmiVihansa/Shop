const fs = require('fs');
const path = require('path');
const multer = require('multer');

const productUploadsDir = path.join(__dirname, '..', 'uploads', 'products');

fs.mkdirSync(productUploadsDir, { recursive: true });

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/gif': '.gif',
  'image/avif': '.avif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, productUploadsDir),
  filename: (_req, file, callback) => {
    const safeExt = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    callback(null, `product-${unique}${safeExt}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (extensionByMime[file.mimetype]) {
    callback(null, true);
    return;
  }
  callback(new Error('Only JPEG, PNG, WebP, GIF, and AVIF product images are allowed'));
};

const productImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024,
    files: 8,
  },
}).array('images', 8);

const uploadProductImages = (req, res, next) => {
  productImageUpload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Product image upload failed',
      });
    }
    return next();
  });
};

const toProductImagePath = (file) => `/uploads/products/${file.filename}`;

module.exports = {
  productUploadsDir,
  uploadProductImages,
  toProductImagePath,
};
