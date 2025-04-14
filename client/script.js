const wrapper = document.querySelector("#wrapper");
const limit = 8;
const base_url = "http://localhost:3000";

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
	console.log("populateDepartures wordt aangeroepen"); // Debug-log
    fetch(`${base_url}/getTimes`)
        .then((response) => response.json())
        .then((tijden) => {
            console.log("Ontvangen tijden:", tijden);
            const nu = new Date();
            const vandaag = {
                dag: nu.getDate().toString().padStart(2, "0"),
                maand: (nu.getMonth() + 1).toString().padStart(2, "0"),
                jaar: nu.getFullYear()
            };

            wrapper.querySelector("main").innerHTML = "";
            tijden.forEach((t, i) => {
                if (i >= limit) return;

                const time = t.new_time || t.normal_time;
                if (!time) {
                    console.warn("Tijd ontbreekt voor item:", t);
                    return;
                }

                const parsed_time = Date.parse(`${vandaag.jaar}-${vandaag.maand}-${vandaag.dag}T${time}:00`);
                const ETA = (parsed_time - nu) / 1000 / 60;

                if (isNaN(parsed_time)) {
                    console.warn("Kon tijd niet parsen:", time);
                    return;
                }

                const looptijd = looptijden[halte] || 0;
                const category = getCategoryText(ETA, looptijd);

                const $el = document.createElement("div");
                $el.classList.add("departure", category.status);

                const $metroRichting = document.createElement("div");
                const $metro = document.createElement("span");
                const $richting = document.createElement("span");
                const $tijd = document.createElement("div");
                const $eta = document.createElement("div");
                const $categorie = document.createElement("div");

                $metro.innerText = t.metro || "Onbekend";
                $metro.classList.add(`metro-${t.metro?.toLowerCase() || "unknown"}`);
                $richting.innerText = t.richting || "Onbekend";
                $tijd.innerText = time;
                $eta.innerText = isNaN(ETA) ? "Onbekend" : `${Math.round(ETA)} min.`;
                $categorie.innerText = category.text;

                $metroRichting.appendChild($metro);
                $metroRichting.appendChild($richting);
                $metroRichting.classList.add("metro-richting");

                $el.appendChild($eta);
                $el.appendChild($tijd);
                $el.appendChild($metroRichting);
                $el.appendChild($categorie);

                wrapper.querySelector("main").appendChild($el);
            });
        })
        .catch(err => {
            console.error("Fout bij ophalen of verwerken van tijden:", err);
        });
}

function getCategoryText(eta, distance) {
	if (eta - distance < 0) return { status: "bad", text: "Ga je niet halen" };
	else if (eta - distance === 0) return { status: "bad", text: "Als je rent" };
	else if (eta - distance > 0 && eta - distance < 3) return { status: "good", text: "Goede tijd. 1-3 minuten wachten" };
	else if (eta - distance > 3 && eta - distance < 5) return { status: "okay", text: "Rustig aan. 3-5 minuten wachten" };
	else return { status: "bad", text: `> ${Math.round(eta - distance)} minuten wachten` };
}