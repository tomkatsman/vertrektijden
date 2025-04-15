document.addEventListener("DOMContentLoaded", () => {
	const loader = document.querySelector(".loader");
	const main = document.querySelector("main");
	const buttons = document.querySelectorAll("button");
	const wrapper = document.querySelector("#wrapper");

	const now = new Date();
	const is_afternoon = now.getHours() > 13;
	let perron = is_afternoon ? 1 : 2;

	// Set initial active button
	document.querySelector(`#btn-${perron === 1 ? 'westwaards' : 'oostwaards'}`).classList.add('active');

	buttons.forEach((btn) => {
		btn.addEventListener("click", () => {
			buttons.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");

			perron = btn.dataset.perron;
			loadDepartures(perron);
		});
	});

	loadDepartures(perron); // Initial load
});

function loadDepartures(perronFilter = null) {
	const loader = document.querySelector(".loader");
	const main = document.querySelector("main");
	main.innerHTML = "";
	loader.classList.add("show");

	fetch("https://vertrektijden.onrender.com/getTimes")
		.then((res) => res.json())
		.then((data) => {
			loader.classList.remove("show");
			renderDepartures(data, perronFilter);
		})
		.catch((err) => {
			console.error("Fout bij ophalen vertrektijden:", err);
			loader.classList.remove("show");
			main.innerHTML = "<p style='color: black; text-align: center;'>Fout bij ophalen vertrektijden.</p>";
		});
}

function renderDepartures(data, perronFilter) {
	const main = document.querySelector("main");
	const wrapper = document.querySelector("#wrapper");
	const limit = 8;
	const looptijden = {
		"metrostation-marconiplein": 3,
	}

	main.innerHTML = "";

	const nu = new Date();
	const vandaag = {
		dag: nu.getDate().toString().padStart(2, '0'),
		maand: (nu.getMonth() + 1).toString().padStart(2, '0'),
		jaar: nu.getFullYear()
	}

	data.forEach((t, i) => {
		if (i >= limit) return;
		if (perronFilter && !t.perron.includes(perronFilter)) return;

		const time = t.time.includes(':') ? t.time : `${t.time.slice(0, 2)}:${t.time.slice(2)}`;
		const [hours, minutes] = time.split(':');
		const departureTime = new Date();
		departureTime.setHours(parseInt(hours), parseInt(minutes), 0, 0);

		const ETA = Math.max(0, Math.round((departureTime - nu) / 1000 / 60));

		const looptijd = looptijden["metrostation-marconiplein"];
		const metro = t.metroLine;
		const richting = t.destination;

		const $el = document.createElement("div");
		const $metroRichting = document.createElement("div");

		const $metro = document.createElement("span");
		const $richting = document.createElement("span");
		const $tijd = document.createElement("div");
		const $eta = document.createElement("div");
		const $categorie = document.createElement("div");

		const category = getCategoryText(ETA, looptijd);

		$el.classList.add("departure");
		$el.classList.add(category.status);

		$metro.innerText = metro;
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

		$eta.innerText = isNaN(ETA) ? 'N/A' : `${ETA} min.`;
		$eta.classList.add("eta");

		$categorie.innerText = category.text;
		$categorie.classList.add("categorie");

		$metroRichting.appendChild($metro);
		$metroRichting.appendChild($richting);
		$metroRichting.classList.add("metro-richting");

		$el.appendChild($eta);
		$el.appendChild($tijd);
		$el.appendChild($metroRichting);
		$el.appendChild($categorie);

		main.appendChild($el);
	});
}

function getCategoryText(eta, distance) {
	if (isNaN(eta)) return { status: "bad", text: "Tijd onbekend" };
	if (eta - distance < 0) return { status: "bad", text: "Ga je niet halen" };
	if (eta - distance === 0) return { status: "bad", text: "Als je rent" };
	if (eta - distance > 0 && eta - distance < 3) return { status: "good", text: "Goede tijd. 1-3 minuten wachten" };
	if (eta - distance >= 3 && eta - distance < 5) return { status: "okay", text: "Rustig aan. 3-5 minuten wachten" };
	return { status: "bad", text: `> ${Math.round(eta - distance)} minuten wachten` };
}
