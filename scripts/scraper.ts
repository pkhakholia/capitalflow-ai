import puppeteer from 'puppeteer';
import * as fs from 'fs/promises';

const vcUrls = [
  "https://www.sequoiacap.com",
  "https://a16z.com",
  "https://www.accel.com",
  "https://www.lightspeedvp.com",
  "https://www.benchmark.com",
  "https://www.baincapitalventures.com",
  "https://www.greylock.com",
  "https://www.kleinerperkins.com",
  "https://www.bessemer.com",
  "https://www.tigerglobal.com",
  "https://blume.vc",
  "https://www.nexusvp.com",
  "https://www.elevationcapital.com",
  "https://www.matrixpartners.in",
  "https://chiratae.com",
  "https://www.steppstonegroup.com",
  "https://www.antler.co",
  "https://www.peakxv.com",
  "https://www.venturehighway.vc",
  "https://www.omnivore.vc"
];

const OUTPUT_FILE = "vc_raw_data.json";
const DELAY_MS = 2500; // 2.5 seconds

function delay(ms: number) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function scrapeVCs() {
  console.log(`Starting scraper for ${vcUrls.length} VC URLs...`);
  const browser = await puppeteer.launch({
    headless: true, // Run in background
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-blink-features=AutomationControlled'],
  });

  const results = [];
  const failedUrls: string[] = [];

  for (const url of vcUrls) {
    let page;
    try {
      console.log(`\nNavigating to: ${url}`);
      page = await browser.newPage();
      
      // Set a realistic user agent
      await page.setUserAgent("Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36");
      
      // Navigate and wait for resources to load
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      
      // Extract data
      const data = await page.evaluate(() => {
        const title = document.title || "";
        const text = document.body ? document.body.innerText : "";
        return { title, text };
      });

      console.log(`✅ Success: ${data.title}`);
      
      results.push({
        url,
        title: data.title.trim(),
        text: data.text.trim(),
      });

    } catch (error: any) {
      console.error(`❌ Failed: ${url} -> ${error.message}`);
      failedUrls.push(url);
    } finally {
      if (page) await page.close();
      // Delay before next request
      console.log(`Waiting ${DELAY_MS}ms...`);
      await delay(DELAY_MS);
    }
  }

  await browser.close();

  console.log('\n--- Scraping Summary ---');
  console.log(`Total URLs: ${vcUrls.length}`);
  console.log(`Successful: ${results.length}`);
  console.log(`Failed: ${failedUrls.length}`);
  
  if (failedUrls.length > 0) {
    console.log(`Failed URLs list:\n${failedUrls.join('\n')}`);
  }

  try {
    await fs.writeFile(OUTPUT_FILE, JSON.stringify(results, null, 2), 'utf-8');
    console.log(`\nData saved to ${OUTPUT_FILE}`);
  } catch (error) {
    console.error("Failed to save output to file:", error);
  }
}

scrapeVCs().catch(console.error);
