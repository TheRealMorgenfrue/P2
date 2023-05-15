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
 *
 * @param {Page} page
 * @returns {Promise<*[]>} 2D array of cells
 */
async function tableToArray(page) {
    const table = await page.waitForSelector("#gaussian_elimination_matrix", {timeout: 1000});
    const array = [];
    let rows = await table.$$("tr");
    for (let row of rows) {
        const subArray = [];
        let cells = await row.$$("td");
        for (let cell of cells) {
            subArray.push(cell);
        }
        array.push(subArray);
    }
    return array;
}

/**
 * Finds element by its id, clicks its center and types a message
 * @param {Page} page
 * @param {ElementHandle} cell
 * @param {string} input
 * @returns {Promise<void>}
 */
async function clickAndType(page, cell, input) {
    await clickElement(page, cell);
    await page.keyboard.type(`${input}`);
}

/**
 * Finds element by its id, clicks its center and types a message
 * @param {Page} page
 * @param {string} querySelector
 * @param {string} input
 * @returns {Promise<void>}
 */
async function clickAndTypeID(page, querySelector, input) {
    await clickElementID(page, querySelector);
    await new Promise(r => setTimeout(r, 100));
    await page.keyboard.type(`${input}`);
}

/**
 * Finds element by its id and clicks its center
 * @param {Page} page
 * @param {ElementHandle} cell
 * @returns {Promise<void>}
 */
async function clickElement(page, cell) {
    // Gets object consisting of x, y, width and height of HTML element
    const element_bounding_box = await cell.boundingBox();
    // Clicks center of element from bounding box
    await page.mouse.click(element_bounding_box.x + element_bounding_box.width / 2, element_bounding_box.y + element_bounding_box.height / 2);
}

/**
 * Finds element by its id and clicks its center
 * @param {Page} page
 * @param {string} querySelector
 * @returns {Promise<void>}
 */
async function clickElementID(page, querySelector) {
    // Gets object consisting of x, y, width and height of HTML element
    const element_bounding_box = await (await page.waitForSelector(`${querySelector}`, {timeout: 1000})).boundingBox();
    // Clicks center of element from bounding box
    await page.mouse.click(element_bounding_box.x + element_bounding_box.width / 2, element_bounding_box.y + element_bounding_box.height / 2);
}

/**
 * Workaround for getting value of element
 * From https://github.com/puppeteer/puppeteer/issues/3260
 * @param {Page} page
 * @param {string} querySelector
 * @returns {Promise<*>}
 */
async function getValID(page, querySelector) {
    const cell = await page.$(`${querySelector}`);
    const input = await cell.$("input");
    return await page.evaluate(e => e.value, input);
}

async function addScaledRow(page, row, added_row, scalar) {
    await page.hover(`${row}`);
    await clickElementID(page, "#add_button_id");
    await clickElementID(page, `${added_row}`);
    await page.hover("#row_holder_id");
    await clickElementID(page, "#row_holder_id");
    await new Promise(r => setTimeout(r, 100));
    // Scale row in add-field
    await clickElementID(page, "#safe_scale_input");
    await page.keyboard.press("Backspace");
    await page.keyboard.type(`${scalar}`);
    // Add cells
    await clickElementID(page, "#safe_scale_button");
    await clickElementID(page, "#go_button_id");
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

    await clickAndTypeID(page, "#row", "3");
    await page.keyboard.press('Enter');

    const table = await tableToArray(page);
    await clickAndType(page, table[2][0], "1");

    await clickElementID(page, "#confirmbutton");

    const value = await getValID(page, "#gaussian_elimination_matrix_2\\,0");

    await browser.close();
    expect(value).toBe("1");
},10000);

test('Adds a value to cell (0,0), then uses reset button and checks value in cell (0,0)', async () => {
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/node/PublicResources/html_pages/index.html');
    await page.setViewport({width: 1080, height: 1024});

    const table = await tableToArray(page);
    await clickAndType(page, table[0][0], "10");

    await clickElementID(page, "#resetbutton");
    await clickElementID(page, "#confirmbutton");

    const cell_value = await getValID(page, '#gaussian_elimination_matrix_0\\,0');
    await browser.close();
    expect(cell_value).toBe("");
});

test('Generates a matrix [[1,2,3],[1,5,3],[2,4,6]] and attempts to solve it', async () => {
    /*
    const browser = await puppeteer.launch(
        { // Shows the actual browser inputs
            headless: false,
            slowMo: 50,
            args: ['--window-size=1080,1024']
        });
     */
    const browser = await puppeteer.launch();
    const page = await browser.newPage();
    await page.goto('http://localhost:8080/node/PublicResources/html_pages/index.html');
    await page.setViewport({width: 1080, height: 1024});

    // Set dimensions
    await clickAndTypeID(page, "#row", "3");
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 100));
    await clickAndTypeID(page, "#column", "3");
    await page.keyboard.press('Enter');

    // Type row 1
    const table = await tableToArray(page);
    await clickAndType(page, table[0][0], "1");
    await clickAndType(page, table[0][1], "2");
    await clickAndType(page, table[0][2], "3");
    // Type row 2
    await clickAndType(page, table[1][0], "1");
    await clickAndType(page, table[1][1], "5");
    await clickAndType(page, table[1][2], "3");
    // Type row 3
    await clickAndType(page, table[2][0], "2");
    await clickAndType(page, table[2][1], "4");
    await clickAndType(page, table[2][2], "6");

    // Click confirm
    await clickElementID(page, "#confirmbutton");
    await new Promise(r => setTimeout(r, 100));

    // Add -1 row 1 to row 2
    await addScaledRow(page,"#gaussian_elimination_matrix_1", "#gaussian_elimination_matrix_0", -1);

    // Add -2 row 1 to row 3
    await addScaledRow(page,"#gaussian_elimination_matrix_2", "#gaussian_elimination_matrix_0", -2);

    const isRowEchelon = await page.$("#row_echelon_msg");
    await browser.close();
    expect(isRowEchelon).toBeDefined();
},25000);

/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly
AttachToParent - correct offset?
Create event listener returns correct event listeners
*/