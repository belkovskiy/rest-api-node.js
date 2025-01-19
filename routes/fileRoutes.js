const express = require('express');
const fs = require('fs');
const path = require('path');
const multer = require('multer');
const iconv = require('iconv-lite');

const {
  body,
  param,
  query,
  validationResult
} = require('express-validator');

const checkAccessToken =
  require('../middleware/authMiddleware');

const {
  uploadFile,
  listFiles,
  deleteFile,
  getFileInfo,
  downloadFile,
  updateFile
} = require('../controllers/fileController');

const router = express.Router();

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const uploadDir = 'uploads';
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const originalName = iconv.decode(
      Buffer.from(file.originalname, 'binary'), 'utf-8'
    );
    cb(null, originalName);
  }
});

const upload = multer({
  storage: storage,
  fileFilter: (req, file, cb) => {    
    const originalName = iconv.decode(
      Buffer.from(file.originalname, 'binary'), 'utf-8'
    );
    const filePath = path.join('uploads', originalName);

    if (fs.existsSync(filePath) && req.method == 'POST') {
      return cb(
        'Error! File with the same name already exists!'
      );
    }

    if (!fs.existsSync(filePath) && req.method == 'PUT') {
      return cb(
        'Error! File with the same name does not exist!'
      )
    }
    
    cb(null, true);
  }
});

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
  getFileInfo
);

router.get(
  '/download/:id',
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
  updateFile
);

module.exports = router;
