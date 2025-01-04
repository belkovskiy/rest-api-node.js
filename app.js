require('dotenv').config();

const express = require('express');
const mysql = require('mysql2');

const app = express();
const port = process.env.PORT;

const connection = mysql.createConnection({
  host: process.env.DB_HOST,
  database: process.env.DB_NAME,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD
});

connection.connect((err) => {
  if (err) {
    console.error('Error connecting to MySQL ' + err.stack);
    return;
  }
  console.log('Connect to MySQL Successfully! ' + connection.threadId);
});

const createTables = () => {
  const createUsersTable = `
    CREATE TABLE IF NOT EXISTS users(
      id VARCHAR(255) PRIMARY KEY,
      password VARCHAR(255) NOT NULL
      )
  `;

  const createFilesTable = `
    CREATE TABLE IF NOT EXISTS files(
      id INT AUTO_INCREMENT PRIMARY KEY,
      name VARCHAR(255) NOT NULL,
      extension VARCHAR(10) NOT NULL,
      mime_type VARCHAR(100) NOT NULL,
      size INT NOT NULL,
      upload_date DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `;

  connection.query(createUsersTable, (err, results) => {
    if (err) {
      console.error('Error creating table users: ' + err.message);
    } else {
      console.log('The table users was created successfully or already exsits!');
    }
  });

  connection.query(createFilesTable, (err, results) => {
    if (err) {
      console.error('Error creating table files: ' + err.message);
    } else {
      console.log('The table files was created successfully or already exists!');
    }
  });
};

createTables();


app.get('/', (req, res) => {
  res.send('Server is running!');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});