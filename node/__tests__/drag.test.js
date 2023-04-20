// Terminal commands:
// npm install jest
//** npm install jest-environment-jsdom
//* npm install http-server -g
//* http-server
// npm test - runs all test files

//* Not necessary if you use file path and requires you to run Powershell as administrator and type in "set-executionpolicy remotesigned"
//** Suggested by error with wrong testing environment
import puppeteer from "puppeteer";
/* Brackets use named import, which allows multiple functions
 while no brackets expects "export default function_name", which only allows one
 */

test('Changes number of rows to 3 and writes "1" in cell (3,1)', async () => {
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

    const input_box = await page.waitForSelector("#row",{timeout:1000}); // Finds input box for rows
    const input_box_bounding_box = await input_box.boundingBox(); // boundingBox returns object containing first x and y coordinates of element and its width and height
    // Uses coordinates of bounding box and its size to locate coordinates of element center
    await page.mouse.click(input_box_bounding_box.x + input_box_bounding_box.width / 2, input_box_bounding_box.y + input_box_bounding_box.height / 2);
    await new Promise(r => setTimeout(r, 50)); // Waits for 50 ms
    await page.keyboard.type("3"); // Inputs a "3" into the input box for rows
    await new Promise(r => setTimeout(r, 50));
    await page.keyboard.press('Enter');
    await new Promise(r => setTimeout(r, 50));

    const cell = await page.waitForSelector("#gaussian_elimination_matrix_2\\,0", {timeout:1000});
    const cell_bounding_box = await cell.boundingBox();
    await page.mouse.click(cell_bounding_box.x + cell_bounding_box.width / 2, cell_bounding_box.y + cell_bounding_box.height / 2);
    await new Promise(r => setTimeout(r, 50));
    await page.keyboard.type("1");

    const value = await page.$eval('#gaussian_elimination_matrix_2\\,0', e => e.value); // Workaround from https://github.com/puppeteer/puppeteer/issues/3260
    expect(value).toBe("1");
},10000);

/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly 
AttachToParent - correct offset? 
Create event listener returns correct event listeners
*/

