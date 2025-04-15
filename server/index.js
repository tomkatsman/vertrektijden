const express = require('express');
const cors = require('cors');
const fetchDepartures = require('./fetchApi');

const app = express();
const port = 3000;

const allowed_origins = [
  'http://localhost',
  'http://homeassistant.local:8080',
  'https://vertrektijden.tomkatsman.nl',
  null
];

app.use(cors({
  origin: function (origin, callback) {
    console.log('CORS origin:', origin);
    if (!origin || allowed_origins.includes(origin)) {
      return callback(null, true);
    }
    return callback(new Error('Not allowed by CORS'), false);
  }
}));


app.get('/getTimes', async (req, res) => {
  try {
    const data = await fetchDepartures();
    res.json(data);
  } catch (err) {
    console.error('Scraping error:', err);
    res.status(500).json({ error: 'Scraping failed', details: err.message });
  }
});

app.listen(port, () => {
  console.log(`✅ Server draait op http://localhost:${port}/getTimes`);
});
