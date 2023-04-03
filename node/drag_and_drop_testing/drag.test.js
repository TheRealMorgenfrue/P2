// Terminal commands:
// npm install jest
// npm install puppeteer
//* npm install http-server -g
//* http-server
// npm test - runs all test files

//* Not necessary if you use file path and requires you to change some OS setting to allow scripts
const puppeteer = require('puppeteer');
const path = require('path');

async function dragAndDrop(page, source, target) {
    const sourceBB = await source.boundingBox(); // Box containing leftmost x coordinate, highest y and dimensions of element
    const targetBB = await target.boundingBox();

    await page.mouse.move(sourceBB.x + sourceBB.width / 2, sourceBB.y + sourceBB.height / 2); // Moves to the center of the source element
    await page.mouse.down();
    new Promise(r => setTimeout(r, 500)); // Replaces below function
    // await page.waitForTimeout(500); // This is deprecated for some reason

    await page.mouse.move(targetBB.x + targetBB.width / 2, targetBB.y + targetBB.height / 2, { steps: 20 }); // Moves to target
    new Promise(r => setTimeout(r, 50));

    await page.mouse.up(); // Releases element
}

test("Drags the car to the parking space", async () => {
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
    let page_dir = process.cwd(); 
    await page.goto(`file://${page_dir}`); // Go to correct URL  
    //await page.goto('http://localhost:8080/index.html'); // Default http, can be replaced with absolute file path
    await page.setViewport({width: 1080, height: 1024});

    const element = await page.waitForSelector("#car"); // querySelector for img of car
    const dest = await page.waitForSelector("#drop-zone"); // querySelector for drop-zone

    // Grabs car img and moves it to drop-zone
    await dragAndDrop(page, element, dest);

    const dest_img = await page.waitForSelector("#drop-zone");
    const parked_vehicle = await dest_img.$("img"); // Checks for image in drop-zone - $ works like waitForSelector (which works like querySelector) but doesn't get stuck if it can't find anything
    let vehicle_id = null;
    if(parked_vehicle !== null) { // Doesn't dereference null
         vehicle_id = parked_vehicle.id;
    }

    await page.screenshot({ path: 'after-drag.png' }); // Saves a screenshot before closing the browser

    await browser.close();
    expect(vehicle_id).toBe("car"); // Compares vehicle id to car img id
}, 10000);