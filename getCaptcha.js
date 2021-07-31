const puppeteer = require('puppeteer');
const fs = require('fs');

(async () => {
    const browser = await puppeteer.launch({
        // headless: false, // launch headful mode
        // slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
    })
    let page = await browser.newPage();
    console.log("1")
    await page.goto('http://leisurelink.lcsd.gov.hk/?lang=en')
    console.log("2")
    await page.waitForNavigation({waitUntil: 'networkidle0'})
    for(let i = 0; i < 1000 ; i++){
        console.log("3")
        let btns = await page.$$('.actionBtnBlock')
        console.log("4")
        let newPagePromise = new Promise(x => page.once('popup', x));
        await btns[0].click();
        console.log("5")

        let newPage = await newPagePromise;
        console.log("6")
        await newPage.waitForSelector('#inputTextWrapper')
        console.log("7")
        let captcha = await newPage.evaluate(() => {
            return document.querySelector('#inputTextWrapper img').src;
        });
        let data = captcha.replace(/^data:image\/\w+;base64,/, "");
        let buf = new Buffer.from(data, 'base64');
        fs.writeFile('captcha\\captcha'+i+'.jpg', buf,function(err, result) {
            if(err){console.log('error', err);}
        });
        await newPage.close()
        await page.reload()
        // console.log("result:"+captcha)
    }
    await browser.close();
})();