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
const COOKIES_MAX_AGE =
  process.env.COOKIES_MAX_AGE;
const SESSION_EXPIRATION =
  process.env.SESSION_EXPIRATION;

const getDeviceInfo = (req) => {
  const agent =
    useragent.parse(req.headers['user-agent']);
  return `${agent.device}, ${agent.os}, ${agent.toString()}`;
}

const signup = async (req, res, next) => {
  const { id, password } = req.body;
  const hashedPassword = await bcrypt.hash(password, 10);
  const deviceInfo =
    `${req.socket.remoteAddress}, ${getDeviceInfo(req)}`;

  try {
    await createUser(id, hashedPassword);

    const accessToken = jwt.sign(
      { userId: id },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRATION }
    );
    const refreshToken = jwt.sign(
      { userId: id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    await createSession(
      id,
      refreshToken,
      Date.now() + SESSION_EXPIRATION,
      deviceInfo
    );

    res.cookie(
      'refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: COOKIES_MAX_AGE,
      path: '/',
    }
    );
    
    res.json({
      accessToken,
      message: 'User registered successfully!'
    });
  } catch (error) {
    logger.error({ error });
    if (error.code == 'ER_DUP_ENTRY') {
      error =
        'Registration failed! User with the same ID already exists!';
    } else {
      error = 'Internal Server Error';
    }
    next(error);
  }
};

const signin = async (req, res, next) => {
  const { id, password } = req.body;
  const deviceInfo =
    `${req.socket.remoteAddress}, ${getDeviceInfo(req)}`;

  try {
    const user = await getUserById(id);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    const userSessions = await getSessionsByUserId(id, deviceInfo);
    if (userSessions[0]?.length >= 1) {
      for (const session of userSessions[0]) {
        if (session.device_info == deviceInfo) {
          if (session?.refresh_token) {
            await deleteSessionByToken(session.refresh_token);
          }
        }
      }
    }

    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { userId: user.id },
      JWT_REFRESH_SECRET,
      { expiresIn: JWT_REFRESH_EXPIRATION }
    );

    await createSession(
      user.id,
      refreshToken,
      Date.now() + SESSION_EXPIRATION,
      deviceInfo
    );

    res.cookie('refreshToken', refreshToken, {
      httpOnly: true,
      maxAge: COOKIES_MAX_AGE,
      path: '/',
    });

    res.json({ accessToken });
  } catch (error) {
    logger.error('Signin failed!', { error });
    next(error);
  }
};

const newToken = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  try {
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (error, decoded) => {
      if (error) {
        if (error.name == 'TokenExpiredError') {
          await deleteSessionByToken(refreshToken);
          logger.error('Refresh token jwt was expired!');
          res.status(401)
            .json({
              error: 'Refresh token jwt was expired!'
            });
          next(error);
        } else {
          logger.error(
            'Json Web Token Error: invalid signature'
          );
          res.status(401)
            .json({
              error: 'Json Web Token Error: invalid signature'
            });
          next(error);
        }
      } else {
        const userId = decoded.userId;
        const accessToken = jwt.sign(
          { userId: userId },
          JWT_ACCESS_SECRET,
          { expiresIn: JWT_ACCESS_EXPIRATION }
        );
        res.json({ accessToken, id: userId });
      }
    });
  } catch (error) {
    logger.error(
      'Refresh the access token failed!'
    );
    next(error);
  }
};

const info = async (req, res) => {
  const { userId } = req.user;
  res.json({ id: userId });
};

const logout = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  try {
    jwt.verify(
      refreshToken,
      JWT_REFRESH_SECRET,
      async (error, decoded) => {
        if (error) {
          if (error.name == 'TokenExpiredError') {
            await deleteSessionByToken(refreshToken);
            logger.error(
              'Refresh token jwt was expired!'
            );
            res.clearCookie('refreshToken', { path: '/' });
            res.status(401)
              .json({
                error: 'Refresh token jwt was expired! ',
                message: 'Logged out successfully!'
              });
            next(error);
          } else {
            logger.error(
              'Json Web Token Error: invalid signature'
            );
            res.clearCookie('refreshToken', { path: '/' });
            res.status(401)
              .json({
                error: 'Json Web Token Error: invalid signature',
                message: 'Logout failed!'
              });
            next(error);
          }
        } else {
          await deleteSessionByToken(refreshToken);
          res.clearCookie('refreshToken', { path: '/' });
          res.json({
            accessToken: '',
            message: 'Logged out successfully! '
          });
        }
      });
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
