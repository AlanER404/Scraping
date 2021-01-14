var cron = require('node-cron');
 
const scrapApartmani = require("./scraper")

cron.schedule('* * 12 * *', () => {
  await scrapApartmani()
});