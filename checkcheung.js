const process = require('process');
const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const { PythonShell } = require('python-shell');
const path = require('path');
const root = path.dirname(require.main.filename);
const ppUserPrefs = require('puppeteer-extra-plugin-user-preferences');

let py_sh = path.join(root, 'sendTgMsg.py');
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
async function csvAddColum(array, ...data) {
    array[array.length - 1].push(data);
}

async function csvAddRow(array) {
    array.push([]);
}
(async () => {
    const browser = await puppeteer.launch({
        // headless: false, // launch headful mode
        // devtools: true,
        // ignoreDefaultArgs: [
        //     '--enable-automation',
        // ],
        // ignoreDefaultArgs: true,
        // executablePath: '/usr/bin/chromium-browser',
        args: [
            // '--window-size=640,480',
            // '--start-maximized',
            '--no-sandbox',
            '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--single-process',
            // '--incognito',
        ],
        slowMo: 200, // slow down puppeteer script so that it's easier to follow visually
    });
    try {
        let [page] = await browser.pages();
        // page.on('console', consoleObj => console.log(consoleObj.text()));
        console.log('1');
        await page.goto('https://www.lcsd.gov.hk/clpss/tc/search/leisure/bookTelRsrvCnclForm.do');
        console.log('2');
        // await page.waitForNavigation({waitUntil: 'networkidle0'});
        console.log('3');
        await page.waitForSelector('#facility');
        await page.waitForSelector('#searchBtn');
        await page.select('#facility', '羽毛球場');
        await page.click('#searchBtn');
        await page.waitForSelector('#pageSearchResult');
        await new Promise(resolve => setTimeout(resolve, 1000));
        let num_result = await page.evaluate(async () => {
            return document.querySelector('.panel-body.table-responsive div strong').innerText;
        });
        console.log('num_result:', num_result);
        await page.evaluate(async () => {
            sortOrder('start_date', 'asc');
            await new Promise(resolve => setTimeout(resolve, 1000));
            sortOrder('start_time', 'asc');
            await new Promise(resolve => setTimeout(resolve, 1000));
        });
        let result_array = [];

        for (let saved_result = 0; saved_result < num_result;) {
            await page.waitForSelector('#pageSearchResult');
            let [table_array, num_page_result] = await page.evaluate(async () => {
                let array = [];
                let table = document.querySelector('#pageSearchResult');
                for (let i = 0; i < table.rows.length; i++) {
                    array.push([]);
                    for (let j = 0; j < table.rows[i].cells.length; j++) {
                        if (j == 2 || j == 5 || j == 6 || j == 8) {
                            let tb_str = table.rows[i].cells[j].innerText;
                            if (j == 2) tb_str = tb_str.replace('體育館', '');
                            if (j == 5) tb_str = tb_str.slice(0, 5);
                            array[array.length - 1].push(tb_str);

                        }
                    }
                }
                return [array, table.rows.length];
            });
            // console.log('table_array',table_array);
            // console.log('result_array',result_array.toString());
            // csvAddRow(result_array);
            result_array = result_array.concat(table_array);
            console.log('result_array', result_array);

            saved_result += num_page_result;
            console.log('saved_result:', saved_result);
            await page.waitForSelector('#pag_next');
            await page.click('#pag_next');
        }
        // console.log('result_array',result_array.toString());
        let csv_data = result_array.map(row => row.join(',')).join('\n');
        console.log(csv_data.toString());

        fs.writeFileSync(path.join(root, 'curr_result.csv'), csv_data, 'utf8');
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
        console.log('end');
    } catch (error) {
        console.log(error);
        await browser.close();
        process.exitcode = 1;
    }
    console.log(new Date().toString());
})();
