const process = require('process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const root = path.dirname(require.main.filename);
const ppUserPrefs = require('puppeteer-extra-plugin-user-preferences');

const btn_index = 5; // 0:booking, 5:checking
puppeteer.use(ppUserPrefs({
    userPrefs: {
        devtools: {
            preferences: {
                currentDockState: '"undocked"'
            },
        },
    }
}));
puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // launch headful mode
        // devtools: true,
        // ignoreDefaultArgs: [
        //     '--enable-automation',
        // ],
        // ignoreDefaultArgs: true,
        args: [
            // '--window-size=640,480',
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--single-process',
            // '--incognito',
        ],
        slowMo: 100, // slow down puppeteer script so that it's easier to follow visually
    });
    let [page] = await browser.pages();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    // console.log('1');
    await page.goto('http://leisurelink.lcsd.gov.hk/?lang=tc');
    // console.log('2');
    // await page.waitForNavigation({waitUntil: 'networkidle0'});
    // console.log('3');
    // while(1);

    // Click to enter captcha page
    let btns = await page.$$('.actionBtnBlock');
    // console.log('4');
    let newPagePromise = new Promise(x => page.once('popup', x));
    await btns[btn_index].click();
    // console.log('5');

    let newPage = await newPagePromise;
    console.log("6")
    await newPage.waitForSelector('#inputTextWrapper')
    console.log("7")
    // for (let i = 0; i < 1000; i++) {
        let captcha = await newPage.evaluate(() => {
            return document.querySelector('#inputTextWrapper img').src;
        });
        let data = captcha.replace(/^data:image\/\w+;base64,/, "");
        let buf = new Buffer.from(data, 'base64');
        if (!fs.existsSync("captcha_1000")){
            fs.mkdirSync("captcha_1000");
        }
        fs.writeFile('captcha_1000\\captcha' + i + '.jpg', buf, function (err, result) {
            if (err) { console.log('error', err); }
        });
        // console.log("result:"+captcha)
    // }
    await newPage.close()
    await browser.close();
})();