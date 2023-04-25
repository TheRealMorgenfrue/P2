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
import {addAllScaleButtons, updateTableFromArray} from "./rowoperations.js";
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

/**
 * Create the initial table to be manipulated by the user - The front and backend parts of the system 
 */
function initTable() {
    // Initialize the 2D backend array that'll hold the values from the frontend table
    CURRENT_TABLE = createArray(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);

    // Initialise the holding array so that index 0 contains the initial backend array - i.e. the frontend table's values just after webpage load
    ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));
    
    // Initialize frontend table when webpage is first loaded (Normally done by eventlisteners but they aren't triggered at webpage load)
    createTable(Number(SETTINGS.WRITABLE.row_value), Number(SETTINGS.WRITABLE.column_value));

    // Initialize the input fields to change the dimensions of the array
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
 * Remove all cells that are associated with the current table 
 */
function deleteTable() {
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS.lock_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS.unlock_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS.clear_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS.rewind_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS.randomize_button_id}`);
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
    const cdot_span = document.createElement("span"); 

    // Formats input boxes as "${rows} x ${columns}"
    const cdot = document.createTextNode(' x ');

    // In order to apply CSS to a TextNode it has to be a child of an element where CSS can be applied, e.g. 'span'
    cdot_span.appendChild(cdot);

    // Add two classes to cdot to ensure correct CSS-styling 
    cdot_span.classList.add("tbl", "inputbox");  

    // Adds attributes to row and column elements.
    // Do NOT use the global row_id here instead of "row" (equivalent for columns). 
    // That could cause a serious issue with the definition of 'row' and 'column' in the 'Input' object
    addAttributes("row", Input);
    addAttributes("column", Input);

    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.row);
    body.appendChild(Input.column);

    // insertBefore() can be used to insert an element before another element (this way you can place it whereever in the code - as opposed to appendChild())
    body.insertBefore(cdot_span, Input.column); 

    // Make eventlisteners for row and column elements
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "tblsize_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "tblsize_change");
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
    Input[`${type}`].classList.add("tbl", "inputBox"); // Ensure that buttons follow table when table is moved or manipulated
}
/**
 * Add an event listener to the element with type_id 
 * @param {string|object} type_id
 * @param {string} listener_type 
 * @returns 
 */
function createEventListener(type_id, listener_type) {
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
            // This case handles user interaction with the frontend table's cells
            case "tbl_change": {
                element.addEventListener("change", (event) => {
                    // Validate input in the cell the user modified 
                    const cell_id = event.target.id;
                    console.log(`target value = ${event.target.value}`);
                    let cell_value = event.target.value;
                    let sanitized_cell_value = sanitize(cell_value);
                    event.target.value = sanitized_cell_value;
                    
                    // Do not store the sanitized input in the backend array if it is an empty string 
                    if(sanitized_cell_value !== "") {
                        // Get the ID of the cell the user modified (ID = i,j)
                        const i = cell_id.match(/\d+(?=\,)/);
                        const j = cell_id.match(/\d+$(?!\,)/);
                        
                        // Testing
                        console.log(`ID is ${cell_id} ::: i = ${i} :::: j = ${j}`);     
                        
                        // Do not store the sanitized input in the backend array if an identical value is already there
                        if(CURRENT_TABLE[i][j] !== sanitized_cell_value) {    
                            CURRENT_TABLE[i][j] = Number(sanitized_cell_value);
    
                            // Show detailed info about the backend array - used for testing
                            console.log(`Array: [${CURRENT_TABLE}] :::: Value stored: '${CURRENT_TABLE[i][j]}'`);
                            console.table(CURRENT_TABLE);
                        }  
                    }
                    // Store a copy of the backend array in the holding array - enables the user go to back to this copy in the future
                    copyTable();
                });   
                break;
            }
            // This case handles interaction with the input boxes where the user can define the table's dimensions 
            case "tblsize_change": {
                element.addEventListener("change", (event) => {
                    element_value = event.target.value; // Get the value of the cell that the user typed to

                    // Update the values of the previous table's dimensions to match the values of the current table 
                    // Since a new table will be generated, the dimensions of the current table correspond to the previous dimensions of the new table  
                    SETTINGS.WRITABLE.prev_row_value = SETTINGS.WRITABLE.row_value; 
                    SETTINGS.WRITABLE.prev_column_value = SETTINGS.WRITABLE.column_value;

                    // Ensure that user does not input dimensions that exceed the maximum dimensions allowed for the table
                    if(element_value > SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) which is larger than max allowed (${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size}).\nResetting size to: ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size}.`);
                        element_value = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size;
                    }
                    // Ensure that the user does not input dimensions below the minimum allowed for the table
                    else if(element_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) is smaller than min allowed (${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}).\nResetting size to: ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}.`);
                        element_value = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size;
                    }
                    // Check if the user altered the input box for rows 
                    if(type_id === SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id) {     
                        SETTINGS.WRITABLE.row_value = Number(element_value); // Convert to number since strings behave weird with logical operators
                    }
                    // Check if the user altered the input box for columns 
                    else if(type_id === SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id) {
                        SETTINGS.WRITABLE.column_value = Number(element_value); // Convert to number since strings behave weird with logical operators
                    }
                    // The input id (type_id) does not match the id of neither rows nor columns
                    else {
                        throw new Error(`Got string ID '${type_id}' which is not defined in scope '${listener_type}'.`);
                    }
                    // Change the dimensions of the table on the frontend to match the backend
                    updateTableDimensions();
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
 * Changes the dimensions of the table on the frontend to match the backend.
 * 
 * Additonally, updates the frontend table's cell values with the ones from the backend array
 */
function updateTableDimensions() {
    // Update the value shown in the input boxes that determine the dimensions of the table - i.e. a frontend update
    document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id).value = SETTINGS.WRITABLE.row_value; 
    document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id).value = SETTINGS.WRITABLE.column_value;

    // Operations in order to make a new table matching the dimensions and cell values of the backend  
    deleteTable();
    createTable(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);
    restoreTable();
}
/**
 * Ensures elements are kept in the correct cells after row/column size has been altered.
 * 
 * If called with true, all table cells are filled. Otherwise only the cells from the previous dimensions are filled
 * @param {true} fill_all Optional
 * @returns 
 */
function restoreTable(fill_all) {
    let filling_row_value, filling_column_value;
    if(fill_all === true) {
        filling_row_value = SETTINGS.WRITABLE.row_value;
        filling_column_value = SETTINGS.WRITABLE.column_value;
    }
    else {
        filling_row_value = SETTINGS.WRITABLE.prev_row_value;
        filling_column_value = SETTINGS.WRITABLE.prev_column_value;
    }
    // Copy the backend array to a temp array
    let temp_array = CURRENT_TABLE.slice();
    // Overwrite the backend array with a new, empty array
    CURRENT_TABLE = createArray(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);

    // If the dimensions of the previous table is larger than the dimensions of the current table, go down to the current table's dimensions
    // This prevents accessing the array out of bounds when merging the old backend array with the new backend array
    if(SETTINGS.WRITABLE.row_value < SETTINGS.WRITABLE.prev_row_value) {   
        SETTINGS.WRITABLE.prev_row_value = SETTINGS.WRITABLE.row_value;
        filling_row_value = SETTINGS.WRITABLE.row_value;
    }
    else if(SETTINGS.WRITABLE.column_value < SETTINGS.WRITABLE.prev_column_value) {  
        SETTINGS.WRITABLE.prev_column_value = SETTINGS.WRITABLE.column_value;
        filling_column_value = SETTINGS.WRITABLE.column_value;
    }
    // Catch potential errors related to accidentally accessing the array out of bounds
    try { 
        // Nested for-loops to access two-dimensional arrays
        // Using the prev values since we're only interested in the values in the previous old backend array
        for(let i = 0; i < filling_row_value; i++) {
            for(let j = 0; j < filling_column_value; j++) {

                // Only merge array indices containing something
                if(temp_array[i][j] !== undefined && temp_array[i][j] !== "") {

                    // Merge the old backend array's values with the new backend array
                    CURRENT_TABLE[i][j] = temp_array[i][j];

                    // Testing
                    // console.log(`i: ${i} j: ${j}`);
                    // console.log(`Array merged: [${CURRENT_TABLE}]`);
                    
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
        addAllScaleButtons();
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
 * Deletes any element given to it.
 * 
 * Takes the element's id as input.
 * @param {string} id 
 */
function deleteElement(id) {
    const element = document.getElementById(`${id}`); // Get the element object (EO)
    const parent = element.parentElement; // The parent of EO

    // Remove the child the parent - i.e. EO. 
    // Yes, this is a strange way of doing it (compared to element.remove()), but it works (alright)
    parent.removeChild(element);
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

// Running The Program
// Adding an event listener to window with type "load" ensures that the script only begins when the page is fully loaded (with CSS and everything)
window.addEventListener("load", (event) => {
    initTable();
});

// Export function(s) to test suite (brackets matter, see drag.test.js)
export {createArray};