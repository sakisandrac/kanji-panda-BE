const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3003;
const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
app.locals = { title: 'Kanji Panda API' }
require('dotenv').config();

//MIDDLEWARE
app.use(cors());
app.use(express.json());