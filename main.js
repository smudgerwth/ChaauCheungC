const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const {PythonShell} = require('python-shell');
const path = require('path');
const root = path.dirname(require.main.filename);
const ppUserPrefs = require('puppeteer-extra-plugin-user-preferences');

const btn_index = 5; // 0:booking, 5:checking
const badminton_val = '7';

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
        if(node!=null){
            node.click();
            return node.innerText;
        }
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

async function delayMs(ms){
    await new Promise(resolve => setTimeout(resolve, ms));
}

async function regenerateCaptch(c_page){
    await c_page.waitForSelector('.actionBtnSmall');
    console.log('regen');
    await c_page.evaluate(() => {
        let node = document.querySelector('.actionBtnSmall');
        node.click();
    });
    await delayMs(1000);
    // await new Promise(resolve => setTimeout(resolve, 1000));
}

async function selectCaptchaKeys(c_page, ocr_captcha){
    await c_page.evaluate(async(ocr_captcha) => {
        for(let i=0; i<ocr_captcha.length; i++){
            for(let node of document.querySelectorAll('.kbkey.button.red')){
                if (ocr_captcha.charAt(i)===(node.innerText)){
                    node.click();
                    await delayMs(1000);
                    // await new Promise(resolve => setTimeout(resolve, 1000))
                    break;
                }
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

async function getNumOfOptions(page, id){
	return await page.evaluate(async(id) => {
		let node = document.querySelector(id);
		let node_options = node.querySelectorAll('option');
		return node_options.length;
	},id);
}

async function getOption(page, id, index){
	return await page.evaluate(async(id,index) => {
		let node = document.querySelector(id);
		let node_options = node.querySelectorAll('option');
		return [node_options[index].value, node_options[index].innerText];
	},id,index);
}

async function csvAddColum(array, ...data){
    array[array.length-1].push(data);
}

async function csvAddRow(array){
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
            // '--start-maximized',
            '--no-sandbox',
            // '--disable-setuid-sandbox',
            // '--disable-dev-shm-usage',
            // '--single-process',
            '--incognito',
        ],
        slowMo: 300, // slow down puppeteer script so that it's easier to follow visually
    });

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

    while(true){
        ocr_captcha = await solveCaptcha(newPage);
        console.log("ocr_captcha:"+ocr_captcha);
        if(ocr_captcha.length==4 
            && ocr_captcha.split("").some(function(v,i,a){
            return a.lastIndexOf(v)!=i;
          })==false){
            await selectCaptchaKeys(newPage,ocr_captcha);
            await pressContinue(newPage);
            elementHandle = await newPage.waitForSelector("frame[name='main']",{timeout:5000}).catch(error => console.log('failed to wait for the selector'));
            if(elementHandle != null)
                break;
        }
        else
        {
            await regenerateCaptch(newPage);
        }
    }
    
    console.log('hihi');

    let frame = await elementHandle.contentFrame();
    // console.log(frame);

    if(btn_index==0){
        let config_data = JSON.parse(fs.readFileSync(path.join(root,'config.json')));
        await frame.waitForSelector('#radNonRegId');
        await frame.click('#radNonRegId');
        await frame.focus('#hkId');
        console.log('hkId:'+config_data.hkId);
        await newPage.keyboard.type(config_data.hkId);
        await frame.focus('#hkIdCheckDigit');
        await newPage.keyboard.type(config_data.hkIdCheckDigit);
        await frame.focus('#telephoneNo');
        await newPage.keyboard.type(config_data.telephoneNo);

        while(true){
            ocr_captcha = await solveCaptcha(frame);
            console.log("ocr_captcha:"+ocr_captcha);
            if(ocr_captcha.length==5 
                && ocr_captcha.split("").some(function(v,i,a){
                return a.lastIndexOf(v)!=i;
            })==false){
                await selectCaptchaKeys(frame,ocr_captcha);
                await pressContinue(frame);
                console.log("wait data");
                elementHandle = await frame.waitForSelector("#datePanel",{timeout:5000}).catch(error => console.log('failed to wait for the selector'));
                if(elementHandle != null)
                    break;
            }
            else
            {
                await regenerateCaptch(frame);
            }
        }
    }
    let data_array = [];
    await frame.waitForSelector("#datePanel");

	await frame.select('#facilityPanel > select',badminton_val);
	let num_date = await getNumOfOptions(frame,'#datePanel');
	console.log("num_date",num_date);
	for(let i=0; i<num_date; i++){
		let [date_val, date_text] = await getOption(frame,'#datePanel',i);
		// console.log("date_val:",date_val);
		if(!date_val) continue;
		await frame.select('#datePanel > select',date_val);

		let num_facilityType = await getNumOfOptions(frame,'#facilityTypePanel');
		for(let j=0; j<num_facilityType; j++){
			let [facilityType_val, facilityType_text] = await getOption(frame,'#facilityTypePanel',j);
			if(!facilityType_val) continue;
			await frame.select('#facilityTypePanel > select',facilityType_val);
			
			let num_sessionTime = await getNumOfOptions(frame,'#sessionTimePanel');
			for(let k=0; k<num_sessionTime; k++){
				let [sessionTime_val, sessionTime_text] = await getOption(frame,'#sessionTimePanel',k);
				if(!sessionTime_val) continue;
				await frame.select('#sessionTimePanel > select',sessionTime_val);		
			
				let num_area = await getNumOfOptions(frame,'#areaPanel');
				for(let l=0; l<num_area; l++){
					let [area_val, area_text] = await getOption(frame,'#areaPanel',l);
					if((!area_val)||(num_area>3 && l<num_area-2)) continue;
					await frame.select('#areaPanel > select',area_val);		
                    let num_venue = await getNumOfOptions(frame,'#preference1\\.venuePanel');
                    for(let m=0; m<num_venue; m++){
                        let [venue_val, venue_text] = await getOption(frame,'#preference1\\.venuePanel',m);
                        if(!venue_val) continue;
                        await frame.select('#preference1\\.venuePanel > select',venue_val);		
                        let num_location = await getNumOfOptions(frame,'#preference1\\.locationPanel');
                        for(let n=0; n<num_location; n++){
                            let [location_val, location_text] = await getOption(frame,'#preference1\\.locationPanel',n);
                            if(!location_val) continue;
                            await frame.select('#preference1\\.locationPanel > select',location_val);		
                            await pressContinue(frame);
                            await delayMs(1000);
                            await frame.waitForSelector("#searchResultTable");
                            csvAddRow(data_array);
                            csvAddColum(data_array, date_text, sessionTime_text, venue_text, location_text);
					        // break;
                        }
                        // break;
                    }
                    // break;
				}
				// break;		
			}
			// break;
		}
		// break;
	}
    console.log(data_array);






    // let dat_val = await frame.evaluate(() => {
    //     const example = document.querySelector('#datePanel');
    //     const example_options = example.querySelectorAll('option');
    //     let val;
    //     for(let node of example_options){
            
    //         val =  node.value
    //     }
    //     return val;
    // });
    // console.log("val:",dat_val);
    // await frame.evaluate(() => {
    //     Array.from(document.querySelector("#datePanel").options).forEach(function(option_element) {
    //         let option_text = option_element.text;
    //         let option_value = option_element.value;
    //         let is_option_selected = option_element.selected;
        
    //         // console.log('Option Text : ' + option_text);
    //         // console.log('Option Value : ' + option_value);
    //         // console.log('Option Selected : ' + (is_option_selected === true ? 'Yes' : 'No'));
        
    //         // console.log("\n\r");
    //     });
    // });
    console.log('end');

    // await newPage.close();
    // await page.close();
    // await browser.close();
    // console.log('result:'+captcha);

})();
