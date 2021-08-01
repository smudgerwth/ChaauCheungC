const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const {PythonShell} = require('python-shell');

puppeteer.use(StealthPlugin());

(async () => {
    const browser = await puppeteer.launch({
        headless: false, // launch headful mode
        // ignoreDefaultArgs: true, 
        // args: ['--no-sandbox', '--disable-setuid-sandbox'],
        slowMo: 1000, // slow down puppeteer script so that it's easier to follow visually
    });
    let [page] = await browser.pages();
    // page.on('console', consoleObj => console.log(consoleObj.text()));
    console.log("1");
    await page.goto('http://leisurelink.lcsd.gov.hk/?lang=en');
    console.log("2");
    await page.waitForNavigation({waitUntil: 'networkidle0'});
    console.log("3");

    // Click to enter captcha page
    let btns = await page.$$('.actionBtnBlock');
    console.log("4");
    let newPagePromise = new Promise(x => page.once('popup', x));
    await btns[0].click();
    console.log("5");

    let newPage = await newPagePromise;
    console.log("6");
    // Wait for captcha image
    await newPage.waitForSelector('#inputTextWrapper');
    newPage.on('console', consoleObj => console.log(consoleObj.text()));
    console.log("7");
    
    let captcha = await newPage.evaluate(() => {
        return document.querySelector('#inputTextWrapper img').src;
    });
    let data = captcha.replace(/^data:image\/\w+;base64,/, "");
    // console.log("data:"+data)

    // Save captcha to file
    let buf = new Buffer.from(data, 'base64');
    fs.writeFile('captcha.jpg', buf,function(err, result) {
        if(err){console.log('error', err);}
    });
    // Save the preselected captcha and unselect it
    let presel_char = await newPage.evaluate(() => {
        let node = document.querySelector('.kbkey.button.red_selected.sel');
        node.click();
        return node.innerText;
    });
    console.log("presel_char:"+presel_char)

    // Get all the captcha characters
    let char_list = await newPage.evaluate(() => {
        let list = []
        for(let node of document.querySelectorAll('.kbkey.button.red')){
            list.push(node.innerText);
        }
        return list;
    });
    console.log("char_list:"+char_list.join(""))

    // Run Python script do OCR
    let options = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
        // scriptPath: 'path/to/my/scripts', //If you are having python_test.py script in same folder, then it's optional.
        args: [presel_char, char_list.join("")] //An argument which can be accessed in the script using sys.argv[1]
    };

    let ocr_captcha = await new Promise((resolve,reject) =>{ 
        PythonShell.run('ocr_captcha.py', options, function (err, result){
            if (err) reject(err);
            // result is an array consisting of messages collected 
            //during execution of script.
            // console.log('result: ', result.toString());
            resolve(result[0]);
        });
    });

    console.log(ocr_captcha);

    await newPage.evaluate((ocr_captcha) => {
        for(let node of document.querySelectorAll('.kbkey.button.red')){
            if (ocr_captcha.includes(node.innerText)){
                node.click();
            }
        }
        // let btn_cont = document.querySelector('.actionBtnContinue');
        // btn_cont.click();
    }, ocr_captcha);

    await page.waitForTimeout(2000);

    await newPage.evaluate(() => {
        let btn_cont = document.querySelector('.actionBtnContinue');
        btn_cont.click();
    });

    console.log('end');

    // await newPage.close();
    // await page.close();
    // await browser.close();
    // console.log("result:"+captcha);

})();
