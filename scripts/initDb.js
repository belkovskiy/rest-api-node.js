const db = require('../config/db');
const logger = require('../utils/logger');

const createTables = async () => {
  try {
    await db.execute(`
      CREATE TABLE IF NOT EXISTS users (
        id VARCHAR(255) PRIMARY KEY,
        password VARCHAR(255) NOT NULL
      )      
    `);

    await db.execute(`
        CREATE TABLE IF NOT EXISTS sessions (
          id INT AUTO_INCREMENT PRIMARY KEY,
          user_id VARCHAR(255),
          refresh_token VARCHAR(255),
          expires_in BIGINT,
          device_info VARCHAR(255),
          FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
        )
      `);

    await db.execute(`
      CREATE TABLE IF NOT EXISTS files (
        id INT AUTO_INCREMENT PRIMARY KEY,
        name VARCHAR(255) NOT NULL,
        extension VARCHAR(10) NOT NULL,
        mime_type VARCHAR(100) NOT NULL,
        size INT NOT NULL,
        upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
      )      
    `);

    logger.info(
      'Databases created or verified successfully!'
    );

  } catch (error) {
    logger.error(
      'Error creating database tables!', { error }
    );
    process.exit(1);
  }
};

createTables().then(() => process.exit(0));
