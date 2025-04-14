const puppeteer = require('puppeteer');
const express = require("express");
const cors = require("cors");

var app = express();
app.use(cors());
app.options('*', cors());

const port = process.env.PORT || 3000;

var allowed_origins = ['http://localhost', 'http://homeassistant.local:8080', 'https://vertrektijden.tomkatsman.nl'];

app.listen(port, () => console.log("Server running on port " + port));

app.use(cors({
    origin: function (origin, callback) {
        console.log({ origin });
        // Sta verzoeken zonder origin (zoals van file://) toe
        if (!origin || allowed_origins.indexOf(origin) !== -1) {
            return callback(null, true);
        }

        // Blokkeer ongeautoriseerde origins
        var msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
        return callback(new Error(msg), false);
    }
}));

app.get("/getTimes", async (req, res) => {
    console.log("New request for departures");

    try {
        // Start Puppeteer
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        // Navigeer naar de juiste pagina van 9292
        await page.goto('https://9292.nl/locaties/rotterdam_metrostation-marconiplein/departures?modalityGroup=Subway', {
            waitUntil: 'networkidle0',
        });

        // Wacht tot de relevante elementen zijn geladen
        await page.waitForSelector('.departures table tbody');

        // Scrape de data
        const departures = await page.evaluate(() => {
            const rows = document.querySelectorAll('.departures table tbody tr');
            return Array.from(rows).map(row => {
                const metro = row.querySelector("td[data-label='Richting'] strong")?.textContent?.trim() || '';
                const richting = row.querySelector("td[data-label='Richting'] span")?.textContent?.trim() || '';
                const timeElement = row.querySelector("td[data-label='Tijd']");
                const former_time = timeElement.querySelector("del")?.textContent?.trim() || null;
                const new_time = timeElement.querySelector(".orangetxt")?.textContent?.trim() || null;
                const normal_time = !former_time && !new_time ? timeElement.textContent.trim() : null;

                return { normal_time, former_time, new_time, metro, richting };
            }).filter(Boolean); // Verwijder null-waarden
        });

        // Sluit de browser
        await browser.close();

        // Stuur de gescrapete data terug als JSON
        res.json(departures);
    } catch (err) {
        console.error("Error during scraping:", err);
        res.status(500).send({ error: "Failed to fetch data from 9292" });
    }
});
