const { PythonShell } = require('python-shell');
async function solveCaptcha(c_page) {
    // Wait for captcha image
    await c_page.waitForSelector('#inputTextWrapper');
    // await c_page.waitForSelector('#inputTextWrapper > div > img');
    // c_page.on('console', consoleObj => console.log(consoleObj.text()));
    console.log('7');

    let captcha = await c_page.evaluate(() => {
        return document.querySelector('#inputTextWrapper img').src;
    });
    let data = captcha.replace(/^data:image\/\w+;base64,/, '');
    // console.log('data:'+data)

    // Save the preselected captcha and unselect it
    let presel_char = await c_page.evaluate(() => {
        let node = document.querySelector('.kbkey.button.red_selected.sel');
        if (node != null) {
            node.click();
            return node.innerText;
        }
    });
    console.log('presel_char:' + presel_char)

    // Get all the captcha characters
    let char_list = await c_page.evaluate(() => {
        let list = []
        for (let node of document.querySelectorAll('.kbkey.button.red')) {
            list.push(node.innerText);
        }
        return list;
    });
    console.log('char_list:' + char_list.join(''))

    // Run Python script do OCR
    let options = {
        mode: 'text',
        pythonOptions: ['-u'], // get print results in real-time
        // scriptPath: 'path/to/my/scripts', //If you are having python_test.py script in same folder, then it's optional.
        args: [data, char_list.join('')] //An argument which can be accessed in the script using sys.argv[1]
    };

    ocr_captcha = await new Promise((resolve, reject) => {
        PythonShell.run('ocr_captcha.py', options, function (err, result) {
            if (err) reject(err);
            // result is an array consisting of messages collected 
            //during execution of script.
            // console.log('result: ', result.toString());
            resolve(result[0]);
        });
    });
    return ocr_captcha;
}

async function regenerateCaptch(c_page) {
    await c_page.waitForSelector('.actionBtnSmall');
    console.log('regen');
    await c_page.evaluate(() => {
        let node = document.querySelector('.actionBtnSmall');
        node.click();
    });
    await new Promise(resolve => setTimeout(resolve, 500));
}

async function selectCaptchaKeys(c_page, ocr_captcha) {
    await c_page.evaluate(async (ocr_captcha) => {
        for (let i = 0; i < ocr_captcha.length; i++) {
            for (let node of document.querySelectorAll('.kbkey.button.red')) {
                if (ocr_captcha.charAt(i) === (node.innerText)) {
                    node.click();
                    await new Promise(resolve => setTimeout(resolve, 500))
                    break;
                }
            }
        }
    }, ocr_captcha);
}

module.exports.solveCaptcha = solveCaptcha;
module.exports.regenerateCaptch = regenerateCaptch;
module.exports.selectCaptchaKeys = selectCaptchaKeys;
