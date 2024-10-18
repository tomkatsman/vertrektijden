const wrapper = document.querySelector("#wrapper");
const limit = 8;
const base_url = window.location.hostname == "localhost" ? "http://localhost:3000" : "https://get-ret-times.onrender.com";

const now = new Date();
const is_afternoon = now.getHours() > 13;

const halte = "metrostation-marconiplein";
let perron = is_afternoon ? 1 : 2;
const looptijden = {
	"metrostation-marconiplein": 3,
}

// document.querySelector("#dropdown-perron").value = perron;

// document.querySelector("#dropdown-perron").addEventListener("change", function () {
// 	perron = this.value;
// 	populateDepartures();
// })

document.querySelector(`#btn-${perron === 1 ? 'westwaards' : 'oostwaards'}`).classList.add('active');

document.querySelectorAll('button').forEach(button => {
	button.addEventListener("click", function () {
		perron = this.dataset.perron; // Haal de waarde van de data-perron attribute
		// Verwijder de actieve klasse van alle knoppen
		document.querySelectorAll('button').forEach(btn => btn.classList.remove('active'));
		// Voeg de actieve klasse toe aan de ingedrukte knop
		this.classList.add('active');
		populateDepartures();
	});
});

populateDepartures();

function populateDepartures() {
	fetch(`${base_url}/getTimes/${halte}/${perron}`)
		.then((response) => response.json())
		.then((tijden) => {
			const nu = new Date();
			const vandaag = {
				dag: nu.getDate(),
				maand: (nu.getMonth() + 1),
				jaar: nu.getFullYear()
			}

			if (vandaag.maand.length == 1) {
				vandaag.maand = "0" + vandaag.maand;
			}

			wrapper.querySelector("main").innerHTML = "";
			tijden.forEach((t, i) => {
				if (i >= limit) return;
				const time = t.new_time || t.normal_time;
				const parsed_time = Date.parse(`${vandaag.jaar}-${vandaag.maand}-${vandaag.dag}T${time}:00`);
				const ETA = (parsed_time - nu) / 1000 / 60;
				const looptijd = looptijden[halte];
				const metro = t.metro;
				const richting = t.richting;

				const $el = document.createElement("div");
				const $metroRichting = document.createElement("div"); // Nieuwe div voor metro en richting

				const $metro = document.createElement("span"); // Gebruik span in plaats van div
				const $richting = document.createElement("span"); // Gebruik span in plaats van div
				const $tijd = document.createElement("div");
				const $eta = document.createElement("div");
				const $categorie = document.createElement("div");

				const category = getCategoryText(ETA, looptijd);

				$el.classList.add("departure");
				$el.classList.add(category.status);

				$metro.innerText = metro;
				// $metro.classList.add("metro");

				// Voeg de juiste klasse toe op basis van de waarde van metro
				if (metro === 'A') {
					$metro.classList.add('metro-a');
				} else if (metro === 'B') {
					$metro.classList.add('metro-b');
				} else if (metro === 'C') {
					$metro.classList.add('metro-c');
				}

				$richting.innerText = richting;
				$richting.classList.add("richting");

				$tijd.innerText = time;
				$tijd.classList.add("vertrektijd");

				$eta.innerText = Math.round(ETA) + " min.";
				$eta.classList.add("eta");

				$categorie.innerText = category.text;
				$categorie.classList.add("categorie");

				// Voeg metro en richting toe aan de nieuwe div
				$metroRichting.appendChild($metro);
				$metroRichting.appendChild($richting);
				$metroRichting.classList.add("metro-richting"); // Geef de nieuwe div een class

				$el.appendChild($eta);
				$el.appendChild($tijd);
				$el.appendChild($metroRichting); // Voeg de nieuwe div toe aan $el
				$el.appendChild($categorie);

				wrapper.querySelector("main").appendChild($el);
			});

		})
		.catch(err => {
			console.log(err);
		})
}



function getCategoryText(eta, distance) {
	if (eta - distance < 0) return { status: "bad", text: "Ga je niet halen" };
	else if (eta - distance === 0) return { status: "bad", text: "Als je rent" };
	else if (eta - distance > 0 && eta - distance < 3) return { status: "good", text: "Goede tijd. 1-3 minuten wachten" };
	else if (eta - distance > 3 && eta - distance < 5) return { status: "okay", text: "Rustig aan. 3-5 minuten wachten" };
	else return { status: "bad", text: `> ${Math.round(eta - distance)} minuten wachten` };
}