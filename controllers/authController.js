const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const {
  createUser,
  getUserById,
  createUserToken,
  getUserToken,
  updateUserToken,
  deleteUserToken
} = require('../models/userModel');

const useragent = require('useragent');

const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET;
const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET;
const ACCESS_TOKEN_EXPIRATION =
  process.env.JWT_ACCESS_EXPIRATION;

const signin = async (req, res) => {
  const { id, password } = req.body;

  const agent = useragent.parse(req.headers['user-agent']);
  const deviceInfo =
    `${agent.device}, ${agent.os}, ${agent.toString()}`;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(401)
        .json({ message: 'The user does not extsts!' });
    }

    const isPasswordValid =
      await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is not valid!' });
    }

    const result = await getUserToken(id);
    result.forEach((item) => {
      const userRefreshToken = req.body.refreshToken;      
      if (userRefreshToken == item.refresh_token) {
        throw new Error('User was already logged in!');
      }
    });

    const accessToken =
      jwt.sign(
        { id: user.id },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );
    const refreshToken =
      jwt.sign(
        { id: user.id, date: Date.now() },
        REFRESH_TOKEN_SECRET
      );
    await createUserToken(id, refreshToken, deviceInfo);
    res.json({ accessToken: accessToken, refreshToken: refreshToken });
  } catch (error) {
    res.status(500)
      .json({ message: 'Internal Server Error!', error: error.message });
  }
};

const signup = async (req, res) => {
  const { id, password } = req.body;

  const agent = useragent.parse(req.headers['user-agent']);
  const deviceInfo =
    `${agent.device}, ${agent.os}, ${agent.toString()}`;


  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(id, hashedPassword);

    const accessToken =
      jwt.sign(
        { id: newUser.id },
        ACCESS_TOKEN_SECRET,
        { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );
    const refreshToken =
      jwt.sign(
        { id: newUser.id },
        REFRESH_TOKEN_SECRET
      );

    await createUserToken(id, refreshToken, deviceInfo);

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500)
      .json({ error: error.message, message: 'InternalServer Error!' });
  }
};

const refreshToken = async (req, res) => {
  // const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401)
      .json({ message: 'Refresh token required!' });
  }

  try {
    const decoded =
      jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await getUserById(decoded.id);
    if (!user) {
      return res.status(403).json({ message: 'User does not exists!' });
    }

    const result = await getUserToken(id);

    result.forEach((item) => {
      const userRefreshToken = req.body.refreshToken;
      if (userRefreshToken == item.refresh_token) {        
        const newAccessToken =
          jwt.sign(
            { id: user.id },
            ACCESS_TOKEN_SECRET,
            { expiresIn: ACCESS_TOKEN_EXPIRATION }
          );
        return res.json({ accessToken: newAccessToken });
      } else {
        return res.status(403)
        .json({ message: 'Refresh toket is not valid!' });
      }
    });
  } catch (error) {
    res.status(403)
      .json({ message: 'Refresh token is not valid!' });
  }
};

const info = (req, res) => {
  res.json({ id: req.user.id });
};

const logout = async (req, res) => {  
  const userId = req.user.id;
  const refreshToken = req.body?.refreshToken;  
  try {    
    await deleteUserToken(userId, refreshToken);    
    res.json({ message: 'User is logged out successfully!' });
  } catch (error) {
    res.status(500)
      .json({ message: 'Internal Server Error!', error: error.message });
  }
};

module.exports = { signin, signup, info, refreshToken, logout };
