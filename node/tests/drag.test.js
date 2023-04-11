// Terminal commands:
// npm install jest
// npm install puppeteer
//* npm install jsdom - suggested by error with wrong testing environment
//* npm install http-server -g
//* http-server
// npm test - runs all test files

//* Not necessary if you use file path and requires you to change some OS setting to allow scripts
const puppeteer = require('puppeteer');
const path = require('path');
const {createArray} = require('../scripts/app_GE');
const math = require('../scripts/app_math');

test('createArray returns an array', () => {
    expect(createArray(2,2)).toBeInstanceOf(Object); // Example to check whether array is made correctly 
});


/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly 
AttachToParent - correct offset? 
Create event listener returns correct event listeners
*/

