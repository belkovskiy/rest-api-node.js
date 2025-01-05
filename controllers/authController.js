const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const { 
  createUser,
  getUserById,
  updateUserToken
 } = require('../models/userModel');

 const ACCESS_TOKEN_SECRET =
  process.env.JWT_ACCESS_SECRET;
 const REFRESH_TOKEN_SECRET =
  process.env.JWT_REFRESH_SECRET;
 const ACCESS_TOKEN_EXPIRATION =
  process.env.JWT_ACCESS_EXPIRATION;

const signin = async (req, res) => {
  const { id, password } = req.body;

  try {
    const user = await getUserById(id);
    if (!user) {
      return res.status(401)
      .json({ message: 'The user does not extsts!' });
    }

    const isPasswordValid =
     await bcrypt.compare(password, user.password_hash);
    if (!isPasswordValid) {
      return res.status(401).json({ message: 'Password is not valid!' });
    }

    const accessToken =
     jwt.sign(
      { id: user.id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRATION }
      );
    const refreshToken =
     jwt.sign(
      { id: user.id },
      REFRESH_TOKEN_SECRET
      );

    await updateUserToken(user.id, refreshToken);

    res.json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500)
    .json({ message: 'Internal Server Error!' });
  }
};

const signup = async (req, res) => {
  const { id, password } = req.body;

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = await createUser(id, hashedPassword);

    const accessToken =
     jwt.sign(
      { id: newUser.id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRATION}
    );
    const refreshToken =
     jwt.sign(
      { id: newUser.id },
      REFRESH_TOKEN_SECRET
    );

    await updateUserToken(id, refreshToken);

    res.status(201).json({ accessToken, refreshToken });
  } catch (error) {
    res.status(500)
    .json({ message: 'InternalServer Error!' });
  }
};

const refreshToken = async (req, res) => {
  const { refreshToken } = req.body;

  if (!refreshToken) {
    return res.status(401)
    .json({ message: 'Refresh token required!' });
  }

  try {
    const decoded = 
    jwt.verify(refreshToken, REFRESH_TOKEN_SECRET);

    const user = await getUserById(decoded.id);

    if (!user || user.refresh_token !== refreshToken) {
      return res.status(403)
      .json({ message: 'Refresh toket is not valid!' });
    }

    const newAccessToken =
     jwt.sign(
      { id: user.id },
      ACCESS_TOKEN_SECRET,
      { expiresIn: ACCESS_TOKEN_EXPIRATION}
    );

    res.json({ accessToken: newAccessToken });
  } catch (error) {
    res.status(403)
    .json({ message: 'Refresh token is not valid!' });
  }
};

const info = (req, res) => {
  res.json({ id: req.user.id});
};

const logout = async (req, res) => {
  try {
    const userId = req.user.id;
    await updateUserToken(userId, null);
    res.json({ message: 'User is logget out successfully!' });
  } catch (error) {
    res.status(500)
    .json({ message: 'Internal Server Error!' });
  }
};

module.exports = { signin, signup, info, refreshToken, logout };
