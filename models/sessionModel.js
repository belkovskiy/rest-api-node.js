const db = require('../config/db');

const createSession = async (
  userId,
  refreshToken,
  exppiresIn,
  deviceInfo
) => {
  return db.execute(
    `INSERT INTO sessions (
    user_id, refresh_token, expires_in, device_info
    ) VALUES (?, ?, ?, ?)`,
    [userId, refreshToken, expiresIn, deviceInfo]
  );
};

const findSessionsByUserId = async (userId) => {
  const rows = await db.execute(
    `SELECT * FROM sessions WHERE user_id = ?`, [userId]
  );
  return rows;
};

const findSessionByToken = async (
  refreshToken,
  deviceInfo
) => {
  const [rows] = await db.execute(
    `SELECT * FROM sessions WHERE refresh_token = ? AND device_info = ?`,
    [refreshToken, deviceInfo]
  );
  return rows[0];
};

const deleteSessionByToken = async (refreshToken) => {
  return db.execute(
    `DELETE FROM sessions WHERE refresh_token = ?`,
    [refreshToken]
  );
};

module.exports = {
  createSession,
  findSessionsByUserId,
  findSessionByToken,
  deleteSessionByToken
};
