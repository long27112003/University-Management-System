const multer = require('multer');
const path = require('path');
const fs = require('fs');

const uploadBaseDir = path.join(__dirname, '..', 'uploads');
const materialsDir = path.join(uploadBaseDir, 'materials');

if (!fs.existsSync(uploadBaseDir)) {
  fs.mkdirSync(uploadBaseDir, { recursive: true });
}
if (!fs.existsSync(materialsDir)) {
  fs.mkdirSync(materialsDir, { recursive: true });
}

// Storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, materialsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const cleanBaseName = path
      .basename(file.originalname, ext)
      .replace(/[^a-zA-Z0-9_-]/g, '_')
      .slice(0, 50);
    const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
    cb(null, `${cleanBaseName}-${uniqueSuffix}${ext}`);
  },
});

// File filter allowlist
const ALLOWED_EXTENSIONS = new Set([
  '.pdf',
  '.doc',
  '.docx',
  '.ppt',
  '.pptx',
  '.xls',
  '.xlsx',
  '.txt',
  '.png',
  '.jpg',
  '.jpeg',
]);

const fileFilter = (req, file, cb) => {
  const ext = path.extname(file.originalname).toLowerCase();
  if (ALLOWED_EXTENSIONS.has(ext)) {
    cb(null, true);
  } else {
    const err = new Error(`Loại tệp không được hỗ trợ (${ext}). Chỉ chấp nhận PDF, DOC, DOCX, PPT, PPTX, XLS, XLSX, TXT, JPG, PNG.`);
    err.statusCode = 422;
    err.code = 'INVALID_FILE_TYPE';
    cb(err, false);
  }
};

// 15 MB limit
const MAX_FILE_SIZE = 15 * 1024 * 1024;

const upload = multer({
  storage,
  limits: {
    fileSize: MAX_FILE_SIZE,
  },
  fileFilter,
});

module.exports = upload;
