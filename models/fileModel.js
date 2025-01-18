const db = require('../config/db');

const createFile = async (
  name,
  extension,
  mimeType,
  size,
  uploadDate,
  userId
) => {
  await db.execute(
    `INSERT INTO files (
    name,
    extension,
    mime_type,
    size,
    upload_date,
    user_id
    ) VALUES (?, ?, ?, ?, ?, ?)`, [
    name,
    extension,
    mimeType,
    size,
    uploadDate,
    userId
  ]
  );
};

const getFileById = async (id, userId) => {
  const [rows] = await db.execute(
    `SELECT * FROM files WHERE id = ? AND user_id = ?`,
    [id, userId]
  );
  return rows[0];
};

const getlistFiles = async (userId, limit, offset) => {  
  const [rows] = await db.query(
    `SELECT * FROM files WHERE user_id = ? LIMIT ? OFFSET ?`,
    [userId, limit, offset]
  );
  return rows;
};

const deleteFileById = async (id) => {
  await db.execute(
    `DELETE FROM files WHERE id = ?`, [id]
  );
};

const updateFileById = async (
  id,
  name,
  extension,
  mimeType,
  size,
  uploadDate
) => {
  await db.execute(
    `UPDATE files SET 
    name = ?,
    extension = ?,
    mime_type = ?,
    size = ?,
    upload_date = ? WHERE id = ?`, [
    name,
    extension,
    mimeType,
    size,
    uploadDate,
    id
  ]);
};

module.exports = {
  createFile,
  getFileById,
  getlistFiles,
  deleteFileById,
  updateFileById
};

