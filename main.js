const process = require('process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const root = path.dirname(require.main.filename);
const ppUserPrefs = require('puppeteer-extra-plugin-user-preferences');

const btn_index = 5; // 0:booking, 5:checking
const badminton_val = '7';

const facilityType = [22, 22, 504, 504];
const area = ["*NTE", "*NTW", "*KLN", "*HK"];
const venue = [
    //"*NTE"
    [
        60, 61, 94,
        70000734, 70001033, 70001333
    ],
    //"*NTW"
    [
        95, 70001733, 70001535
    ],
    //"*KLN"
    [
        279, 281, 284,
        287, 288, 291,
        292, 293, 244,
        245, 246, 248,
        254, 256, 257
    ],
    //"*HK"
    [
        300, 302, 303
    ]
];
let py_sh = path.join(root, 'sendTgMsg1.py');

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

async function solveCaptcha(c_page) {
    // Wait for captcha image
    await c_page.waitForSelector('#inputTextWrapper');
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

async function pressContinue(c_page) {
    await c_page.evaluate(() => {
        let btn_cont = document.querySelector('.actionBtnContinue');
        btn_cont.click();
    });
}

async function getNumOfOptions(page, id) {
    return await page.evaluate(async (id) => {
        let node = document.querySelector(id);
        let node_options = node.querySelectorAll('option');
        return node_options.length;
    }, id);
}

async function getOption(page, id, index) {
    return await page.evaluate(async (id, index) => {
        let node = document.querySelector(id);
        let node_options = node.querySelectorAll('option');
        return [node_options[index].value, node_options[index].innerText];
    }, id, index);
}

async function getOptionTextByValue(page, id, value) {
    return await page.evaluate(async (id, value) => {
        let node = document.querySelector(id);
        let node_options = node.querySelector('option[value="' + value + '"]');
        return node_options.innerText;
    }, id, value);
}

async function getVenueResultArray(page, venue_text) {
    return await page.evaluate(async (venue_text) => {
        let table = document.querySelector("#searchResult #searchResultTable table");
        for (let row of table.rows) {
            let cell = row.cells
            cell_location_text = cell[1].innerText;
            if (cell_location_text.includes(venue_text) == false) {
                continue;
            }
            let array = [];
            for (let ind = 2; ind < cell.length; ind++) {
                array.push(cell[ind].innerText.replace(/\s/g, 'Y'));
            }
            return array;
            // let timeslot_length = table.rows[1].cells.length;
            // let textt = node1.rows[1].cells[1].innerText;
            // return textt;
            // return node2.rows[2].length;
        }
    }, venue_text);
}
async function csvAddColum(array, ...data) {
    array[array.length - 1].push(data);
}

async function csvAddRow(array) {
    array.push([]);
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
            // '--window-size=640,480',
            '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--single-process',
            // '--incognito',
        ],
        slowMo: 150, // slow down puppeteer script so that it's easier to follow visually
    });
    try {
        let [page] = await browser.pages();
        // page.on('console', consoleObj => console.log(consoleObj.text()));
        console.log('1');
        await page.goto('http://leisurelink.lcsd.gov.hk/?lang=tc');
        console.log('2');
        // await page.waitForNavigation({waitUntil: 'networkidle0'});
        console.log('3');

        // Click to enter captcha page
        let btns = await page.$$('.actionBtnBlock');
        console.log('4');
        let newPagePromise = new Promise(x => page.once('popup', x));
        await btns[btn_index].click();
        console.log('5');

        let newPage = await newPagePromise;
        console.log('6');
        let ocr_captcha;
        let elementHandle;

        while (true) {
            ocr_captcha = await solveCaptcha(newPage);
            console.log("ocr_captcha:" + ocr_captcha);
            if (ocr_captcha.length == 4
                && ocr_captcha.split("").some(function (v, i, a) {
                    return a.lastIndexOf(v) != i;
                }) == false) {
                await selectCaptchaKeys(newPage, ocr_captcha);
                await pressContinue(newPage);
                elementHandle = await newPage.waitForSelector("frame[name='main']", { timeout: 5000 }).catch(error => console.log('failed to wait for the selector'));
                if (elementHandle != null)
                    break;
            }
            else {
                await regenerateCaptch(newPage);
            }
        }

        console.log('hihi');

        let frame = await elementHandle.contentFrame();
        // console.log(frame);

        if (btn_index == 0) {
            let config_data = JSON.parse(fs.readFileSync(path.join(root, 'config.json')));
            await frame.waitForSelector('#radNonRegId');
            await frame.click('#radNonRegId');
            await frame.focus('#hkId');
            console.log('hkId:' + config_data.hkId);
            await newPage.keyboard.type(config_data.hkId);
            await frame.focus('#hkIdCheckDigit');
            await newPage.keyboard.type(config_data.hkIdCheckDigit);
            await frame.focus('#telephoneNo');
            await newPage.keyboard.type(config_data.telephoneNo);

            while (true) {
                ocr_captcha = await solveCaptcha(frame);
                console.log("ocr_captcha:" + ocr_captcha);
                if (ocr_captcha.length == 5
                    && ocr_captcha.split("").some(function (v, i, a) {
                        return a.lastIndexOf(v) != i;
                    }) == false) {
                    await selectCaptchaKeys(frame, ocr_captcha);
                    await pressContinue(frame);
                    console.log("wait data");
                    elementHandle = await frame.waitForSelector("#datePanel", { timeout: 5000 }).catch(error => console.log('failed to wait for the selector'));
                    if (elementHandle != null)
                        break;
                }
                else {
                    await regenerateCaptch(frame);
                }
            }
        }
        let data_array = [];
        await frame.waitForSelector("#datePanel");

        await frame.select('#facilityPanel > select', badminton_val);

        let holi_list = await frame.evaluate(async ()=> {
            let nodes = document.querySelectorAll('#datePickerFacilityResponsive table input[type="button"]');
            let array = [];
            for(let node of nodes){
                array.push(node.className.replace('calendarHolidayDay','H').replace('calendarNormalDay','N'));
            }
            return array;
        });
        // console.log(holi_list);
        // console.log(holi_list[0]);

        let num_date = await getNumOfOptions(frame, '#datePanel');
        console.log("num_date", num_date);
        for (let i = 0; i < num_date - 1; i++) {     //Skip last date
            let [date_val, date_text] = await getOption(frame, '#datePanel', i);
            let day_text= date_text.slice(12,13);
            date_text = date_text.slice(0, 5);
            // console.log("date_val:",date_val);
            if (!date_val) continue;
            await frame.select('#datePanel > select', date_val);

            // let num_facilityType = await getNumOfOptions(frame,'#facilityTypePanel');
            let num_facilityType = facilityType.length;
            for (let j = 0; j < num_facilityType; j++) { //use for each?
                // let [facilityType_val, facilityType_text] = await getOption(frame,'#facilityTypePanel',j);
                // if(!facilityType_val) continue;
                facilityType_val = facilityType[j].toString();
                facilityType_text = await getOptionTextByValue(frame, '#facilityTypePanel', facilityType_val);
                await frame.select('#facilityTypePanel > select', facilityType_val);

                let num_sessionTime = await getNumOfOptions(frame, '#sessionTimePanel');
                for (let k = 0; k < num_sessionTime; k++) {
                    let [sessionTime_val, sessionTime_text] = await getOption(frame, '#sessionTimePanel', k);
                    if (!sessionTime_val) continue;
                    sessionTime_text = sessionTime_text.slice(5, 7);
                    await frame.select('#sessionTimePanel > select', sessionTime_val);

                    let area_val = area[j];
                    await frame.select('#areaPanel > select', area_val);
                    // let num_venue = await getNumOfOptions(frame,'#preference1\\.venuePanel');
                    let num_venue = venue[j].length;
                    // for(let m=0; m<num_venue; m++){
                    for (let m = 0; m < num_venue;) {
                        // let [venue_val, venue_text] = await getOption(frame,'#preference1\\.venuePanel',m);
                        // if(!venue_val) continue;
                        let venue_text1, venue_text2, venue_text3;
                        venue_val1 = venue[j][m].toString();
                        venue_text1 = await getOptionTextByValue(frame, '#preference1\\.venuePanel', venue_val1);
                        // console.log("venue_text1:",venue_text1);
                        await frame.select('#preference1\\.venuePanel > select', venue_val1);
                        m++;
                        if (m < num_venue) {
                            venue_val2 = venue[j][m].toString();
                            venue_text2 = await getOptionTextByValue(frame, '#preference2\\.venuePanel', venue_val2);
                            await frame.select('#preference2\\.venuePanel > select', venue_val2);
                            m++;
                        }
                        if (m < num_venue) {
                            venue_val3 = venue[j][m].toString();
                            venue_text3 = await getOptionTextByValue(frame, '#preference3\\.venuePanel', venue_val3);
                            await frame.select('#preference3\\.venuePanel > select', venue_val3);
                            m++;
                        }
                
                        await pressContinue(frame);
                        // await new Promise(resolve => setTimeout(resolve, 500))
                        await frame.waitForSelector("#searchResultTable");
                        let tr_len;
                        let offset = 0;
                        if(sessionTime_val=='EV'){
                            // sessionTime_val = 'PM';
                            offset = 12;
                        }
                        if (venue_text1) {
                            tr_len = await getVenueResultArray(frame, venue_text1);
                            // console.log("tr_len",tr_len.toString());
                            for(let index=0; index<tr_len.length; index++){
                                // console.log("tr_len",index,tr_len[index]);
                                let time_val = parseInt(sessionTime_text)+index+offset;
                                // if(time_val>12){
                                //     time_val -= 12;
                                // }
                                if (tr_len[index]=='Y') {
                                    csvAddRow(data_array);
                                    csvAddColum(data_array, date_text, day_text, holi_list[i-1], time_val.toString().padStart(2,'0')+':00', venue_text1.replace('體育館', ''));
                                }
                            }
                        }
                        if (venue_text2) {
                            tr_len = await getVenueResultArray(frame, venue_text2);
                            for(let index=0; index<tr_len.length; index++){
                                let time_val = parseInt(sessionTime_text)+index+offset;
                                if (tr_len[index]=='Y') {
                                    csvAddRow(data_array);
                                    csvAddColum(data_array, date_text, day_text, holi_list[i-1], time_val.toString().padStart(2,'0')+':00', venue_text2.replace('體育館', ''));
                                }
                            }
                        }
                        if (venue_text3) {
                            tr_len = await getVenueResultArray(frame, venue_text3);
                            for(let index=0; index<tr_len.length; index++){
                                let time_val = parseInt(sessionTime_text)+index+offset;
                                if (tr_len[index]=='Y') {
                                    csvAddRow(data_array);
                                    csvAddColum(data_array, date_text, day_text, holi_list[i-1], time_val.toString().padStart(2,'0')+':00', venue_text3.replace('體育館', ''));
                                }
                            }
                        }
                        // break;
                    }
                    // break;
                }
                // break;
            }
            // break;
        }
        // csv_data = "Date,Time,Venue,Location,Slot1,Slot2,Slot3,Slot4,Slot5,Slot6,Slot7\n"
        let csv_data = Array.from(new Set(data_array.map(JSON.stringify)), JSON.parse).map(row => row.join(',')).join('\n');
        console.log(csv_data.toString());

        fs.writeFileSync(path.join(root, 'curr_result1.csv'), csv_data, 'utf8');

        console.log('end');

        // await newPage.close();
        // await page.close();
        await browser.close();

        // Run Python script
        let options = {
            mode: 'text',
            pythonOptions: ['-u'], // get print results in real-time
            // scriptPath: 'path/to/my/scripts', //If you are having python_test.py script in same folder, then it's optional.
            // args: [csv_data.toString()] //An argument which can be accessed in the script using sys.argv[1]
        };

        await new Promise((resolve, reject) => {
            PythonShell.run(py_sh, options, function (err, result) {
                if (err) reject(err);
                // result is an array consisting of messages collected 
                //during execution of script.
                console.log('result: ', result);
                resolve();
            });
        });
    } catch (error) {
        console.log(error);
        await browser.close();
        process.exitcode = 1;
    }
    console.log(new Date().toString());
})();
