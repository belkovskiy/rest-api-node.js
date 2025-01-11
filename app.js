require('dotenv').config();

const express = require('express');
const bodyParser = require('body-parser');
const cookieParser = require('cookie-parser');
const cors = require('cors');

const app = express();
const port = process.env.PORT;

app.use(express.json());
app.use(bodyParser.json());
app.use(cookieParser());
app.use(cors());
app.use((req, res, next) => {
  res.header('Access-Allow-Control-Origin', '*');
  res.header('Access-Allow-Control-Headers',
    'Origin, X-Requested-With, Authrization, Content-Type, Accept');
  next();
});

app.get('/', (req, res) => {
  res.send('Home Page');
});

app.listen(port, () => {
  console.log(`Server is running at http://localhost:${port}`);
});