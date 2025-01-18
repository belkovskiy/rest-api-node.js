const express = require('express');

const {
  body,
  validationResult
} = require('express-validator');

const {
  signup,
  signin,
  newToken,
  info,
  logout
} = require('../controllers/authController');

const checkAccessToken =
  require('../middleware/authMiddleware');

const router = express.Router();

const validateSignUp = [
  body('id')
    .custom(value => {
      const isEmail = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
      const isPhone = /^\+?[1-9]\d{1,14}$/.test(value);
      if (!isEmail && !isPhone) {
        throw new Error('ID must be valid email or phone number!');
      }
      return true;
    }),
  body('password')
    .isLength({ min: 8 }).withMessage('Password must be at least eight characters long!')
    .matches(/\d/).withMessage('Password must contain a number')
    .matches(/[A-Z]/).withMessage('Password must contain an uppercase letter')
    .matches(/[a-z]/).withMessage('Password must contain a lowercase letter')
    .matches(/[\W_]/).withMessage('Password must contain a special character'),
];

const handleValidationErrors = (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }
  next();
};

router.post('/signin', validateSignUp, handleValidationErrors, signin);
router.post('/signin/new_token', newToken);
router.post('/signup', validateSignUp, handleValidationErrors, signup);
router.get('/info', checkAccessToken, info);
router.post('/logout', logout);

module.exports = router;
