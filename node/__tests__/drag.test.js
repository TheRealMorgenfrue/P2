// Terminal commands:
// npm install jest
//* npm install http-server -g
//* http-server -c-1
// npm test - runs all test files

//* Not necessary if you use file path and requires you to run Powershell as administrator and type in "set-executionpolicy remotesigned"
//* -c-1 disables caching
import puppeteer from "puppeteer";
/* Brackets use named import, which allows multiple functions
 while no brackets expects "export default function_name", which only allows one
*/

/**
 * Finds element by its id, clicks its center and types a message
 * @param {Page} page
 * @param {string} element_id
 * @param {string} input
 * @returns {Promise<void>}
 */
async function clickAndType(page, element_id, input) {
    await clickElement(page, element_id);
    await page.keyboard.type(`${input}`);
}

/**
 * Finds element by its id and clicks its center
 * @param {Page} page
 * @param {string} element_id
 * @returns {Promise<void>}
 */
async function clickElement(page, element_id) {
    // Gets object consisting of x, y, width and height of HTML element
    const element_bounding_box = await (await page.waitForSelector(`${element_id}`, {timeout: 1000})).boundingBox();
    // Clicks center of element from bounding box
    await page.mouse.click(element_bounding_box.x + element_bounding_box.width / 2, element_bounding_box.y + element_bounding_box.height / 2);
}

/**
 * Workaround for getting value of element
 * From https://github.com/puppeteer/puppeteer/issues/3260
 * @param {Page} page
 * @param {string} element_id
 * @returns {Promise<*>}
 */
async function getVal(page, element_id) {
    return await page.$eval(`${element_id}`, e => e.value);
}

test('Changes number of rows to 3 and writes "1" in cell (2,0)', async () => {
/*
    const browser = await puppeteer.launch(
    { // Shows the actual browser inputs
        headless: false,
        slowMo: 80,
        args: ['--window-size=1080,1024']
    });
*/
    const browser = await puppeteer.launch();
    // Opens Chromium browser
    const page = await browser.newPage();
    await page.goto("http://localhost:8080/node/PublicResources/html_pages/index.html");
    await page.setViewport({width: 1080, height: 1024});

    await clickAndType(page, "#row", "3");
    await page.keyboard.press('Enter');

    await clickAndType(page, "#gaussian_elimination_matrix_2\\,0", "1");

    const value = await getVal(page, '#gaussian_elimination_matrix_2\\,0');

    await browser.close();
    expect(value).toBe("1");
},10000);

test('Locks table and tries to input a number in cell (0,0)', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto("http://localhost:8080/node/PublicResources/html_pages/index.html");
    await page.setViewport({width: 1080, height: 1024});

    await clickElement(page, "#lockbutton");

    await clickAndType(page, "#gaussian_elimination_matrix_0\\,0", "10")

    const cell = await getVal(page, '#gaussian_elimination_matrix_0\\,0');
    await browser.close();
    expect(cell).toBe("");
});

test('Adds a value to cell (0,0), then uses clear button and checks value in cell (0,0)', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/node/PublicResources/html_pages/index.html');
    await page.setViewport({width: 1080, height: 1024});

    await clickAndType(page, '#gaussian_elimination_matrix_0\\,0', "10");

    await clickElement(page, "#clearbutton")

    const cell_value = await getVal(page, '#gaussian_elimination_matrix_0\\,0');
    await browser.close();
    expect(cell_value).toBe("");
});

/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly 
AttachToParent - correct offset? 
Create event listener returns correct event listeners
*/

