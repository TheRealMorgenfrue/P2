'use strict'
/* 
******** Variable Case Explainer ********
Global:     VARIABLECASE / VARIABLE_CASE
Function:   variableCase / "N/A"
Objects:     VariableCase / "N/A"
Primitives:   "N/A"        / variable_case

*****************************************
*/
// import initDrag from "./draganddrop.js";

let CURRENT_TABLE,
    ARRAY_CURRENT_TABLE = new Array(0); // Array used to contain the copies of matrices that have been changed - ensures user can go back to previous iteration of matrix 

const SETTINGS = new function() { // A number of functions need to access non-writable values as well as update writable values - this object is therefore global. 
   this.READONLY_SETTINGS = new function() {
        this.TBL_SETTINGS = new function() {
            this.table_id = "gaussian_elimination_matrix"; 
            this.max_input_length = 8;
            this.placeholder = "0";
            this.row_id = "row";        // This id refers to the input box, not the matrix
            this.column_id = "column";  // This id refers to the input box, not the matrix
            this.type = "number";        // This refers to the input box, not the matrix
            this.max_matrix_size = 15;  // Ensure that matrix is small enough to be read by human users 
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
        }
    }
    this.WRITABLE = new function() {
        this.row_value = 2;
        this.column_value = 2;
        this.prev_row_value = this.row_value;
        this.prev_column_value = this.column_value;
    }
};

Object.freeze(SETTINGS.READONLY_SETTINGS);  // Make the "readonly_settings" readonly

/**
 * Create the initial table to be manipulated by the user - The front and backend parts of the system 
 */
function initTable() {
    // Initialize the array to hold the table values
    CURRENT_TABLE = createArray(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);

    // Initialise the holding array so that index 0 contains the initial CURRENT_TABLE
    ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));
    
    // Initialize table at page load since we don't trigger the eventlisteners there
    createTable(Number(SETTINGS.WRITABLE.row_value), Number(SETTINGS.WRITABLE.column_value));

    // Initialize the input fields to change the dimensions of the array
    getTableSize();
}
/**
 * Creates a 2D array and fills it with empty strings, "". 
 * 
 * This prevents unintended behaviour where cells are filled with the value of a single cell upon array creation. 
 * @param {number} row_value 
 * @param {number} column_value 
 * @returns {array} 2D array
 */
function createArray(row_value, column_value) {
    let array = new Array(row_value);
    for (let i = 0; i < row_value; i++) {
      array[i] = new Array(column_value);
      for (let j = 0; j < column_value; j++) {
        array[i][j] = ""; // Prevent unintended side effects of array creation 
      }
    }
    return array;
}
/**
 * Creates the matrix used for Gaussian Elimination
 * 
 * Additionally, it creates buttons to interact with the matrix
 * @param {number} row_value 
 * @param {number} column_value 
 * @returns 
 */
function createTable(row_value, column_value) {
    try { // Ensure matrix is defined, i.e. of dimension greater than 1x1 (A matrix of size -1, for instance, is invalid).
        if(row_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size || 
            column_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size) {
            throw new Error(`Matrix size must be larger than or equal to ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}\n
            (Got row size = ${row_value}, column size = ${column_value}).`);
        }
    } catch (error) {
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
            let table_data = table_row.insertCell(); 
            
            // Create input elements to the matrix and set applicable attributes
            const table_data_input = document.createElement('input');
            table_data_input.placeholder = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.placeholder;
            table_data_input.maxLength = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_input_length;
            table_data_input.id = `${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`;  // The ID is indexed from 0 in order to be used with array indices

            createEventListener(table_data_input, "click");
            createEventListener(table_data_input, "tbl_change");

            table_data_input.classList.add("tblCells");  // Apply the CSS class defined in the CSS file
            table_data.appendChild(table_data_input);
            }
        }
    table.classList.add("tbl");   // Add class to ensure CSS-styling can be applied correctly
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
}
/**
 * Create two input buttons separated by an "x" string. 
 * Event listeners are added to each of the buttons that change the SETTINGS.WRITABLEs for the current table to match the row and column value input by the user. 
 */
function getTableSize() {
    
    const body = document.body;
    const Input = { // Object to add attributes with a variable. This compresses the code to Input.id (instead of having to write e.g. row.id & column.id)
        row: document.createElement('input'),
        column: document.createElement('input')
    };
    const cdot_span = document.createElement("span");  // Span used to avoid unintended behaviour with CSS when moving a 'div' where the 'x' does not move with the rest of the buttons. 
    const cdot = document.createTextNode(' x ');    // Formats input boxes as "${rows} x ${columns}"
    cdot_span.appendChild(cdot); // In order to apply CSS to a TextNode it has to be a child of an element where CSS can be applied, e.g. 'span'
    cdot_span.classList.add("tbl", "inputbox");  // Add two classes to cdot to ensure correct CSS-styling 

    // Adds attributes to row and column elements.
    // Do NOT use the global row_id here instead of "row" (equivalent for columns). 
    // That could cause a serious issue with the definition of 'row' and 'column' in the 'Input' object
    // Thus, addAttributes requires a string instead. 
    addAttributes("row", Input);
    addAttributes("column", Input);

    body.appendChild(Input.row);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.column);
    body.insertBefore(cdot_span, Input.column);  // insertBefore can be used to insert an element before another element (this way you can place it whereever in the code - as opposed to appendChild) 

    // Make eventlisteners for row and column elements
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "tblsize_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "tblsize_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "click");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "click");
}
/**
 * Add various attributes to row or column objects that are part of the input object. 
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
    try {   // Catch all errors in function 
        let element,
        element_value;
        try {
            if(!type_id) { // Catch errors where elements are undefined 
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${type_id}.`);
            }
            else if(!listener_type) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${listener_type}.`);
            }
        } catch (error) {
            console.error(error);
            return;
        }

        // type_id is an object (arrays are objects too, but we don't want those)
        if (typeof type_id === 'object' && !Array.isArray(type_id)) { // Only set element when type is not an array object
            element = type_id;
        }
        else {  // type_id is NOT an object but the actual id string 
            element = document.getElementById(type_id);
            if(!element) {
                throw new Error(`getElementById returned ${element} with ID ${type_id}. Was the ID mistyped or does it not exist?`);
            }
        }
    
        switch(listener_type) {
            case "tbl_change": {
                element.addEventListener("change", (event) => {
                    // Create and validate input in each cell 
                    const cell_id = event.target.id;
                    console.log(`target value = ${event.target.value}`);
                    let cell_value = event.target.value;
                    let sanitized_cell_value = sanitize(cell_value);
                    event.target.value = sanitized_cell_value;
    
                    if(sanitized_cell_value !== "") { // Sanitize only when cell value is non-empty 
                        const i = cell_id.match(/\d+(?=\,)/);
                        const j = cell_id.match(/\d+$(?!\,)/);
                        
                        console.log(`ID is ${cell_id} ::: i = ${i} :::: j = ${j}`);     // Testing
                        
                        if(CURRENT_TABLE[i][j] !== sanitized_cell_value) {    // Only store the cell value in the 2D array if it is not there already
                            CURRENT_TABLE[i][j] = Number(sanitized_cell_value);  // Store cell value in array
    
                            // Show detailed info about the matrix
                            console.log(`Array: [${CURRENT_TABLE}] :::: Value stored: '${CURRENT_TABLE[i][j]}'`);
                            console.table(CURRENT_TABLE);
                        }  
                    }
                    copyTable();
                });   
                break;
            }
            case "tblsize_change": {
                element.addEventListener("change", (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                    element_value = event.target.value;
                
                    if(element_value > SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size) {    // Check if we exceeded the max number of rows allowed
                        console.warn(`id: ${type_id} size (${element_value}) is larger than max allowed (${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size}).\nResetting size to: ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size}.`);
                        element_value = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_matrix_size;
                    }
                    else if(element_value < SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size) {   // Check if we exceeded the max number of columns allowed
                        console.warn(`id: ${type_id} size (${element_value}) is smaller than min allowed (${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}).\nResetting size to: ${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size}.`);
                        element_value = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.min_matrix_size;
                    }
                    if(type_id === SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id) {     // Check if rows are added
                        SETTINGS.WRITABLE.row_value = Number(element_value); // Convert to number since strings behave weird with logical operators
                    }
                    else if(type_id === SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id) { // Check if columns are added 
                        SETTINGS.WRITABLE.column_value = Number(element_value); // Convert to number since strings behave weird with logical operators
                    }
                    else {  // The input id does not match the id of neither rows nor columns
                        throw new Error(`Got string ID '${type_id}' which is not defined in scope '${listener_type}'.`);
                    }
                    document.getElementById(type_id).value = element_value; // Update the value shown in the input field
                    deleteTable();
                    createTable(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);

                    SETTINGS.WRITABLE.prev_row_value = SETTINGS.WRITABLE.row_value; // Update our prev values
                    SETTINGS.WRITABLE.prev_column_value = SETTINGS.WRITABLE.column_value;

                    restoreTable();
                });   
                break;
            }
            case "click": {
                element.addEventListener("click", (event) => { // Auto-marks value in the field of a clicked element
                    element.focus();
                    element.select();   
                });   
                break;
            }
            default:
                throw new Error(`Tried to add an EventListener called '${listener_type}' to element ID '${type_id}', however: No such EventListener exists.`);
        }
    } catch (error) {
        console.error(error);
        return;        
    }
}
/**
 * Function that ensures elements are kept in correct cell values after row size has been increased or decreased 
 * @returns 
 */
function restoreTable() {
    let temp_array = CURRENT_TABLE.slice();  // Copy the array to a temp array
    CURRENT_TABLE = createArray(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value); // Overwrite the old array with a new

    if(SETTINGS.WRITABLE.row_value < SETTINGS.WRITABLE.prev_row_value) {  // If the prev array's rows are larger than the current, go down to the current
        SETTINGS.WRITABLE.prev_row_value = SETTINGS.WRITABLE.row_value;
    } 
    else if(SETTINGS.WRITABLE.column_value < SETTINGS.WRITABLE.prev_column_value) {  // If the prev array's columns are larger than the current, go down to the current
        SETTINGS.WRITABLE.prev_column_value = SETTINGS.WRITABLE.column_value;
    }
    try {
        for(let i = 0; i < SETTINGS.WRITABLE.prev_row_value; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < SETTINGS.WRITABLE.prev_column_value; j++) {
                if(temp_array[i][j] !== undefined && temp_array[i][j] !== "") { // Only merge array indices containing something
                    CURRENT_TABLE[i][j] = temp_array[i][j];  // Merge the old table's values with the new
                    console.log(`i: ${i} j: ${j}`);
                    console.log(`Array merged: [${CURRENT_TABLE}]`);
                    let cell = document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`);
                    if(cell !== null) { // Prevent accessing a cell that doesn't exist
                        cell.value = CURRENT_TABLE[i][j];  // Populate the new table input cells with the old table values
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
        return;
    }
}
/**
 * Copies the current table object in the case that changes have been made to it 
 */
function copyTable() {
    if(ARRAY_CURRENT_TABLE.length > 0) {
        if(JSON.stringify(CURRENT_TABLE) !== ARRAY_CURRENT_TABLE[ARRAY_CURRENT_TABLE.length-1]) {
            ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));    // Make it a JSON object to prevent the 2d table array from being copied as a 3d array when retrieving it from the container array  
        }
        else {
            console.warn(`Previous matrix snapshot is identical to the current - abort copy`);
        }
    }
    else {
        ARRAY_CURRENT_TABLE.push(JSON.stringify(CURRENT_TABLE));
    }
    console.table(ARRAY_CURRENT_TABLE);
}
/**
 * Helper function that reverts the values of table object to match those before change event was dispatched - i.e. a cell was changed
 */
function rewindTable(rewind_count) {
    rewind_count = Number(rewind_count);
    let tbl_length = Number(ARRAY_CURRENT_TABLE.length);



    if(ARRAY_CURRENT_TABLE.length > 0) {
        // Reverts the matrix state "rewind_count" times by removing "rewind_count" elements starting from the end of the array
        if(rewind_count < tbl_length) {
            ARRAY_CURRENT_TABLE.splice(ARRAY_CURRENT_TABLE.length-rewind_count, rewind_count);
            console.log(`${rewind_count} < ${tbl_length} = ${rewind_count < tbl_length}`);
        }
        console.table(ARRAY_CURRENT_TABLE);
        CURRENT_TABLE = JSON.parse(ARRAY_CURRENT_TABLE.pop());
        console.table(ARRAY_CURRENT_TABLE);


        try {
            for(let i = 0; i < SETTINGS.WRITABLE.row_value; i++) {  // Nested for-loops to access two-dimensional arrays
                for(let j = 0; j < SETTINGS.WRITABLE.column_value; j++) {
                    if(CURRENT_TABLE[i][j] !== undefined) {
                        let cell = document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`);
                        if(cell !== null) { // Prevent accessing a cell that doesn't exist
                            cell.value = CURRENT_TABLE[i][j];  // Populate the new table input cells with the old table values
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    else {
        console.warn(`Array underflow!: Array has length ${ARRAY_CURRENT_TABLE.length}`);
    }
}
/**
 * Function that creates buttons to interact with the table (but NOT those to change it's size)
 * 
 * Does so via an eventlistener
 */
function addTableButtons() {
    const Input = {
        body: document.body,
        tbl: document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}`),
        lock_button: document.createElement("input"),
        unlock_button: document.createElement("input"),
        clear_button: document.createElement("input"),
        rewind_button: document.createElement("input")
    };

    addButtonAttributes("lock", Input);
    addButtonAttributes("unlock", Input);   
    addButtonAttributes("clear", Input);
    addButtonAttributes("rewind", Input);
}
/**
 * Helper function to addTableButtons that adds attributes to the buttons and places them after the table 
 */
function addButtonAttributes(type, Input) {
    Input[`${type}_button`].id = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_id`];       // Set it's ID
    Input[`${type}_button`].value = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_value`]; // Set it's value
    Input[`${type}_button`].type = SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_button_type`];   // Make it a "button" type
    Input[`${type}_button`].classList.add("tbl", "buttons");   // Add CSS
    Input.body.after(Input.tbl, Input[`${type}_button`]);      // Add to body after the table
    Input[`${type}_button`].addEventListener("click", SETTINGS.READONLY_SETTINGS.BUTTON_SETTINGS[`${type}_Table`]);    // Add EventListener
}
/**
 * Helper function for addTableButtons that sets all cells in the table to read only
 */   
function lockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id);
    const table_rows = tbl.querySelectorAll("input");
    // This function sets read only to all elements in table, which means that only the first row has to be checked for the readonly attribtue
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
 * Helper function for addTableButtons that makes all cells in the table writeable again
 */
function unlockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id);
    const table_rows = tbl.querySelectorAll("input");
     // Since lockTable sets all elements to readonly, only the first line has to be checked 
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
 * Function replaces all cell values with the empty string ""
 */
function clearTable() {
    try {
        for(let i = 0; i < SETTINGS.WRITABLE.row_value; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < SETTINGS.WRITABLE.column_value; j++) {
                CURRENT_TABLE[i][j] = "";  // Clear the table array
                let cell = document.getElementById(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`);
                if(cell !== null) { // Prevent accessing a cell that doesn't exist
                    cell.value = CURRENT_TABLE[i][j];  // Populate the table input cells with "" (empty string)
                }
            }
        }
    } catch (error) {
        console.warn(error);
    }
}
/**
 * Delete any element given to it
 * Takes the element's id as input
 * @param {string} id 
 */
function deleteElement(id) {
    const element = document.getElementById(`${id}`);
    const parent = element.parentElement;
    parent.removeChild(element);
}
/**
 * Removes all undesired characters from a string given 
 * @param {string} str 
 * @returns {string} Where all undesired characters have been removed 
 */
function sanitize(str){
    str=str
//   .replace(/&/g, "")
//   .replace(/</g, "")
//   .replace(/>/g, "")
//   .replace(/"/g, "")
//   .replace(/'/g, "")
//   .replace(/`/g, "")
  .replace(/[^0-9]/g, "")
  return str.trim();
}

//Running The Program
initTable();

// export {createArray}; // Export function to test suite (brackets matter, see drag.test.js)