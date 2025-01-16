const express = require('express');
const multer = require('multer');

const {
  body,
  param,
  query,
  validationResult
} = require('express-validator');

const {
  checkAccessToken
} = require('../middleware/authMiddleware');

const {
  uploadFile,
  listFiles,
  deleteFile,
  getFile,
  downloadFile,
  updataFile
} = require('../controllers/fileController');

const router = express.Router();
const upload = multer({ dest: 'uploads/' });

const validateFileUpload = [
  upload.single('file'),
  (req, res, next) => {
    if (!req.file) {
      return res.status(400)
        .json({ message: 'File is required! ' });
    }
    next();
  },
];

const validatePagination = [
  query('list_size')
    .optional()
    .isInt({ min: 1 })
    .withMessage('List size must be a positive integer!'),
  query('page')
    .optional()
    .isInt({ min: 1 })
    .withMessage('Page must be a positive integer!'),
];

const validateFileId = [
  param('id')
    .isInt()
    .withMessage('File ID must be an integer'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty) {
    return res.status(400)
      .json({ errors: errors.array() });
  }
  next();
};

router.post(
  '/upload',
  checkAccessToken,
  validateFileUpload,
  handleValidationErrors,
  uploadFile
);

router.get(
  '/list',
  checkAccessToken,
  validatePagination,
  handleValidationErrors,
  listFiles
);

router.get(
  '/:id',
  checkAccessToken,
  validateFileId,
  handleValidationErrors,
  getFile
);

router.get(
  '/dowmload/:id',
  checkAccessToken,
  validateFileId,
  handleValidationErrors,
  downloadFile
);

router.delete(
  '/delete/:id',
  checkAccessToken,
  validateFileId,
  handleValidationErrors,
  deleteFile
);

router.put(
  '/update/:id',
  checkAccessToken,
  validateFileId,
  validateFileUpload,
  handleValidationErrors,
  updataFile
);

module.exports = router;
