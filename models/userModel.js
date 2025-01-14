const db = require('../config/db');

const createUser = async (id, hashedPassword) => {
  return await db.execute(
    `INSERT INTO users(id, password) VALUES (?, ?)`,
    [id, hashedPassword]
  );
};

const getUserById = async (id) => {  
  const [rows] = await db.execute(
    `SELECT * FROM users WHERE id = ?`,
    [id]
  );
  console.log('GET USER');
  return rows[0];  
};

module.exports = { createUser, getUserById };