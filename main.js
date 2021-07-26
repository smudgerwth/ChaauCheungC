const puppeteer = require('puppeteer');
const fs = require('fs');
const fetch = require('node-fetch');

function saveImageToDisk(url, filename){
    fetch(url)
    .then(res => {
        const dest = fs.createWriteStream(filename);
        res.body.pipe(dest)
    })
    .catch((err) => {
        console.log(err)
    })
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // launch headful mode
        // slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
    })
    const page = await browser.newPage();
    await page.goto('http://leisurelink.lcsd.gov.hk/?lang=en')
    await page.waitForNavigation({ waitUntil: 'networkidle0' })
    const btns = await page.$$('.actionBtnBlock')
    const newPagePromise = new Promise(x => page.once('popup', x));
    await btns[0].click();

    const newPage = await newPagePromise;           // declare new tab /window, 
    console.log("1")
    await newPage.waitForSelector('#inputTextWrapper')
    console.log("2")
    const captcha = await newPage.evaluate(() => {
        return document.querySelector('#inputTextWrapper img').src;
    });
    var data = captcha.replace(/^data:image\/\w+;base64,/, "");
    var buf = new Buffer.from(data, 'base64');
    fs.writeFile('captcha1.jpg', buf,function(err, result) {
      if(err){console.log('error', err);}
    });
    console.log("result:"+captcha)

    // await browser.close();
})();