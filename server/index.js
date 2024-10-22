const axios = require('axios');
const cheerio = require('cheerio');

const express = require("express");
const cors = require("cors");

var app = express();
app.use(cors());
app.options('*', cors());

const port = process.env.PORT || 3000;

var allowed_origins = ['http://localhost', 'http://homeassistant.local'];

app.listen(port, () => console.log("Server running on port " + port));

app.use(cors({
	origin: function (origin, callback) {
		console.log({ origin });
		if (!origin) return callback(null, true);

		if (allowed_origins.indexOf(origin) === -1) {
			var msg = 'The CORS policy for this site does not allow access from the specified Origin: ' + origin;
			return callback(new Error(msg), false);
		}
		return callback(null, true);
	}
}));

app.get("/getTimes/:halte/:perron", (req, res) => {
	var halte = req.params.halte;
	var perron = req.params.perron || 1;
	if (!halte || !perron) res.send("Please provide a halte and perron")
	console.log("New request for:", halte, perron);

	axios("https://9292.nl/rotterdam/" + halte)
		.then((response, i) => {
			const $ = cheerio.load(response.data);
			const departures = $(".departures table tbody tr").filter((i, d) => {
				const departure_perron = $(d).find("td[data-label='Perron'] span").text().trim();
				return departure_perron === "Perron " + perron;
			})
			const formatted_departures = [];
			$(departures).each((i, d) => {
				const $metro = $(d).find("td[data-label='Richting'] strong").text().trim();
				// const $metroLetter = $metro.split(" ")[1]; // Dit pakt het tweede deel (de letter)
				const $richting = $(d).find("td[data-label='Richting'] span").text().trim();
				// console.log($metro, $richting);
				const $time = $(d).find("td[data-label='Tijd']");
				const $former_time = $time.find("del");
				const $new_time = $time.find(".orangetxt");

				const former_time = $former_time.length ? $former_time.text().trim() : null;
				const new_time = $new_time.length ? $new_time.text().trim() : null;
				const normal_time = former_time || new_time ? null : $time.text().trim();
				const metro = $metro.split(" ")[1]; // Dit pakt het tweede deel (de letter)
				const richting = " " + $richting;

				formatted_departures.push({ normal_time, former_time, new_time, metro, richting });
			})

			// console.log(formatted_departures);
			res.send(formatted_departures)
		})
		.catch(err => {
			res.send(err);
		})
});
