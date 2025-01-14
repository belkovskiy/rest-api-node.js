require('dotenv').config();
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const useragent = require('useragent');
const logger = require('../utils/logger');

const path = require('path');

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

    res.json({ accessToken, message: 'User registered successfully!' });
  } catch (error) {
    logger.error('User registration failed!', { error });
    next(error);
  }
};

const signin = async (req, res, next) => {
  const { id, password } = req.body;
  const deviceInfo =
    `${req.socket.remoteAddress}, ${getDeviceInfo(req)}`;
  console.log(deviceInfo);

  try {
    const user = await getUserById(id);
    console.log(user);
    if (!user || !(await bcrypt.compare(password, user.password))) {
      const error = new Error('Invalid credentials');
      error.status = 401;
      throw error;
    }

    console.log(id);
    const userSessions = await getSessionsByUserId(id, deviceInfo);
    console.log(userSessions[0]);
    if (userSessions[0]?.length >= 1) {
      for (const session of userSessions[0]) {
        console.log(session?.device_info);
        if (session.device_info == deviceInfo) {
          console.log('!!!User was already logged in!');
          throw new Error('User was already logged in!');
        }
      }
    }
    // const sessions = await getSessionsByUserId(user.id);
    // if (sessions.length >= 2) {
    //   sessions.sort((a, b) => a.expires_in - b.expires_in);
    //   const sessionsToDelete = sessions.slice(0, sessions.length - 4);
    //   for (const session of sessionsToDelete) {
    //     await deleteSessionByToken(session.refresh_token);
    //   }
    // }

    const accessToken = jwt.sign(
      { userId: user.id },
      JWT_ACCESS_SECRET,
      { expiresIn: JWT_ACCESS_EXPIRATION }
    );

    const refreshToken = jwt.sign(
      { id: user.id },
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
  // const deviceInfo =
  //   `${req.socket.remoteAddress}, ${getDeviceInfo(req)}`;

  try {
    console.log("Try to get a New Token!");
    jwt.verify(refreshToken, JWT_REFRESH_SECRET, async (error, decoded) => {
      if (error) {
        if (error.name == 'TokenExpiredError') {
          console.log('Token', error.message + '!');
          await deleteSessionByToken(refreshToken);
          logger.error('Refresh token jwt was expired!');
          res.status(401).json({ error: 'Refresh token jwt was expired!' });
          next(error);
        } else {
          console.log('Json Web Token Error: ' + error.message + '!');
          logger.error('Json Web Token Error: invalid signature');
          res.status(401).json({ error: 'Json Web Token Error: invalid signature' });
          next(error);

        }
      } else {
        console.log(decoded);
        const userId = decoded.id;
        console.log("Setting a new Access Token!");
        const accessToken = jwt.sign(
          { userId: userId },
          JWT_ACCESS_SECRET,
          { expiresIn: JWT_ACCESS_EXPIRATION }
        );
    
        res.json({ accessToken, userId });
      }
    });
    // const session = await getSessionByToken(refreshToken, deviceInfo);

    // if (!session || session.expires_in < Date.now()) {
    //   const error = new Error('Invalid or expired refresh token!');
    //   error.status = 401;
    //   throw error;
    // }

    
  } catch (error) {
    logger.error('Refresh the access token failed!');
    next(error);
  }
};

const info = async (req, res) => {
  console.log('INFO!');
  const { userId } = req.user;
  res.json({ id: userId });
};

const logout = async (req, res, next) => {
  const { refreshToken } = req.cookies;

  try {
    // jwt.verify(refreshToken, JWT_REFRESH_SECRET, (err, decoded) => {
    //   if (err) {
    //     if (err.name == 'TokenExpiredError') {
    //       console.log('Token', err.message + '!');

    //     } else {
    //       console.log('Json Web Token Error: ' + err.message + '!');
    //     }
    //   } else {
    //     console.log(decoded);
    //   }
    // });

    await deleteSessionByToken(refreshToken);
    res.clearCookie('refreshToken', { path: '/' });
    res.json({ accessToken: '', message: 'Logged out successfully! ' });
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
