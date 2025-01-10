require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const useragent = require('useragent');
const logger = require('../utils/logger');

const {
  createUser,
  getUserById
} = require('../models/userModel');

const {
  createSession,
  getSessionsByUserId,
  getSessionByToken,
  deleteSessionByToken
} = require('../models/sessionModel');

const JWT_ACCESS_SECRET =
  process.env.JWT_ACCESS_SECRET;
const JWT_REFRESH_SECRET =
  process.env.JWT_REFRESH_SECRET;
const JWT_ACCESS_EXPIRATION =
  process.env.JWT_ACCESS_EXPIRATION;
const JWT_REFRESH_EXPIRATION =
  process.env.JWT_REFRESH_EXPIRATION;

const getDeviceInfo = (req) => {
  const agent =
    useragent.parse(req.headers['user-agent']);
  return `${agent.device}, ${agent.os}, ${agent.toString()}`;
}

const signup = async (req, res, next) => {
  const { id, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  try {
    await createUser(id, hashedPassword);
    res.status(201)
      .json({ message: 'User registered successfully!' });
  } catch (error) {
    Logger.error('User registration failed!', { error });
    next(error);
  }
};

const signin = async (req, res, next) => {
  const { id, password } = req.body;
  const deviceInfo = getDeviceInfo(req);

  try {
    const user = await getUserById(id);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const sessions = await getSessionsByUserId(user.id);
    if (sessions.length >= 5) {
      sessions.sort((a, b) => a.expires_in - b.expires_in);
      const sessionsToDelete = sessions.slice(0, sessions.length - 4);
      for (const session of sessionsToDelete) {
        await deleteSessionByToken(session.refresh_token);
      }
    }

    const accessToken =
      jwt.sign(
        { userId: user.id },
        JWT_ACCESS_SECRET,
        { expiresIn: JWT_ACCESS_EXPIRATION }
      );

    const refreshToken = jwt.sign(
      { userId: user.id, deviceInfo },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    await createSession(
      user.id,
      refreshToken,
      Date.now() + JWT_REFRESH_EXPIRATION,
      deviceInfo
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: JWT_REFRESH_EXPIRATION,
      path: '/auth'
    });

    res.json({ accessToken });
  } catch (error) {
    logger.error('Signin failed!', { error });
    next(error);
  }
};

const newToken = async (req, res, next) => {
  const { refreshToken } = req.cookies;
  const deviceInfo = getDeviceInfo(req);

  try {
    const session = await getSessionByToken(refreshToken, deviceInfo);

  if (!session || session.expires_in < Date.now()) {
    const error = new Error('Invalid or expired refresh token!');
    error.status = 401;
    throw error;
  }

  const accessToken = jwt.sign(
    { userId: session.user_id },
    JWT_ACCESS_SECRET,
    { expiresIn: JWT_ACCESS_EXPIRATION }
  );

  res.json({ accessToken });
  } catch (error) {
    logger.error('Refresh the access token failed!');
    next(error);
  }
};

const info = async (req, res) => {
  const { userId } = req.user.id;  
  res.json({ userId });
};

const logout = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  try {
    await deleteSessionByToken(refreshToken);
    res.clearCookie('refreshToken', { path: '/auth'});
    res.json({ message: 'Logged out successfully! '});
  } catch (error) {
    logger.error('Logout failed!', { error });
    next(error);
  }
};

module.exports = {
  signup,
  signin,
  newToken,
  info,
  logout
};
