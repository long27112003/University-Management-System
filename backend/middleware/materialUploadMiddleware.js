const upload = require('./uploadMiddleware');

const handleMaterialUpload = (req, res, next) => {
  upload.fields([
    { name: 'file', maxCount: 1 },
    { name: 'material', maxCount: 1 },
  ])(req, res, (err) => {
    if (err) {
      if (err.code === 'LIMIT_FILE_SIZE') {
        return res.status(422).json({
          message: 'Kích thước tệp vượt quá giới hạn tối đa (15MB). Vui lòng chọn tệp nhỏ hơn.',
        });
      }
      if (err.statusCode === 422 || err.code === 'INVALID_FILE_TYPE') {
        return res.status(422).json({
          message: err.message || 'Định dạng tệp không được hỗ trợ',
        });
      }
      return res.status(400).json({
        message: err.message || 'Lỗi xử lý tệp tải lên',
      });
    }
    if (req.files) {
      req.file = req.files.file?.[0] || req.files.material?.[0] || null;
    }
    next();
  });
};

module.exports = handleMaterialUpload;
