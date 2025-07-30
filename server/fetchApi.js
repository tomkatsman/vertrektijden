require('dotenv').config();
const puppeteer = require('puppeteer');

async function fetchDepartures() {
  const launchOptions = {
    headless: true,
    args: [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--single-process',
      '--no-zygote',
    ],
  };

  // Alleen in productie het executablePath gebruiken
  if (process.env.NODE_ENV === 'production') {
    launchOptions.executablePath = process.env.PUPPETEER_EXECUTABLE_PATH;
  }

  let browser;

  try {
    browser = await puppeteer.launch(launchOptions);

    const page = await browser.newPage();
    await page.emulateTimezone('Europe/Amsterdam');

    page.on('console', msg => console.log('PAGE LOG:', msg.text()));

    await page.goto('https://9292.nl/locaties/rotterdam_metrostation-marconiplein/departures?modalityGroup=Subway', {
      waitUntil: 'networkidle0',
      timeout: 30000
    });

    console.log('Page loaded, waiting for selector...');
    await page.waitForSelector('.group.grid', {
      timeout: 15000,
      visible: true
    });

    console.log('Selector found, evaluating page...');

    const departures = await page.evaluate(() => {
      console.log('Starting evaluation...');
      const rows = document.querySelectorAll('.group.grid');
      console.log('Found rows:', rows.length);

      if (rows.length === 0) {
        console.log('No rows found, checking page content...');
        console.log('HTML content:', document.body.innerHTML);
      }

      return Array.from(rows).map(row => {
        const time = row.querySelector('.flex.flex-col.font-bold span')?.textContent?.trim() || '';
        const metroLine = row.querySelector('.c-modality-service-label')?.textContent?.trim() || '';
        const destination = row.querySelector('.flex.w-full.flex-1.flex-col span')?.textContent?.trim() || '';
        const perron = row.querySelector('.flex.flex-col.justify-center span:last-child')?.textContent?.trim() || '';

        console.log('Extracted data:', { time, metroLine, destination, perron });
        return { time, metroLine, destination, perron };
      });
    });

    console.log('Departures found:', departures.length);
    console.log('Sample departure:', departures[0]);

    return departures;
  } catch (error) {
    console.error('Error in fetchDepartures:', error);
    throw error;
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}

module.exports = fetchDepartures;
