'use strict'
/* 
******** Variable Case Explainer ********
Global:     VARIABLECASE / VARIABLE_CASE
Function:   variableCase / "N/A"
Objects:     VariableCase / "N/A"
Primitives:   "N/A"        / variable_case

*****************************************
*/
import {initDrag} from "./draganddrop.js";
import {updateTableFromArray} from "./rowoperations.js";
import {generateEquation} from "./app_math.js";

let CURRENT_TABLE;
// CURRENT_TABLE is an array of arrays (2D array). It is global since it'll be used across all functions 
// It is denoted as "backend array" in comments since it, at all times, contains the backend values of the table shown on screen - i.e. the frontend table
// Note that it still functions at the backend level; the values in it need to be written to the frontend by external means - e.g. element.value = CURRENT_TABLE[i][j]  

let ARRAY_CURRENT_TABLE = new Array(0); 
// Array used to contain copies of the backend array - ensures the user can go back to a previous iteration of the matrix - i.e. the table on the frontend
// It is global since it'll be used across all functions 

// A number of functions need to access non-writable values as well as update writable values - this object is therefore global.
const SETTINGS = new function() {  
   this.READONLY_SETTINGS = new function() {
        this.TBL_SETTINGS = new function() {
            this.table_id = "gaussian_elimination_matrix"; 
            this.max_input_length = 8;
            this.placeholder = "0";
            this.row_id = "row";       // This id refers to the input box where the user selects table dimensions, not the matrix
            this.column_id = "column"; // This id refers to the input box where the user selects table dimensions, not the matrix
            this.type = "number";      // This refers to the input box where the user selects table dimensions, not the matrix
            this.max_matrix_size = 15; // Ensure that matrix is small enough to be read by human users 
            this.min_matrix_size = 2;
            this.title = `Input desired size - max ${this.max_matrix_size}`;
        }
        this.BUTTON_SETTINGS = new function() {
            this.lock_button_id = "lockbutton";
            this.lock_button_value = "Lock";
            this.lock_button_type = "button";
            this.lock_Table = function() { lockTable(); };    // We can have functions as keys in objects by wrapping them in a function
            this.unlock_button_id = "unlockbutton";
            this.unlock_button_value = "Unlock";
            this.unlock_button_type = "button";
            this.unlock_Table = function() { unlockTable(); };
            this.clear_button_id = "clearbutton";
            this.clear_button_value = "Clear matrix";
            this.clear_button_type = "button";
            this.clear_Table = function() { clearTable(); };
            this.rewind_button_id = "rewindbutton";
            this.rewind_button_value = "Go back";
            this.rewind_button_type = "button";
            this.rewind_Table = function() { rewindTable(1); };
            this.randomize_button_id = "randomizebutton";
            this.randomize_button_value = "Randomize";
            this.randomize_button_type = "button";
            this.randomize_Table = function() { randomize_Table(); };
        }
    }
    this.WRITABLE = new function() {
        this.row_value = 2;
        this.column_value = 2;
        this.prev_row_value = 2;
        this.prev_column_value = 2;
    }
};

Object.freeze(SETTINGS.READONLY_SETTINGS);  // Make the "readonly_settings" object readonly


function initTableGE(tableID, element) {
    // Create a table and add it to the page
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");
    if(element){
        element.appendChild(table);
    } else {
        document.body.appendChild(table);
    }
    table.appendChild(tbody);
    
    // Set the table's ID if one is given
    if(tableID) {
        table.id = `${tableID}`;
    }
    resizeTableBody(tbody, SETTINGS.WRITABLE, "<input>");
    
    addEventListener("change", (event) => {
        // Validate input in the cell the user modified 
        console.log(`target value = ${event.target.value}`);
        let cell_value = event.target.value;
        let sanitized_cell_value = sanitize(cell_value);
        event.target.value = sanitized_cell_value;
    });
    getTableSize();
}
/**
 * Creates a 2D array and fills it with empty strings. 
 * 
 * This makes it easier to check for empty values later on.
 * @param {number} row_value 
 * @param {number} column_value  
 * @returns {array} 2D array
 */
function createArray(row_value, column_value) {
    let array = new Array(row_value);
    for (let i = 0; i < row_value; i++) {
      array[i] = new Array(column_value);
      for (let j = 0; j < column_value; j++) {
        array[i][j] = "";
      }
    }
    return array;
}
/**
 * Creates the frontend matrix used for Gaussian Elimination (represented as a table)
 * 
 * Additionally, it creates buttons to interact with the matrix
 * @param {number} row_value 
 * @param {number} column_value 
 * @returns 
 */
function createTable(row_value, column_value) {
    // Ensure matrix is defined, i.e. of dimension greater than or equal to minimum allowed (A matrix of size -1, for instance, is invalid).
    try {
        if(row_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size || 
            column_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size) {
            throw new Error(`Matrix size must be larger than or equal to ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}\n
            (Got row size = ${row_value}, column size = ${column_value}).`);
        }
    } 
    catch (error) {
        console.error(error);
        return;
    }
    // Ensure that table element is created and can be found by id 
    const body = document.body, 
    table = document.createElement('table');
    table.id = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id;
    
    // Ensure that each row is inserted and can be found by id 
    for (let i = 0; i < row_value; i++) {   
        const table_row = table.insertRow(); // Note: predefined method for inserting row in table
        table_row.id = `${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i}`;
        // initDrag(tr); // Make rows draggable - Decomment when draganddrop.js import is done correctly 
        for (let j = 0; j < column_value; j++) { 
            const table_data = table_row.insertCell(); // Note: predefined method for inserting columns (cells) in table
            
            // Create input elements to the matrix and set applicable attributes
            const table_data_input = document.createElement('input');
            table_data_input.placeholder = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.placeholder;
            table_data_input.maxLength = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_input_length;
            table_data_input.id = `${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`; // The cell ID is indexed from 0 in order to be used with array indices

            // Add eventlisteners to the input field of each cell element
            createEventListener(table_data_input, "click");
            createEventListener(table_data_input, "tbl_change");

            table_data_input.classList.add("tblCells"); // Apply the CSS class defined in the CSS file
            table_data.appendChild(table_data_input);
            }
        }
    table.classList.add("tbl"); // Add class to ensure CSS-styling can be applied correctly
    body.appendChild(table);
    addTableButtons();
} 

/**
 * Create two input buttons separated by an "x" string.
 *  
 * Event listeners are added to each of the buttons that change the SETTINGS.WRITABLEs for the current table to match the row and column value input by the user. 
 */
function getTableSize() {
    const body = document.body;

    // Object to add attributes with a variable. This compresses the code to Input.id (instead of having to write e.g. 'row.id' and 'column.id')
    const Input = {
        row: document.createElement('input'),
        column: document.createElement('input')
    };
    // Span used to avoid unintended behaviour with CSS when moving a 'div' where the 'x' does not move with the rest of the buttons.
    const span = document.createElement("span"); 

    // Formats input boxes as "${rows} x ${columns}"
    const cdot = document.createTextNode(' x ');

    // In order to apply CSS to a TextNode it has to be a child of an element where CSS can be applied, e.g. 'span'
   

    // Add two classes to cdot to ensure correct CSS-styling 
    span.classList.add("tbl", "inputbox");  

    // Adds attributes to row and column elements.
    // Do NOT use the global row_id here instead of "row" (equivalent for columns). 
    // That could cause a serious issue with the definition of 'row' and 'column' in the 'Input' object
    addAttributes("row", Input);
    addAttributes("column", Input);

    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.row);
    body.appendChild(cdot);
    body.appendChild(Input.column);

    // Make eventlisteners for row and column elements
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "row_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "column_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "click");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "click");
}
/**
 * Helper function for getTableSize() that adds various attributes to row and column objects that are part of the "Input" object. 
 * @param {string} type 
 * @param {object} Input 
 */
function addAttributes(type, Input) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object
    Input[`${type}`].id = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS[`${type}_id`];
    Input[`${type}`].title = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.title;
    Input[`${type}`].value = SETTINGS.WRITABLE[`${type}_value`];
    Input[`${type}`].type = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.type;
    Input[`${type}`].max = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size;
    Input[`${type}`].min = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size;
    Input[`${type}`].classList.add("tbl", "inputBox"); // Ensure that buttons follow table when table is moved or manipulated
}
/**
 * Add an event listener to the element with type_id 
 * @param {string|object} type_id
 * @param {string} listener_type 
 * @returns 
 */
function createEventListener(type_id, listener_type, table) {
    try {   // Catch all errors in the function 
        let element,
        element_value;
        try {
            if(!type_id) { // Catch errors where elements are undefined or null
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${type_id}.`);
            }
            else if(!listener_type) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${listener_type}.`);
            }
        } 
        catch (error) {
            console.error(error);
            return;
        }

        // type_id is an object (arrays are objects too, but we don't want those)
        if (typeof type_id === 'object' && !Array.isArray(type_id)) { // Only set element when type is not an array object
            element = type_id;
        }
        else { // type_id is NOT an object but the actual id string 
            element = document.getElementById(type_id);
            if(!element) {
                throw new Error(`getElementById returned ${element} with ID ${type_id}. Was the ID mistyped or does it not exist?`);
            }
        }
    
        switch(listener_type) {
            // This case handles interaction with the input boxes where the user can define the table's dimensions 
            case "row_change": {
                element.addEventListener("change", (event) => {
                    SETTINGS.WRITABLE.row_value = Number(event.target.value); // Convert to number since strings behave weird with logical operators
                    resizeTableBody(document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id), SETTINGS.WRITABLE, "<input>");
                });   
                break;
            } 
            case "column_change": {
                element.addEventListener("change", (event) => {
                    SETTINGS.WRITABLE.column_value = Number(event.target.value); // Convert to number since strings behave weird with logical operators
                    resizeTableBody(document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id), SETTINGS.WRITABLE, "<input>");
                });   
                break;
            }
            // This case is a generic event handler that auto-marks the value in the field of a clicked element
            case "click": {
                element.addEventListener("click", (event) => {
                    element.focus(); // Make sure the clicked element is focused. Most, but not all, browsers/versions automatically do this. This way, it's always done
                    element.select(); // Auto-mark the value in the field   
                });   
                break;
            }
            // listener_type was wrongly specified
            default:
                throw new Error(`Tried to add an event listener called '${listener_type}' to element ID/object '${type_id}', however: No such event listener exists.`);
        }
    } 
    catch (error) {
        console.error(error);
        return;        
    }
}
/**
 * Copies the current table object in the case that changes have been made to it 
 */
function copyTable() {
    // Make sure that the holding array actually contains something
    if(ARRAY_CURRENT_TABLE.length > 0) {
        // Make sure that what is inserted does not already exist in the holding array
        if(JSON.stringify(CURRENT_TABLE) !== ARRAY_CURRENT_TABLE[ARRAY_CURRENT_TABLE.length-1]) {
            // Make it a JSON object to prevent the 2D table array from being split up when retrieved from the container array
            ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));
        }
        else {
            console.warn(`Previous matrix snapshot is identical to the current - abort copy`);
        }
    }
    else {
        // When the holding array is empty, a copy of the backend array is always inserted into the holding array
        ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));
    }
}
/**
 * Reverts the values of the current frontend table to match a previous instance of the frontend table.
 * 
 * Uses the holding array to store/retrieve all previous matrix instances.
 * @param {number} rewind_count Number of matrix instances to go back, starting from the current "matrix" in the backend array.
 * @returns
 */
function rewindTable(rewind_count) {
    rewind_count = Number(rewind_count); // Convert to a number just in case

    // Make sure the array actually contains something
    if(ARRAY_CURRENT_TABLE.length > 0) {
        // Check if the array is large enough to go back "rewind_count" times   
        if(rewind_count < ARRAY_CURRENT_TABLE.length) {
            // Go back "rewind_count" times in the holding array amd remove all succeeding elements - e.g. [1,2,3,4,5] with rewind_count = 2 becomes [1,2,3] 
            ARRAY_CURRENT_TABLE.splice(ARRAY_CURRENT_TABLE.length-rewind_count, rewind_count);

            // Read the current last index. Array.pop() is not used here, since we don't want to delete the last element (as it contains the current table values) 
            CURRENT_TABLE = JSON.parse(ARRAY_CURRENT_TABLE.slice(ARRAY_CURRENT_TABLE.length-rewind_count));

            // Testing 
            console.table(ARRAY_CURRENT_TABLE);
            console.table(CURRENT_TABLE);
        }
        else {
            console.warn(`Array has length ${ARRAY_CURRENT_TABLE.length}. Going back ${rewind_count} would cause the array to underflow`);
        }
        // Update the values of the current table's dimensions
        SETTINGS.WRITABLE.row_value = CURRENT_TABLE.length; // Gets row length by accessing the outer array, e.g. what's marked with '' in a 2x2 array: ['[0,1],[0,1]']
        SETTINGS.WRITABLE.column_value = CURRENT_TABLE[0].length; // Gets column length by accessing the inner array, e.g. what's marked with '' in a 2x2 array: [['0,1'],[0,1]]

        // Update the values of the previous table's dimensions 
        // These are identical to the current dimensions since the retrieved matrix instance is a previous of all matrices made after it
        SETTINGS.WRITABLE.prev_row_value = SETTINGS.WRITABLE.row_value; 
        SETTINGS.WRITABLE.prev_column_value = SETTINGS.WRITABLE.column_value;
        
        // Update table dimensions on the frontend
        updateTableDimensions();

        // Catch potential errors related to accidentally accessing the array out of bounds
        try {
            // Nested for-loops to access two-dimensional arrays
            for(let i = 0; i < SETTINGS.WRITABLE.row_value; i++) {  
                for(let j = 0; j < SETTINGS.WRITABLE.column_value; j++) {
                    // Make sure the array is accessed within it's bounds
                    if(CURRENT_TABLE[i][j] !== undefined) {
                        // Get the ID the cell in the frontend table which will be updated - provided it exists 
                        let cell = document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`);

                        // Prevent accessing a cell that doesn't exist
                        if(cell !== null) {
                            // Update the cell on the frontend table with the one from the backend array
                            cell.value = CURRENT_TABLE[i][j];
                        }
                    }
                }
            }
            // Testing
            // console.log(`LENGTH: ${CURRENT_TABLE.length},${CURRENT_TABLE[0].length}`);
        } 
        catch (error) {
            console.error(error);
            return;
        }
    }
    else {
        console.warn(`Array underflow!: Array has length ${ARRAY_CURRENT_TABLE.length}`);
    }
}
/**
 * Function that creates buttons to interact with the table (but NOT those to change its size)
 * 
 * Does so via an eventlistener
 */
function addTableButtons() {
    // Object that contains the button's element type. This compresses the code to Input.id (instead of having to write e.g. 'lock_button.id' and 'unlock_button.id')
    const Input = {
        body: document.body,
        tbl: document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}`),
        lock_button: document.createElement("input"),
        unlock_button: document.createElement("input"),
        clear_button: document.createElement("input"),
        rewind_button: document.createElement("input"),
        randomize_button: document.createElement("input")
    };

    // Do NOT use the global id for the buttons here. 
    // That could cause a serious issue with the definition in the 'Input' object
    addButtonAttributes("lock", Input);
    addButtonAttributes("unlock", Input);   
    addButtonAttributes("clear", Input);
    addButtonAttributes("rewind", Input);
    addButtonAttributes("randomize", Input);
}
/**
 * Helper function to addTableButtons() that adds attributes/event listeners to the buttons and places them after the table 
 */
function addButtonAttributes(type, Input) {
    Input[`${type}_button`].id = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_id`];       // Set its ID
    Input[`${type}_button`].value = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_value`]; // Set its value
    Input[`${type}_button`].type = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_type`];   // Make it a "button" type
    Input[`${type}_button`].classList.add("tbl", "buttons"); // Add CSS
    Input.body.after(Input.tbl, Input[`${type}_button`]);    // Add to body after the table
    Input[`${type}_button`].addEventListener("click", SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_Table`]); // Add EventListener
}
/**
 * Helper function for the "lock" button that sets all cells in the table to read only
 */   
function lockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id);
    const table_rows = tbl.querySelectorAll("input");

    // Since this function sets all elements in table to "readonly", only the first element in the "table_rows" array has to be checked 
    if(table_rows[0].getAttribute("readonly") !== "true") {
        table_rows.forEach(element => {
            element.setAttribute("readonly", "true");
        });
        console.log("Table is now locked");
    }
    else {
        console.warn("Table is already locked");
    }
}
/**  
 * Helper function for the "unlock" button that makes all cells in the table writeable again
 */
function unlockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id);
    const table_rows = tbl.querySelectorAll("input");

    // Since lockTable() sets all elements to readonly, only the first element in the "table_rows" array has to be checked 
    if(table_rows[0].getAttribute("readonly") === "true") {
        table_rows.forEach(element => {
            element.removeAttribute("readonly");
        });
        console.log("Table is now unlocked");
    }
    else {
        console.warn("Table is already unlocked");
    }
}
/**
 * Replaces all cell values on both front and backend with the empty string ""
 */
function clearTable() {
    // Catch potential errors related to accidentally accessing the array out of bounds
    try {
        // Nested for-loops to access two-dimensional arrays
        for(let i = 0; i < SETTINGS.WRITABLE.row_value; i++) {
            for(let j = 0; j < SETTINGS.WRITABLE.column_value; j++) {
                // Clear the backend array
                CURRENT_TABLE[i][j] = "";

                // Get the ID the cell in the frontend table which will be updated - provided it exists 
                let cell = document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`);

                // Prevent accessing a cell that doesn't exist
                if(cell !== null) {
                    // Update the cell on the frontend table with the one from the backend array - i.e. "" (empty string)
                    cell.value = CURRENT_TABLE[i][j];
                }
            }
        }
    } 
    catch (error) {
        console.warn(error);
    }
}
/**
 * Removes all undesired characters from a string given. 
 * @param {string} str 
 * @returns {string} Where all undesired characters have been removed. 
 */
function sanitize(str){
    let negation_operator = "";
    // Keep any negative scalars in input 
    if(str[0] === "-"){
        negation_operator = "-";
    };
    str = str
    .replace(/[^0-9]/g, "").trim();
//   .replace(/&/g, "")
//   .replace(/</g, "")
//   .replace(/>/g, "")
//   .replace(/"/g, "")
//   .replace(/'/g, "")
//   .replace(/`/g, "")
    return `${negation_operator}`+ `${str}`;
}

function randomize_Table() {
    CURRENT_TABLE = generateEquation(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);
    restoreTable(true);
}

//we assume the table has at least one tbody if a tbody is not passed as that argument
//should be compatible with updateTableFromArray

//table is the HTML-element of type "table" or "tbody" that should be resized

//dimensions is an object with attributes "rows" and "columns"
//which represent the number of rows and columns to table should be resized to have

//HTMLcode is a string of HTML-code that will be placed in every cell this function creates
function resizeTableBody(table, dimensions, HTMLcode){
    try{
        //make sure we're dealing with a table or tbody
        if(table.tagName.toUpperCase() !== "TABLE" && table.tagName.toUpperCase() !== "TBODY"){
            throw new Error(`Argument "table" is not a table- or tbody-element.`)
        }
        //check if the dimensions are correctly defined
        if(!dimensions){
            throw new Error("Dimensions object not defined!");
        }
        if(isNaN(dimensions.row_value) || isNaN(dimensions.column_value) || dimensions.row_value < 0 || dimensions.column_value < 0){
            throw new Error(`Dimension values not defined correctly.\nrowNumber is ${dimensions.row_value} and columnNumber is ${dimensions.column_value}`);
        }
        //define HTML-code to be placed in new cells
        if(!HTMLcode || typeof HTMLcode !== "string"){
            HTMLcode = "";
        }
        //if the table is not a tbody, we need to get a tbody first
        if(table.tagName.toUpperCase() === "TABLE"){
            table = table.querySelector("tbody");
            console.log("Modifying first tbody in table")
        }
        //get an iterable refence to the rows
        let tableRows = table.querySelectorAll("tr");
        
        //define arrays for the elements we add or remove
        const changes = {
            trAdded: [],
            trRemoved: [],
            tdAdded: [],
            tdRemoved: []
        };
        //initialise the number of cells we need to add for various operations
        //we can use this variable for both row- and column-changes
        let cellsNeeded = 0;

        //add or remove rows if requested
        console.log(`Need to add ${dimensions.row_value - tableRows.length} rows`);
        if(tableRows.length < dimensions.row_value){
            //we need to add rows, since the requested number of rows is larger than the current number of rows
            //first we find the number of columns we need to add to the new rows
            if(table.lastElementChild){
                cellsNeeded = table.lastElementChild.querySelectorAll("td").length;
            } else {
                cellsNeeded = 0;
            }
            //then we add a number of rows equal to the difference between the current row count and the requested row count
            for (let i = 0; i < (dimensions.row_value - tableRows.length); i++) {
                const newRow = document.createElement("tr");
                table.appendChild(newRow);

                //add the row to our list of changes
                changes.trAdded.push(newRow);
                
                /*Turns out we didn't need this, since the column-adding code below does it for us
                    HOWEVER, if all rows are the same length, this could be readded and the column-adding code could be simplified...
                for (let j = 0; j < cellsNeeded; j++) {
                    const newCell = document.createElement("td");
                    newCell.innerHTML = HTMLcode;
                    newRow.appendChild(newCell);
                }
                */
            }
        } else if(tableRows.length > dimensions.row_value){
            //we need to remove rows
            //so we delete a number of rows equal to the difference between the current row count and the requested row count
            for (let i = 0; i < (tableRows.length - dimensions.row_value); i++) {
                //we use removeChild because it returns a reference to the removed element
                const removedRow = table.removeChild(table.lastElementChild);

                //add the removed row to our list of changes
                //note that it still exists even if it is no longer in the DOM!
                changes.trRemoved.push(removedRow);
            }
        }
        console.log(`Added rows: ${changes.trAdded} Removed rows: ${changes.trRemoved}`);
        //done adding or removing rows
        //we update our list of rows before moving on to columns if we did something with the rows
        if(dimensions.row_value - tableRows.length !== 0){
            tableRows = table.querySelectorAll("tr");
        };
        //add or remove columns if needed. It is important to do this after adding or removing any rows
        //we do this for every row to ensure we end up with the same number of columns in every row
        tableRows.forEach(row => {
            cellsNeeded = dimensions.column_value - row.querySelectorAll("td").length;
            console.log(`Need ${cellsNeeded} cells on this row`);
            if(cellsNeeded > 0){
                for (let i = 0; i < cellsNeeded; i++) {
                    const newCell = document.createElement("td");
                    newCell.innerHTML = HTMLcode;
                    row.appendChild(newCell);

                    //add the cell to our list of changes
                    changes.tdAdded.push(newCell);
                }
            } else if(cellsNeeded < 0){
                for (let i = cellsNeeded; i < 0; i++) {
                    //once again using removeChild to get a reference to the element
                    const removedCell = row.removeChild(row.lastElementChild);
                    
                    //add the cell to our list of changes
                    changes.tdRemoved.push(removedCell);
                }
            }
        });
        console.log(`Added cells: ${changes.tdAdded} Removed cells: ${changes.tdRemoved}`);
        //we're finally done adding and removing things, so we return our changes-object
        return changes;
    } catch(error) {
        console.error(error)
        return null;
    }
    
}

//convert an HTML-table or tbody into an array of arrays of its elements and return it
//returns null if the input is not a table or tbody
function convertTableToArray(table){
    try{
        //make sure we're dealing with a table or a tbody
        if(table.tagName.toUpperCase() !== "TABLE" && table.tagName.toUpperCase() !== "TBODY"){
        throw new Error(`Argument "table" is not a table or tbody`);
        }
        //initialise the main array
        const array = [];
        //create a subarray for every row, fill it with the cells in that row
        //and push the subarray to the main array
        table.querySelectorAll("tr").forEach(row => {
            const subArray = [];
            row.querySelectorAll("td").forEach(cell => {
                subArray.push(cell);
            })
            array.push(subArray);
        });
        return array;
    } catch(error){
        console.error(error);
        return null;
    }
    
}

// Running The Program
// Adding an event listener to window with type "load" ensures that the script only begins when the page is fully loaded (with CSS and everything)
window.addEventListener("load", (event) => {
    initTableGE(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id);
});


// Export function(s) to test suite (brackets matter, see drag.test.js)
export {createArray, sanitize};