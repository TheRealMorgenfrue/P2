'use strict'
/* 
******** Variable Case Explainer ********
Global:     VARIABLECASE / VARIABLE_CASE
Function:   variableCase / "N/A"
Object:     VariableCase / "N/A"
Variable:   "N/A"        / variable_case
*****************************************
*/

let CURRENT_TBL,
    ARR_CURRENT_TBL = new Array(); // Array used to contain the copies of matrices that have been changed - ensures user can go back to previous iteration of matrix 

const SETTINGS = new function() { // A number of functions need to access non-writable values as well as update writable values - this object is therefore global. 
   this.READONLY_SETTINGS = new function() {
        this.TBL_SETTINGS = new function() {
            this.table_id = "gaussian_elimination_matrix"; 
            this.max_input_length = 8;
            this.placeholder = "0";
            this.row_id = "row";        // This id refers to the input box, not the matrix
            this.column_id = "column";  // This id refers to the input box, not the matrix
            this.type = "number"        // This refers to the input box, not the matrix
            this.max_matrix_size = 15;  // Ensure that matrix is small enough to be read by human users 
            this.min_matrix_size = 2;
            this.title = `Input desired row size - max ${this.max_matrix_size}`;
        }
        this.BUTTON_SETTINGS = new function() {
            this.lock_button_id = "lockbutton";
            this.lock_button_value = "Lock";
            this.lock_button_type = "button";
            this.lock_Table = function() { lockTable(); resetTable(); };    // We can have functions as keys in objects by wrapping them in a function
            this.unlock_button_id = "unlockbutton";
            this.unlock_button_value = "Unlock";
            this.unlock_button_type = "button";
            this.unlock_Table = function() { unlockTable(); };
            this.reset_button_id = "resetbutton";
            this.reset_button_value = "Reset matrix size";
            this.reset_button_type = "button";
            this.reset_Table = function() { };   // Is this feature necessary?
            this.clear_button_id = "clearbutton";
            this.clear_button_value = "Clear matrix";
            this.clear_button_type = "button";
            this.clear_Table = function() { clearTable(); };
            this.rewind_button_id = "rewindbutton";
            this.rewind_button_value = "Go back";
            this.rewind_button_type = "button";
            this.rewind_Table = function() { rewindTable(); };
        }
    }
    this.WRITABLE = new function() {
        this.row_value = 2;
        this.column_value = 2;
    }
};

Object.freeze(SETTINGS.READONLY_SETTINGS);  // Make the "readonly_settings" readonly

/**
 * Creates a 2D array and fills it with empty strings, "". 
 * 
 * This prevents unintended behaviour where cells are filled with the value of a single cell upon array creation. 
 * @param {integer} row_value 
 * @param {integer} column_value 
 * @returns {array} 2D array
 */
function createArray(row_value, column_value) {
    let arr = new Array(row_value);
    for (let i = 0; i < row_value; i++) {
      arr[i] = new Array(column_value);
      for (let j = 0; j < column_value; j++) {
        arr[i][j] = ""; // Prevent unintended side effects of array creation 
      }
    }
    return arr;
}

/* 
Function that creates a ${rows} times ${columns} table - aka. the matrix
Takes two integers as input.
Additionally, it creates buttons to lock/unlock the table
*/
/**
 * Creates the matrix used for Gaussian Elimination
 * 
 * Additionally, it creates buttons to interact with the matrix
 * @param {integer} row_value 
 * @param {integer} column_value 
 * @returns 
 */
function createTable(row_value, column_value) {
    try { // Ensure matrix is defined i.e. of dim greater than 1x1 (A matrix of -1 size, for instance).
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
    tbl = document.createElement('table');
    tbl.id = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id;
    
    // Ensure that each row is inserted and can be found by id 
    for (let i = 0; i < row_value; i++) {   
        const tr = tbl.insertRow(); // Note: predefined method for inserting row in table
        tr.id = `${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i}`;
        // initDrag(tr); // Make rows draggable - Decomment when draganddrop.js import is done correctly 

        for (let j = 0; j < column_value; j++) { 
            let td = tr.insertCell(); 
            
            // Create input elements to the matrix and set applicable attributes
            const td_input = document.createElement('input');
            td_input.placeholder = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.placeholder;
            td_input.maxLength = SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.max_input_length;
            td_input.id = `${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}_${i},${j}`;  // The ID is indexed from 0 in order to be used with array indices

            createEventListener(td_input, "click");
            createEventListener(td_input, "tbl_change");

            td_input.classList.add("tblCells");  // Apply the CSS class defined in the CSS file
            td.appendChild(td_input);
            }
        }
    tbl.classList.add("tbl");   // Add class to ensure CSS-styling can be applied correctly
    body.appendChild(tbl);
    addTableButtons();
} 

/* 
Function that deletes the table created by createTable - aka. the matrix
Additionally, it deletes the buttons created by createTable to make sure they aren't jumbled around
element.remove() is also a valid option to delete elements
*/

/**
 * Remove all cells that are associated with current table 
 */
function deleteTable() {
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.table_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.lock_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.unlock_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.reset_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.clear_button_id}`);
    deleteElement(`${SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.rewind_button_id}`);
}
// ---- REFACTOR HERE ----- //
/* 
Function that creates two input fields to let the user change the size of the matrix
Additionally, it initializes the table (matrix) by calling createTable
*/
function getTableSize() {
    
    CURRENT_TBL = createArray(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value); // Initialize the array to hold the table values

    const body = document.body;
    const Input = { // Object to add attributes with a variable. This compresses the code to Input.id (instead of having to write e.g., row.id & column.id)
        row: document.createElement('input'),
        column: document.createElement('input')
    };
    const cdot_span = document.createElement("span");  // A 'span' works correct with CSS, a 'div' does not 
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${columns}"
    cdot_span.appendChild(cdot); // In order to apply CSS to a TextNode it has to be a child of an element, e.g. 'span'
    cdot_span.classList.add("tbl", "inputbox");  // Add to class to ensure correct CSS-styling 

    // Adds attributes to row and column elements.
    // Do NOT use the global row_id here instead of "row" (equivalent for columns). 
    // That could cause a serious issue with the definition of 'row' and 'column' in the 'Input' object
    add_Attributes("row", Input);
    add_Attributes("column", Input);

    body.appendChild(Input.row);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.column);
    body.insertBefore(cdot_span, Input.column);  // insertBefore can be used to insert an element before another element (this way you can place it whereever in the code - as opposed to appendChild) 

    // Make eventlisteners for row and column elements
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "tblsize_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "tblsize_change");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_id, "click");
    createEventListener(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_id, "click");

    // Initialize table at page load since we don't trigger the eventlisteners there
    createTable(Number(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.row_value), Number(SETTINGS.READONLY_SETTINGS.TBL_SETTINGS.column_value));
}

/* 
Helper function that adds attributes to get_TableSize
*/
function add_Attributes(type, Input) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object
    Input[`${type}`].id = TableSettings[`${type}_id`];
    Input[`${type}`].title = TableSettings.title;
    Input[`${type}`].value = TableSettings[`${type}_value`];
    Input[`${type}`].type = TableSettings.type;
    Input[`${type}`].classList.add("tbl", "inputBox");
}

/* 
Function that adds an eventlistener a given element id passed to it
Can be extended with other eventlisteners
Takes 3 inputs where:
    String/Object: 'type_id' can be either the element's id or the element object (i.e. the element itself)
    String: 'listener_type' is the type of the eventlistener (e.g. "focusout")
    Object: 'Settings' can be used as a settings/info package, i.e. in getTableSize 'Settings' contains settings for the table
            If such a thing is not needed, simply call the function with "null" as third parameter (with "")
*/
function createEventListener(type_id, listener_type) {
    try {   // This way ALL errors are caught in this function (and you can throw errors like there's no tomorrow)
        let element,
        element_value = 0;
        try {
            if(!type_id) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${type_id}.`);
            }
            else if(!listener_type) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${listener_type}.`);
            }
            else if(!TBL_SETTINGS.non_writable_settings) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Settings is ${TBL_SETTINGS.non_writable_settings}.`);
            }
        } catch (error) {
            console.error(error);
            return;
        }
        
        if (    // type_id is an object (arrays are objects too, but we don't want those)
            typeof type_id === 'object' &&
            !Array.isArray(type_id)
        ) {
            element = type_id;
        }
        else {  // type_id is NOT an object but the actual id
            element = document.getElementById(type_id);
            if(!element) {
                throw new Error(`getElementById returned ${element} with ID ${type_id}. Was the ID mistyped or does it not exist?`);
            }
        }
    
        switch(listener_type) {
            case "tbl_change": {
                element.addEventListener("change", (event) => {
                    const cell_id = event.target.id;
                    console.log(`target value = ${event.target.value}`);
                    let cell_value = event.target.value;
                    let san_cell_value = sanitize(cell_value);
                    event.target.value = san_cell_value;
    
                    if(san_cell_value !== "") {     // Empty strings are no fun :(
                        const i = cell_id.match(/\d+(?=\,)/);
                        const j = cell_id.match(/\d+$(?!\,)/);
                        
                        console.log(`ID is ${cell_id} ::: i = ${i} :::: j = ${j}`);     // Testing
                        
                        if(CURRENT_TBL[i][j] !== san_cell_value) {    // Duplicate strings are quite lame too
                            CURRENT_TBL[i][j] = Number(san_cell_value);  // Store cell value in array
    
                            // Detailed info about the matrix - console edition
                            console.log(`Array: [${CURRENT_TBL}] :::: Value stored: '${CURRENT_TBL[i][j]}'`);
                            console.table(CURRENT_TBL);
                        }  
                    }
                });   
                break;
            }
            case "tblsize_change": {
                element.addEventListener("change", (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                    element_value = event.target.value;
                    let prev_row = TBL_SETTINGS.writable_settings.row_value; // Copy the CURRENT's somewhere else since they'll be overwritten by createTable (Might come up with a better solution, but it works as is)
                    let prev_column = TBL_SETTINGS.writable_settings.column_value;
                
                    if(element_value > TBL_SETTINGS.non_writable_settings.max_matrix_size) {    // Check if we exceeded the max number of rows allowed
                        console.warn(`id: ${type_id} size (${element_value}) is larger than max allowed (${TBL_SETTINGS.non_writable_settings.max_matrix_size}).\nResetting size to: ${TBL_SETTINGS.non_writable_settings.max_matrix_size}.`);
                        element_value = TBL_SETTINGS.non_writable_settings.max_matrix_size;
                    }
                    else if(element_value < TBL_SETTINGS.non_writable_settings.min_matrix_size) {   // Check if we exceeded the max number of columns allowed
                        console.warn(`id: ${type_id} size (${element_value}) is smaller than min allowed (${TBL_SETTINGS.non_writable_settings.min_matrix_size}).\nResetting size to: ${TBL_SETTINGS.non_writable_settings.min_matrix_size}.`);
                        element_value = TBL_SETTINGS.non_writable_settings.min_matrix_size;
                    }
                    if(type_id === TBL_SETTINGS.non_writable_settings.row_id) {     // Are we adding rows?
                        TBL_SETTINGS.non_writable_settings.row_value = Number(element_value); // Convert to number since strings behave weird with logical operators
                    }
                    else if(type_id === TBL_SETTINGS.non_writable_settings.column_id) {    // Are we adding columns?
                        TBL_SETTINGS.non_writable_settings.column_value = Number(element_value);  
                    }
                    else {  // The input id does not match the id of neither rows nor columns
                        throw new Error(`Got string ID '${type_id}' which is not defined in scope '${listener_type}'.`);
                    }
                    document.getElementById(type_id).value = element_value;   // Update the value shown in the input field
                    deleteTable(TBL_SETTINGS.non_writable_settings);
                    createTable(TBL_SETTINGS.non_writable_settings.row_value, TBL_SETTINGS.non_writable_settings.column_value);
                    restoreTable(TBL_SETTINGS.non_writable_settings.row_value, TBL_SETTINGS.non_writable_settings.column_value, prev_row, prev_column);
                });   
                break;
            }
            case "click": {
                element.addEventListener("click", (event) => {     // Auto-marks stuff on a clicked element
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
    }
}
/* 
Function that populates the new table with the old one's values
Takes two integers, rows and columns, which are the sizes of the newly created table
The two other options, prev_i and prev_j, are integers as well. They're the rows and columns from the previous table
*/
function restoreTable(current_row_size, current_column_size, prev_row_size, prev_column_size) {
    let temp_arr = CURRENT_TBL.slice();  // Copy the array to a temp array
    CURRENT_TBL = createArray(current_row_size, current_column_size); // Overwrite the old array with a new

    if(current_row_size < prev_row_size) {  // If the prev array's rows are larger than the current, go down to the current
        prev_row_size = current_row_size;
    } 
    else if(current_column_size < prev_column_size) {  // If the prev array's columns are larger than the current, go down to the current
        prev_column_size = current_column_size;
    }
    try {
        for(let i = 0; i < prev_row_size; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < prev_column_size; j++) {
                if(temp_arr[i][j] !== undefined && temp_arr[i][j] !== "") { // Only merge array indices containing something
                    CURRENT_TBL[i][j] = temp_arr[i][j];  // Merge the old table's values with the new
                    // console.log(`i: ${i} j: ${j}`);
                    // console.log(`Array merged: [${TBL_PERSISTENT}]`);
                    let cell = document.getElementById(`${i},${j}`);    // Add 1 to match matrix indices
                    if(cell !== null) { // Prevent accessing a cell that doesn't exist
                        cell.value = CURRENT_TBL[i][j];  // Populate the new table input cells with the old table values
                    }
                }
            }
        }
    } catch (error) {
        console.error(error);
    }
}

function copyTable() {
    if(ARR_CURRENT_TBL.length > 0) {
        if(JSON.stringify(CURRENT_TBL) !== ARR_CURRENT_TBL[ARR_CURRENT_TBL.length-1]) {
            ARR_CURRENT_TBL.push(JSON.stringify(CURRENT_TBL));    // Make it a JSON object to prevent the 2d table array from being messed up in the container array  
        }
        else {
            console.warn(`Previous matrix snapshot is identical to the current - abort copy`);
        }
    }
    else {
        ARR_CURRENT_TBL.push(JSON.stringify(CURRENT_TBL));
    }
}

function rewindTable() {
    if(ARR_CURRENT_TBL.length > 0) {
        CURRENT_TBL = JSON.parse(ARR_CURRENT_TBL.slice(ARR_CURRENT_TBL.length-1, ARR_CURRENT_TBL.length));
        ARR_CURRENT_TBL.pop();
        try {
            for(let i = 0; i < CURRENT_I; i++) {  // Nested for-loops to access two-dimensional arrays
                for(let j = 0; j < CURRENT_J; j++) {
                    if(CURRENT_TBL[i][j] !== undefined) {
                        let cell = document.getElementById(`${i},${j}`);
                        if(cell !== null) { // Prevent accessing a cell that doesn't exist
                            cell.value = CURRENT_TBL[i][j];  // Populate the new table input cells with the old table values
                        }
                    }
                }
            }
        } catch (error) {
            console.error(error);
        }
    }
    else {
        console.warn(`Array underflow!: Array has length ${ARR_CURRENT_TBL.length}`);
    }
}

/* 
Function that creates buttons to interact with the table (but NOT those to change it's size)
Does so via an eventlistener
*/
function addTableButtons(Settings) {
    /*
    let ButtonSettings = {
        lock_button_id: "lockbutton",
        lock_button_value: "Lock",
        lock_button_type: "button",
        lock_Table: function() { lockTable(); resetTable(); },    // We can have functions as keys in objects by wrapping them in a function
        unlock_button_id: "unlockbutton",
        unlock_button_value: "Unlock",
        unlock_button_type: "button",
        unlock_Table: function() { unlockTable(); },
        reset_button_id: "resetbutton",
        reset_button_value: "Reset matrix size",
        reset_button_type: "button",
        reset_Table: function() { },   // Is this feature necessary?
        clear_button_id: "clearbutton",
        clear_button_value: "Clear matrix",
        clear_button_type: "button",
        clear_Table: function() { clearTable(); },
        rewind_button_id: "rewindbutton",
        rewind_button_value: "Go back",
        rewind_button_type: "button",
        rewind_Table: function() { rewindTable(); }
    };
   */
    const Input = {
        body: document.body,
        tbl: document.getElementById(`${Settings.table_id}`),
        lock_button: document.createElement("input"),
        unlock_button: document.createElement("input"),
        // reset_button: document.createElement("input"),
        clear_button: document.createElement("input"),
        rewind_button: document.createElement("input")
    };

    addButtonAttributes("lock", Input, ButtonSettings);
    addButtonAttributes("unlock", Input, ButtonSettings);
    // addButtonAttributes("reset", Input, ButtonSettings);
    addButtonAttributes("clear", Input, ButtonSettings);
    addButtonAttributes("rewind", Input, ButtonSettings);
}
/* 
Helper function to addTableButtons that adds attributes to the buttons and places them after the table
*/
function addButtonAttributes(type, Input, ButtonSettings) {
    Input[`${type}_button`].id = ButtonSettings[`${type}_button_id`];       // Set it's ID
    Input[`${type}_button`].value = ButtonSettings[`${type}_button_value`]; // Set it's value
    Input[`${type}_button`].type = ButtonSettings[`${type}_button_type`];   // Make it a "button" type
    Input[`${type}_button`].classList.add("tbl", "buttons");   // Add CSS
    Input.body.after(Input.tbl, Input[`${type}_button`]);       // Add to body after the table
    Input[`${type}_button`].addEventListener("click",  ButtonSettings[`${type}_Table`]);    // Add EventListener
}

/* 
Helper function for addTableButtons that sets all cells in the table to read only
*/
function lockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    // if(table_rows[0].readonly !== "true" ) {
        for(let i = 0; i < table_rows.length; i++){ 
            table_rows[i].setAttribute("readonly","true");
        }
        console.warn("Table is now LOCKED");
    // }
}

/* 
Helper function for addTableButtons that makes all cells in the table writeable again
*/
function unlockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    table_rows.forEach(element => {
        element.removeAttribute("readonly");
    })
    console.warn("Table is now UNLOCKED");
}

function resetTable() {
// Is this feature necessary?
copyTable();
// console.warn("Is this feature necessary?")
}

function clearTable() {
    try {
        for(let i = 0; i < CURRENT_I; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < CURRENT_J; j++) {
                CURRENT_TBL[i][j] = "";  // Clear the table array
                let cell = document.getElementById(`${i+1},${j+1}`);    // Add 1 to match matrix indices
                if(cell !== null) { // Prevent accessing a cell that doesn't exist
                    cell.value = CURRENT_TBL[i][j];  // Populate the table input cells with "" (empty string)
                }
            }
        }
    } catch (error) {
        console.warn(error);
    }
}

/* 
Function that deletes any element given to it
Takes the element's id as input
*/
function deleteElement(id) {
    const element = document.getElementById(`${id}`);
    const parent = element.parentElement;
    parent.removeChild(element);
}

/* 
Function that removes unwanted characters in a string
Takes a string as input
Returns a string with wanted characters
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
getTableSize();