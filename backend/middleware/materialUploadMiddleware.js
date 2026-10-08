const upload = require('./uploadMiddleware');

const handleMaterialUpload = (req, res, next) => {
  upload.single('file')(req, res, (err) => {
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
    next();
  });
};

module.exports = handleMaterialUpload;
