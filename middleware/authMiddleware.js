const jwt = require('jsonwebtoken');
const JWT_SECRET = process.env.JWT_ACCESS_SECRET;

const checkAccessToken = (req, res, next) => {
  const authHeader = req.header('Authorization');
  console.log(authHeader);

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ error: 'unathorized' });
  }

  const token = authHeader.split(' ')[1];
  console.log(token);

  try {
    
    const decoded = jwt.verify(token, JWT_SECRET);
    
    req.user = decoded;
    console.log(decoded);
    next();
  } catch (error) {
    res.status(401).json({ error: 'Token is not valid!' });
  }
};

module.exports = checkAccessToken;