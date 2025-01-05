const express = require('express');
const { 
  signin, 
  signup,
  refreshToken,
  info,
  logout
 } = require('../controllers/authController');

 const router = express.Router();

 router.post('/signin', signin);
 router.post('signin/new_token', refreshToken);
 router.post('signup', signup);
 router.get('info', info);
 router.get('logout', logout);

 module.exports = router;