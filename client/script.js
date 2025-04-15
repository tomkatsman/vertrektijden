document.addEventListener("DOMContentLoaded", () => {
	const loader = document.querySelector(".loader");
	const main = document.querySelector("main");
	const buttons = document.querySelectorAll("button");

	buttons.forEach((btn) => {
		btn.addEventListener("click", () => {
			buttons.forEach((b) => b.classList.remove("active"));
			btn.classList.add("active");

			const perron = btn.dataset.perron;
			loadDepartures(perron);
		});
	});

	loadDepartures(); // standaard bij laden
});

function loadDepartures(perronFilter = null) {
	const loader = document.querySelector(".loader");
	const main = document.querySelector("main");
	main.innerHTML = "";
	loader.classList.add("show");

	fetch("http://localhost:3000/getTimes")
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
	main.innerHTML = "";

	data.forEach((item) => {
		if (perronFilter && !item.perron.includes(perronFilter)) return;

		const div = document.createElement("div");
		div.classList.add("departure");

		const eta = document.createElement("div");
		eta.classList.add("eta");
		eta.textContent = item.time;

		const richting = document.createElement("div");
		richting.classList.add("metro-richting");
		richting.innerHTML = `${getMetroBadge(item.metroLine)} ${item.destination}`;

		const perron = document.createElement("div");
		perron.classList.add("vertrektijd");
		perron.textContent = item.perron;

		div.appendChild(eta);
		div.appendChild(richting);
		div.appendChild(perron);

		main.appendChild(div);
	});
}

function getMetroBadge(line) {
	const classMap = {
		A: "metro-a",
		B: "metro-b",
		C: "metro-c",
	};
	const cls = classMap[line] || "";
	return `<span class="${cls}">${line}</span>`;
}
