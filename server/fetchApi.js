const puppeteer = require('puppeteer');

async function fetchDepartures() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  const page = await browser.newPage();

  // Navigeer naar de 9292-pagina
  await page.goto('https://9292.nl/locaties/rotterdam_metrostation-marconiplein/departures?modalityGroup=Subway', {
    waitUntil: 'networkidle0',
  });

  // Wacht tot de relevante elementen zijn geladen
  await page.waitForSelector('.group.grid');

  // Scrape data
  const departures = await page.evaluate(() => {
    const rows = document.querySelectorAll('.group.grid');
    return Array.from(rows).map(row => {
      const time = row.querySelector('.flex.flex-col.font-bold span')?.textContent?.trim() || '';
      const metroLine = row.querySelector('.c-modality-service-label')?.textContent?.trim() || '';
      const destination = row.querySelector('.flex.w-full.flex-1.flex-col span')?.textContent?.trim() || '';
      const perron = row.querySelector('.flex.flex-col.justify-center span:last-child')?.textContent?.trim() || '';

      return { time, metroLine, destination, perron };
    });
  });

  await browser.close();
  return departures;
}

module.exports = fetchDepartures;
