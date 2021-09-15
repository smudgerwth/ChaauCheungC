const puppeteer = require('puppeteer-extra');
const StealthPlugin = require('puppeteer-extra-plugin-stealth')
const fs = require('fs');
const { PythonShell } = require('python-shell');
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
async function get_num_option(page, id) {
  return await page.evaluate(async (id) => {
    const node = document.querySelector(id);
    const node_options = node.querySelectorAll('option');
    return node_options.length;
  }, id);
}
async function get_n_th_option(page, id, index) {
  return await page.evaluate(async (id, index) => {
    const node = document.querySelector(id);
    const node_options = node.querySelectorAll('option');
    return node_options[index].value;
  }, id, index);
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
      // '--no-sandbox',
      // '--disable-setuid-sandbox',
      // '--disable-dev-shm-usage',
      // '--single-process',
      // '--incognito',
    ],
    // slowMo: 300, // slow down puppeteer script so that it's easier to follow visually
  });

  let [page] = await browser.pages();
  // page.on('console', consoleObj => console.log(consoleObj.text()));
  console.log('1');
  await page.goto('file://' + path.join(root, 'nonpeak.html'));
  console.log('2');
  // await page.waitForNavigation({waitUntil: 'networkidle0'});
  console.log('3');

  // elementHandle = await page.waitForSelector("frame[name='main']",{timeout:5000}).catch(error => console.log('failed to wait for the selector'));

  // let frame = await elementHandle.contentFrame();
  let frame = page;
  // console.log(frame)

  await frame.waitForSelector("#datePanel");

  let dat_val = await frame.evaluate(() => {
    const example = document.querySelector('#datePanel');
    const example_options = example.querySelectorAll('option');

    for (let [i, node] of example_options.entries()) {

      if (node.value) {
        // return example.selectedIndex;
        return node.value;
      }
    }
    return example_options;
  });
  console.log("val:", dat_val);
  console.log("num:", await get_num_option(frame, '#datePanel'));
  console.log("num:", await get_num_option(frame, '#facilityPanel'));
  console.log("num:", await get_num_option(frame, '#facilityTypePanel'));
  console.log("num:", await get_num_option(frame, '#sessionTimePanel'));
  console.log("val:", await get_n_th_option(frame, '#datePanel', 3));
  await frame.select('#datePanel > select', await get_n_th_option(frame, '#datePanel', 4))
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
