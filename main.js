const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const {PythonShell} = require('python-shell');
const path = require('path');
const root = path.dirname(require.main.filename);
const ppUserPrefs = require('puppeteer-extra-plugin-user-preferences');

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

async function solveCaptcha(c_page){
    // Wait for captcha image
    await c_page.waitForSelector('#inputTextWrapper');
    c_page.on('console', consoleObj => console.log(consoleObj.text()));
    console.log('7');

    let captcha = await c_page.evaluate(() => {
        return document.querySelector('#inputTextWrapper img').src;
    });
    let data = captcha.replace(/^data:image\/\w+;base64,/, '');
    // console.log('data:'+data)

    // Save the preselected captcha and unselect it
    let presel_char = await c_page.evaluate(() => {
        let node = document.querySelector('.kbkey.button.red_selected.sel');
        node.click();
        return node.innerText;
    });
    console.log('presel_char:'+presel_char)

    // Get all the captcha characters
    let char_list = await c_page.evaluate(() => {
        let list = []
        for(let node of document.querySelectorAll('.kbkey.button.red')){
            list.push(node.innerText);
        }
        return list;
    });
    console.log('char_list:'+char_list.join(''))

    // Run Python script do OCR
    let options = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
        // scriptPath: 'path/to/my/scripts', //If you are having python_test.py script in same folder, then it's optional.
        args: [data, char_list.join('')] //An argument which can be accessed in the script using sys.argv[1]
    };

    ocr_captcha = await new Promise((resolve,reject) =>{ 
        PythonShell.run('ocr_captcha.py', options, function (err, result){
            if (err) reject(err);
            // result is an array consisting of messages collected 
            //during execution of script.
            // console.log('result: ', result.toString());
            resolve(result[0]);
        });
    });
    return ocr_captcha;
}

async function regenerateCaptch(c_page){
    await c_page.waitForSelector('.actionBtnSmall');
    console.log('regen');
    await c_page.evaluate(() => {
        let node = document.querySelector('.actionBtnSmall');
        node.click();
    });
}

async function selectCaptchaKeys(c_page, ocr_captcha){
    await c_page.evaluate((ocr_captcha) => {
        for(let node of document.querySelectorAll('.kbkey.button.red')){
            if (ocr_captcha.includes(node.innerText)){
                node.click();
            }
        }
    }, ocr_captcha);
}

async function pressContinue(c_page){
    await c_page.evaluate(() => {
        let btn_cont = document.querySelector('.actionBtnContinue');
        btn_cont.click();
    });
}

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // launch headful mode
        // devtools: true,
        // ignoreDefaultArgs: [
        //     '--enable-automation',
        // ],
        // ignoreDefaultArgs: true,
        args: [
            '--window-size=640,480',        //     '--incognito',
            // '--no-sandbox',
            // '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--single-process',
            '--incognito',
        ],
        slowMo: 250, // slow down puppeteer script so that it's easier to follow visually
    });

    let [page] = await browser.pages();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    console.log('1');
    await page.goto('http://leisurelink.lcsd.gov.hk/?lang=tc');
    console.log('2');
    await page.waitForNavigation({waitUntil: 'networkidle0'});
    console.log('3');

    // Click to enter captcha page
    let btns = await page.$$('.actionBtnBlock');
    console.log('4');
    let newPagePromise = new Promise(x => page.once('popup', x));
    await btns[0].click();
    console.log('5');

    let newPage = await newPagePromise;
    console.log('6');
    let ocr_captcha;
    let elementHandle;

    while(true){
        ocr_captcha = await solveCaptcha(newPage);
        console.log("ocr_captcha:"+ocr_captcha);
        if(ocr_captcha.length==4 
            && ocr_captcha.split("").some(function(v,i,a){
            return a.lastIndexOf(v)!=i;
          })==false){
            await selectCaptchaKeys(newPage,ocr_captcha);
            await pressContinue(newPage);
            elementHandle = await newPage.waitForSelector("frame[name='main']",{timeout:5000});
            if(elementHandle != null)
                break;
        }
        else
        {
            await regenerateCaptch(newPage);
        }
    }
    
    console.log('hihi');

    let config_data = JSON.parse(fs.readFileSync(path.join(root,'config.json')));
    const frame = await elementHandle.contentFrame();
    console.log(frame)
    await frame.waitForSelector('#radNonRegId');
    await frame.click('#radNonRegId');
    await frame.focus('#hkId');
    console.log('hkId:'+config_data.hkId);
    await newPage.keyboard.type(config_data.hkId);
    await frame.focus('#hkIdCheckDigit');
    await newPage.keyboard.type(config_data.hkIdCheckDigit);
    await frame.focus('#telephoneNo');
    await newPage.keyboard.type(config_data.telephoneNo);


    /
    console.log('end');

    // await newPage.close();
    // await page.close();
    // await browser.close();
    // console.log('result:'+captcha);

})();
