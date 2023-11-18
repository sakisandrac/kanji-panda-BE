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

const knex = require('knex');
const knexConfig = require('./knexfile');

//MIDDLEWARE
app.use(cors());
app.use(express.json());
const knexInstance = knex(knexConfig[environment]);

async function runMigrations() {
    try {
      await knexInstance.migrate.latest({
        directory: './db/migrations',
      });
      console.log('Migrations have run successfully!');
      process.exit(0);
    } catch (error) {
      console.error('Error running migrations:', error);
      process.exit(1);
    }
  }
  
  runMigrations();

//GET ENDPOINTS

app.get('/api/v1/user', async (req, res) => {
    console.log('hello')
    try {
        const user = await database('user_user').returning('*')
        res.status(200).json({ data: user});
    } catch (error) {
        res.status(500).json({ error })
    }
})

app.get('/api/v1/kanji/:user_id/', async (req, res) => {
    const { user_id } = req.params;

    try {
        const savedKtoU = await database('kanji_to_user').select().where('user_id', user_id);

        const savedKanji = await database('kanji').returning('*')

        const userKanji = savedKanji.reduce((foundK, kanji) => {
            savedKtoU.forEach(k => {
                if (k.k_id === kanji.k_id) {
                    foundK.push({
                        ...kanji,
                        studied: k.studied,
                    })
                }
            })
            return foundK;
        }, [])

        res.status(200).json({ data: userKanji });
    } catch (error) {
        res.status(500).json({ error })
    }
});

//POST ENDPOINTS
app.post('/api/v1/user/', async (req, res) => {
    console.log(req)
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

        if (!kanjiAlreadySaved.length) {
            await database('kanji_to_user').insert({
                id,
                user_id,
                k_id,
                studied: false
            })

            const savedKtoU = await database('kanji_to_user').select().where('user_id', user_id);

            const savedKanji = await database('kanji').returning('*')

            const userKanji = savedKanji.reduce((foundK, kanji) => {
                savedKtoU.forEach(k => {
                    if (k.k_id === kanji.k_id) {
                        foundK.push({
                            ...kanji,
                            studied: k.studied,
                        })
                    }
                })
                return foundK;
            }, [])

            res.status(201).json({ data: userKanji });
        } else {
            await database('kanji_to_user').where('k_id', k_id).where('user_id', user_id).del();

            const savedKtoU = await database('kanji_to_user').select().where('user_id', user_id);

            const savedKanji = await database('kanji').returning('*')

            const userKanji = savedKanji.reduce((foundK, kanji) => {
                savedKtoU.forEach(k => {
                    if (k.k_id === kanji.k_id) {
                        foundK.push({
                            ...kanji,
                            studied: k.studied,
                        })
                    }
                })
                return foundK;
            }, [])

            res.status(202).json({ data: userKanji })
        }
    } catch (error) {
        res.status(500).json({ error })
    }
})

//PATCH ENDPOINTS
// use when user toggles "studied" button on and off

app.patch('/api/v1/kanji/', async (req, res) => {
    const { user_id, k_id } = req.body;

    try {
        const foundK = await database('kanji_to_user').select().where('user_id', user_id).where('k_id', k_id).first();

        if (foundK) {
            const flippedValue = !foundK.studied
            const updatedK = await database('kanji_to_user').select().where('user_id', user_id).where('k_id', k_id).update('studied', flippedValue).returning('*')

            const savedKtoU = await database('kanji_to_user').select().where('user_id', user_id);

            const savedKanji = await database('kanji').returning('*')

            const userKanji = savedKanji.reduce((foundK, kanji) => {
                savedKtoU.forEach(k => {
                    if (k.k_id === kanji.k_id) {
                        foundK.push({
                            ...kanji,
                            studied: k.studied,
                        })
                    }
                })
                return foundK;
            }, [])

            res.status(200).json({ data: userKanji });
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