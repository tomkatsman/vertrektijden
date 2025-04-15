const puppeteer = require('puppeteer');

async function fetchDepartures() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });

  try {
    const page = await browser.newPage();
    
    // Enable console logging
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    
    await page.goto('https://9292.nl/locaties/rotterdam_metrostation-marconiplein/departures?modalityGroup=Subway', {
      waitUntil: 'networkidle0', // Wait until network is idle
      timeout: 30000 // Increase timeout to 30 seconds
    });

    console.log('Page loaded, waiting for selector...');
    
    // Wait for the content to be visible
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
        const timeText = row.querySelector('.flex.flex-col.font-bold span')?.textContent?.trim() || '';
        const metroLine = row.querySelector('.c-modality-service-label')?.textContent?.trim() || '';
        const destination = row.querySelector('.flex.w-full.flex-1.flex-col span')?.textContent?.trim() || '';
        const perron = row.querySelector('.flex.flex-col.justify-center span:last-child')?.textContent?.trim() || '';
        
        // Create a date object with the current date and the extracted time
        const [hours, minutes] = timeText.split(':').map(Number);
        const now = new Date();
        const departureTime = new Date(now.getFullYear(), now.getMonth(), now.getDate(), hours, minutes);
        
        // Format the time in ISO format with timezone
        const time = departureTime.toISOString();
        
        console.log('Extracted data:', { time, metroLine, destination, perron });
        return { time, metroLine, destination, perron };
      });
    });

    console.log('Departures found:', departures.length);
    console.log('Sample departure:', departures[0]);

    await browser.close();
    return departures;
  } catch (error) {
    console.error('Error in fetchDepartures:', error);
    await browser.close();
    throw error;
  }
}

module.exports = fetchDepartures;
