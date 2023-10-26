const express = require('express');
const cors = require('cors');
const port = process.env.PORT || 3003;
const app = express();
const environment = process.env.NODE_ENV || 'development';
const configuration = require('./knexfile')[environment];
const database = require('knex')(configuration);
app.locals = { title: 'Kanji Panda API' }
require('dotenv').config();
const { v4: uuidv4 } = require('uuid');
const { user } = require('pg/lib/defaults');

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//GET ENDPOINTS
// GET ENDPOINTS
app.get('/api/v1/user/', async (req, res) => {
    try {
      console.log('hello')
      res.status(200).json("hello");
    } catch (error) {
      res.status(500).json({ error })
    }
  });

//POST ENDPOINTS
app.post('/api/v1/user/', async (req, res) => {
    const { name, auth_id, email } = req.body;
    try {
        const userExists = await database('user_user').select().where('auth_id', auth_id);
        if (!userExists.length) {
            const id = uuidv4()
            await database('user_user').insert({
                user_id: id,
                name,
                auth_id,
                email
            })

            res.status(201).json({
                message: `User ${id} added!`,
                data: {
                    user_id: id,
                    name,
                    auth_id,
                    email
                }
              });
        } else {
            res.status(200).json({
                message: `User ${auth_id} found:`,
                data: {
                    user_id: userExists[0].user_id,
                    name,
                    auth_id,
                    email
                }
              });
        }

    } catch (error) {
        res.status(500).json({ error })
    }
})

app.listen(port, () => {
    console.log(`${app.locals.title} is now running on http://localhost:${port} !`)
  });