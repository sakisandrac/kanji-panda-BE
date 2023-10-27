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

//MIDDLEWARE
app.use(cors());
app.use(express.json());

//GET ENDPOINTS
app.get('/api/v1/kanji/:user_id/', async (req, res) => {
    const { user_id } = req.params;

    try {
      const savedKtoU = await database('kanji_to_user').select().where('user_id', user_id);

      const savedKanji = await database('kanji').returning('*')

      const userKanji = savedKanji.reduce((foundK, kanji) => {
        savedKtoU.forEach(k => {
            if(k.k_id === kanji.k_id) {
                foundK.push(kanji)
            }
        })
        return foundK;
      }, [])
    //   console.log(userKanji)
      res.status(200).json({ data: userKanji });
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

//use when user clickes save or unsave kanji button
app.post('/api/v1/kanji/', async (req, res) => {
    const { user_id, k_id, k_utf, meaning, onyomi, kunyomi } = req.body;
    const id = uuidv4();

    try {
        const kanjiExsists = await database('kanji').select().where('k_id', k_id);
        console.log('kanjiexsists', kanjiExsists)
        if (!kanjiExsists.length) {
            await database('kanji').insert({
                k_id, 
                k_utf,
                meaning,
                onyomi, 
                kunyomi
            })
        }
    
        const kanjiAlreadySaved = await database('kanji_to_user').select().where('k_id', k_id).where('user_id', user_id);

        if(!kanjiAlreadySaved.length) {
            await database('kanji_to_user').insert({
                id,
                user_id,
                k_id, 
                studied: false
            })
            res.status(201).json({ message: `${k_utf} saved` })
        } else {
            await database('kanji_to_user').where('k_id', k_id).where('user_id', user_id).del();
            res.status(202).json({ message: `${k_utf} unsaved` })
        }
    } catch (error) {
        res.status(500).json({ error })
    }
})

//ENDPOINTS NEEDED:
//post- save kanji
//patch- toggle studied and not studied 
//get- all saved kanji

app.listen(port, () => {
    console.log(`${app.locals.title} is now running on http://localhost:${port} !`)
  });