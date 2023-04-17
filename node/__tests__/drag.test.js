// Terminal commands:
// npm install jest
// npm install puppeteer
//** npm install jest-environment-jsdom
//* npm install http-server -g
//* http-server
// npm test - runs all test files

//* Not necessary if you use file path and requires you to change some OS setting to allow scripts
//** Suggested by error with wrong testing environment

// const {createArray} = require('../scripts/app_GE'); // CommonJS import
import {createArray} from "../scripts/app_GE.js"; // ESM import.
/* Brackets use named import, which allows multiple functions
 while no brackets expects "export default function_name", which only allows one
 */

test('createArray returns an array', () => {
    expect(createArray(2,2)).toBeInstanceOf(Object); // Example to check whether array is made correctly 
});


/* FUNCTIONS THAT WE WANT TO TEST
createArray - Array is created and created correctly?
CreateTable - table is created and updated correctly 
AttachToParent - correct offset? 
Create event listener returns correct event listeners
*/

