const mysql = require('mysql2/promise');
const { refreshToken } = require('../controllers/authController');
const { use } = require('../routes/authRoutes');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME
});

const getUserById = async (id) => {
  try {
    const [rows] = await pool.query(
      'SELECT * FROM users WHERE id = ?',
      [id]
    );
    return rows[0];
  } catch (error) {
    console.error(
      'Error fetching user by ID: ',
      error
    );
    throw error;
  }
};

const createUser = async (id, passwordHash) => {
  try {
    const [result] =
     await pool.query(
      'INSERT INTO users ( id, password ) VALUES (?, ?)',
      [id, passwordHash]
    );      
    return { id: result.insertId, id: id};
  } catch (error) {
    console.error('Error creating user: ', error);
    throw error;
  }
};

const createUserToken = async (userId, refreshToken, deviceInfo) => {
  try {
    const [result] = 
      await pool.query(
        'INSERT INTO tokens ( user_id, refresh_token, device_info ) VALUES (?, ?, ?)',
         [userId, refreshToken, deviceInfo]
        );
    return { userId: result.insertId.userId, userId: userId };
  } catch (error) {
    console.error('Error creating user token: ', error);
    throw error;
  }
};

const getUserToken = async (userId) => {
  try {
    const [result] =
     await pool.query('SELECT * FROM tokens WHERE user_id = ?', [userId]);
    return result;
  } catch (error) {
    console.error('Error get user token! ', error);
  }
}

const deleteUserToken = async (userId, refreshToken) => {
  try {    
    await pool.query('DELETE FROM tokens WHERE user_id = ? AND refresh_token = ?', [userId, refreshToken]);
  } catch (error) {
    console.error('Error delete user token: ', error);
    throw error;
  }
}

const updateUserToken = async (id, refreshToken) => {
  try {
    await pool.query('UPDATE tokens SET refresh_token = ? WHERE user_id = ?', [refreshToken, id]);    
  } catch (error) {
    console.error('Error updating user token: ', error);
    throw error;
  }
};

module.exports = {
  createUser,
  getUserById,
  createUserToken,
  getUserToken,
  updateUserToken,
  deleteUserToken };