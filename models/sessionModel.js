const db = require('../config/db');

const createSession = async (
  userId,
  refreshToken,  
  deviceInfo
) => {
  return await db.execute(
    `INSERT INTO sessions (
    user_id, refresh_token, device_info
    ) VALUES (?, ?, ?)`,
    [userId, refreshToken, deviceInfo]
  );
};

const getSessionsByUserId = async (userId, userDeviceInfo) => {
  const rows = await db.execute(
    `SELECT * FROM sessions WHERE user_id = ? AND device_info = ?`, [userId, userDeviceInfo]
  );
  return rows;
};

const getSessionByToken = async (
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
  return await db.execute(
    `DELETE FROM sessions WHERE refresh_token = ?`,
    [refreshToken]
  );
};

module.exports = {
  createSession,
  getSessionsByUserId,
  getSessionByToken,
  deleteSessionByToken
};
