// Terminal commands:
// npm install jest
// npm install puppeteer
//** npm install jest-environment-jsdom
//* npm install http-server -g
//* http-server
// npm test - runs all test files

//* Not necessary if you use file path and requires you to run Powershell as administrator and type in "set-executionpolicy remotesigned"
//** Suggested by error with wrong testing environment

// const {createArray} = require('../scripts/app_GE'); // CommonJS import
import {createArray} from "../scripts/app_GE.js"; // ESM import.
/* Brackets use named import, which allows multiple functions
 while no brackets expects "export default function_name", which only allows one
 */
import puppeteer from "puppeteer";

test('createArray returns an array', () => {
    expect(createArray(2,2)).toBeInstanceOf(Object); // Example to check whether array is made correctly 
});

test('Changes number of rows to 3 and writes "1" in cell (3,1)', async () => {
    const browser = await puppeteer.launch();
    // Opens Chromium browser
    const page = await browser.newPage();
    await page.goto("http://localhost:8080/node/PublicResources/html_pages/index.html");
    await page.setViewport({width: 1080, height: 1024});

    const input_box = await page.waitForSelector("#row"); // Finds input box for rows
    const input_box_bounding_box = await input_box.boundingBox();
    await page.mouse.click(input_box_bounding_box.x + input_box_bounding_box.width / 2, input_box_bounding_box.y + input_box_bounding_box.height / 2);
    new Promise(r => setTimeout(r, 50)); // Waits for 50 ms
    await page.keyboard.type("3"); // Inputs a "3" into the input box for rows
    new Promise(r => setTimeout(r, 50));
    await page.keyboard.press('Enter');
    new Promise(r => setTimeout(r, 50));

    const cell =  await page.waitForSelector("#gaussian_elimination_matrix_2,0")
    const cell_bounding_box = await cell.boundingBox();
    await page.mouse.click(cell_bounding_box.x + cell_bounding_box.width / 2, cell_bounding_box.y + cell_bounding_box.height / 2);
    new Promise(r => setTimeout(r, 50));
    await page.keyboard.type("1");

    const value = cell.$("value");
    expect(value).toBe("1");
    });

/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly 
AttachToParent - correct offset? 
Create event listener returns correct event listeners
*/

