const fs = require('fs');
const path = require('path');
const multer = require('multer');

const avatarUploadsDir = path.join(__dirname, '..', 'uploads', 'avatars');

fs.mkdirSync(avatarUploadsDir, { recursive: true });

const extensionByMime = {
  'image/jpeg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
  'image/avif': '.avif',
};

const storage = multer.diskStorage({
  destination: (_req, _file, callback) => callback(null, avatarUploadsDir),
  filename: (req, file, callback) => {
    const safeExt = extensionByMime[file.mimetype] || path.extname(file.originalname).toLowerCase() || '.jpg';
    const userId = req.user?.id || req.user?._id || 'user';
    callback(null, `avatar-${userId}-${Date.now()}${safeExt}`);
  },
});

const fileFilter = (_req, file, callback) => {
  if (extensionByMime[file.mimetype]) {
    callback(null, true);
    return;
  }
  callback(new Error('Only JPEG, PNG, WebP, and AVIF avatar images are allowed'));
};

const avatarImageUpload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024,
    files: 1,
  },
}).single('avatar');

const uploadAvatarImage = (req, res, next) => {
  avatarImageUpload(req, res, (error) => {
    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message || 'Avatar upload failed',
      });
    }
    return next();
  });
};

const toAvatarImagePath = (file) => `/uploads/avatars/${file.filename}`;

module.exports = {
  avatarUploadsDir,
  uploadAvatarImage,
  toAvatarImagePath,
};
