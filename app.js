require('dotenv').config();

const path = require('path');
const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');
const authRoutes = require('./routes/authRoutes');
const fileRoutes = require('./routes/fileRoutes');

const app = express();
const port = process.env.PORT || 3000;

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Allow-Control-Origin', '*');
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE");
  res.header('Access-Allow-Control-Headers',
    'Origin, X-Requested-With, Authrization, Content-Type, Accept');
  next();
});

app.use('/', authRoutes);
app.use('/file', fileRoutes);

app.get('/main', (req, res, next) => {
  res.sendFile(path.join(__dirname, 'views/index.html'));
})

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});