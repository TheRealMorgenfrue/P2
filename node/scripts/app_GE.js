/*
******** Variable Case Explainer ********
Global:     VARIABLECASE   / VARIABLE_CASE
Function:   variableCase   / "N/A"
Objects:    VariableCase   / "N/A"
Primitives: "N/A"          / variable_case
*****************************************
*/
import {initDrag} from "./draganddrop.js";
import {updateTableFromArray, fillTable} from "./rowoperations.js";
import {generateEquation} from "./app_math.js";

let CURRENT_TABLE;
// CURRENT_TABLE is an array of arrays (2D array). It is global since it'll be used across all functions 
// It is denoted as "backend array" in comments since it, at all times, contains the backend values of the table shown on screen - i.e. the frontend table
// Note that it still functions at the backend level; the values in it need to be written to the frontend by external means - e.g. element.value = CURRENT_TABLE[i][j]  

let TABLES = []; 
// Array used to contain copies of the backend array - ensures the user can go back to a previous iteration of the matrix - i.e. the table on the frontend
// It is global since it'll be used across all functions 

// A number of functions need to access non-writable values as well as update writable values - this object is therefore global.
const SETTINGS = new function() {  
   this.READONLY = new function() {
        this.TABLE = new function() {
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
        this.BUTTONS = new function() {
            this.confirm_button_id = "confirmbutton";
            this.confirm_button_value = "Confirm matrix";
            this.confirm_button_type = "button";
            this.confirm_Table = function() { lockTable(); };    // We can have functions as keys in objects by wrapping them in a function
            this.reset_button_id = "resetbutton";
            this.reset_button_value = "Reset matrix";
            this.reset_button_type = "button";
            this.reset_Table = function() {
                fillTable(document.getElementById(SETTINGS.READONLY.TABLE.table_id), "", false, "input", "value");
                unlockTable(); };
            this.rewind_button_id = "rewindbutton";
            this.rewind_button_value = "Go back";
            this.rewind_button_type = "button";
            this.rewind_Table = function() { undoTable(1); };
            this.randomize_button_id = "randomizebutton";
            this.randomize_button_value = "Randomize";
            this.randomize_button_type = "button";
            this.randomize_Table = function() { randomize_Table(); };
        }
    }
    this.WRITABLE = new function() {
        this.row_value = 2;
        this.column_value = 2;
    }
};

Object.freeze(SETTINGS.READONLY);  // Make the "readonly_settings" object readonly

/**
 * Initialises the table at page load 
 * @param {string} tableID ID of the table created
 * @param {HTMLElement|string} element Optional (Defaults to document body). The HTML element which the table should be a child of.
 */
function initTableGE(tableID, element) {
    // Create a table and add it to the page
    const table = document.createElement("table");
    const tbody = document.createElement("tbody");

    // Always append table to the document body. This is changed later if an element is specified.
    // The reason for this is to avoid the problem where the table is not actually appended to the given element (for some weird reason).
    document.body.appendChild(table);
    table.appendChild(tbody);

    // Set the table's ID if one is given
    if(tableID) {
        table.id = `${tableID}`;
    }

    resizeTableBody(tbody, SETTINGS.WRITABLE, `<input placeholder="${SETTINGS.READONLY.TABLE.placeholder}" maxlength="${SETTINGS.READONLY.TABLE.max_input_length}">`);
    
    tbody.addEventListener("change", (event) => {
        // Validate input in the cell the user modified 
        console.log(`target value = ${event.target.value}`);
        let cell_value = event.target.value;
        let sanitized_cell_value = sanitize(cell_value);
        event.target.value = sanitized_cell_value;
    });

    addResizeButtons(); // The ordering of the buttons is important.
    if(element) { // Wrap the table in an element container
        appendToParent(table, element);
    }
    else { // If no element is given the table itself is the container
        table.classList.add("tableContainer");
    }
    addTableButtons();
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
 * Create two input buttons separated by an "x" string.
 *  
 * Event listeners are added to each of the buttons that change the SETTINGS.WRITABLEs for the current table to match the row and column value input by the user. 
 */
function addResizeButtons() {
    const body = document.body;

    // Object to add attributes with a variable. This compresses the code to Input.id (instead of having to write e.g. 'row.id' and 'column.id')
    const Input = {
        row: document.createElement('input'),
        column: document.createElement('input')
    };
    const div = document.createElement("div");
    const span = document.createElement("span"); 
    const cdot = document.createTextNode(' x ');

    // Formats input boxes as "${rows} x ${columns}"
    div.appendChild(Input.row);
    span.appendChild(cdot);
    div.appendChild(span);
    div.appendChild(Input.column);

    div.classList.add("inputBox"); // Apply CSS to container element

    // Adds attributes to row and column elements.
    // Do NOT use the global row_id here instead of "row" (equivalent for columns). 
    // That could cause a serious issue with the definition of 'row' and 'column' in the 'Input' object
    addAttributes("row", Input);
    addAttributes("column", Input);

    const container_div = document.getElementById("table_container");
    container_div.appendChild(div);

    // Make eventlisteners for row and column elements
    createEventListener(SETTINGS.READONLY.TABLE.row_id, "row_change");
    createEventListener(SETTINGS.READONLY.TABLE.column_id, "column_change");
    createEventListener(SETTINGS.READONLY.TABLE.row_id, "click");
    createEventListener(SETTINGS.READONLY.TABLE.column_id, "click");
}
/**
 * Helper function for addResizeButtons() that adds various attributes to row and column objects that are part of the "Input" object. 
 * @param {string} type 
 * @param {object} Input 
 */
function addAttributes(type, Input) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object
    Input[`${type}`].id = SETTINGS.READONLY.TABLE[`${type}_id`];
    Input[`${type}`].title = SETTINGS.READONLY.TABLE.title;
    Input[`${type}`].value = SETTINGS.WRITABLE[`${type}_value`];
    Input[`${type}`].type = SETTINGS.READONLY.TABLE.type;
    Input[`${type}`].setAttribute('max', SETTINGS.READONLY.TABLE.max_matrix_size);
    Input[`${type}`].min = SETTINGS.READONLY.TABLE.min_matrix_size;
}
/**
 * Add an event listener to the element with type_id 
 * @param {string|object} type_id
 * @param {string} listener_type 
 * @returns 
 */
function createEventListener(type_id, listener_type) {
    try {   // Catch all errors in the function 
        let element;
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
                    let element_value = event.target.value;

                    // Ensure that user does not input dimensions that exceed the maximum dimensions allowed for the table
                    if(element_value > SETTINGS.READONLY.TABLE.max_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) which is larger than max allowed (${SETTINGS.READONLY.TABLE.max_matrix_size}).\nResetting size to: ${SETTINGS.READONLY.TABLE.max_matrix_size}.`);
                        event.target.value = SETTINGS.READONLY.TABLE.max_matrix_size;
                    }
                    // Ensure that the user does not input dimensions below the minimum allowed for the table
                    else if(element_value < SETTINGS.READONLY.TABLE.min_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) is smaller than min allowed (${SETTINGS.READONLY.TABLE.min_matrix_size}).\nResetting size to: ${SETTINGS.READONLY.TABLE.min_matrix_size}.`);
                        event.target.value = SETTINGS.READONLY.TABLE.min_matrix_size;
                    }
                    SETTINGS.WRITABLE.row_value = Number(event.target.value); // Convert to number since strings behave weird with logical operators
                    resizeTableBody(document.getElementById(SETTINGS.READONLY.TABLE.table_id), SETTINGS.WRITABLE, `<input placeholder="${SETTINGS.READONLY.TABLE.placeholder}" maxlength="${SETTINGS.READONLY.TABLE.max_input_length}">`);
                });
                break;
            } 
            case "column_change": {
                element.addEventListener("change", (event) => {
                    let element_value = event.target.value;
                    // Ensure that user does not input dimensions that exceed the maximum dimensions allowed for the table
                    if(element_value > SETTINGS.READONLY.TABLE.max_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) which is larger than max allowed (${SETTINGS.READONLY.TABLE.max_matrix_size}).\nResetting size to: ${SETTINGS.READONLY.TABLE.max_matrix_size}.`);
                        event.target.value = SETTINGS.READONLY.TABLE.max_matrix_size;
                    }
                    // Ensure that the user does not input dimensions below the minimum allowed for the table
                    else if(element_value < SETTINGS.READONLY.TABLE.min_matrix_size) {
                        console.warn(`ID: "${type_id}" has size (${element_value}) is smaller than min allowed (${SETTINGS.READONLY.TABLE.min_matrix_size}).\nResetting size to: ${SETTINGS.READONLY.TABLE.min_matrix_size}.`);
                        event.target.value = SETTINGS.READONLY.TABLE.min_matrix_size;
                    }
                    SETTINGS.WRITABLE.column_value = Number(event.target.value); // Convert to number since strings behave weird with logical operators
                    resizeTableBody(document.getElementById(SETTINGS.READONLY.TABLE.table_id), SETTINGS.WRITABLE, `<input placeholder="${SETTINGS.READONLY.TABLE.placeholder}" maxlength="${SETTINGS.READONLY.TABLE.max_input_length}">`);
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
 * Converts the value in the input cells in the table into an array of arrays of numbers.
 * Also pushes the array of arrays it creates onto an array TABLES for use with the undo-feature.
 * @param {HTMLTableElement} table The table from which the backend array is updated
 * @returns 
 */
function createBackendTable(table) {
    try {
        const number_rows = [];
        const rows = convertTableToArray(table)
        if(!rows){
            throw new Error(`Could not create array from table!\nGot ${rows}`);
        }
        rows.forEach(row => {
            const number_row = [];
            row.forEach(cell => {
                number_row.push(Number(cell.querySelector("input").value));
            });
            number_rows.push(number_row);
        });
        TABLES.push(number_rows);
        return number_rows;
    } catch (error) {
        console.error(error);
        return null;
    }
}
/**
 * Reverts the values of the current frontend table to match a previous instance of the frontend table.
 * 
 * Uses the holding array to store/retrieve all previous matrix instances.
 * @param {number} undo_count Number of matrix instances to go back, starting from the current "matrix" in the backend array.
 * @returns
 */
function undoTable(undo_count) {
    undo_count = Number(undo_count); // Convert to a number just in case

    // Make sure the array actually contains something
    if(TABLES.length > 0) {
        // Check if the array is large enough to go back undo_count times   
        if(undo_count < TABLES.length) {
            // Go back undo_count times in the holding array amd remove all succeeding elements - e.g. [1,2,3,4,5] with undo_count = 2 becomes [1,2,3] 
            const deleted_tables = TABLES.splice(TABLES.length-undo_count, undo_count);

            CURRENT_TABLE = deleted_tables.pop();

            // Testing 
            console.table(TABLES);
            console.table(CURRENT_TABLE);
        }
        else {
            console.warn(`Array has length ${TABLES.length}. Going back ${undo_count} would cause the array to underflow`);
        }
    }
    else {
        console.warn(`Array underflow!: Array has length ${TABLES.length}`);
    }
}
/**
 * Function that creates buttons to interact with the table (but NOT those to change its size)
 * 
 * Uses objects that contains the button's element type. This compresses the code to Input.id 
 * (instead of having to write e.g. 'lock_button.id' and 'unlock_button.id')
 */
function addTableButtons() {
    // Object that contains the button's element type. This compresses the code to Input.id (instead of having to write e.g. 'lock_button.id' and 'unlock_button.id')
    const Input = {
        div: document.createElement("div"),
        confirm_button: document.createElement("a"),
        reset_button: document.createElement("a"),
        rewind_button: document.createElement("a"),
        randomize_button: document.createElement("a")
    };
    // Do NOT use the global id for the buttons here. 
    // That could cause a serious issue with the definition in the 'Input' object
    addButtonAttributes("rewind", Input);
    addButtonAttributes("reset", Input);
    addButtonAttributes("randomize", Input);
    addButtonAttributes("confirm", Input);
    Input.div.classList.add("buttonContainer");

    createSVG("M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z",
    "0 0 512 512", Input.confirm_button);

    appendToParent(Input.div, document.getElementById("table_container"));
}
/**
 * Helper function to addTableButtons() that adds attributes/event listeners to the buttons and places them after the table 
 */
function addButtonAttributes(type, Input) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object
    if(Input[`${type}_button`].nodeName.toLowerCase() === "a") {
        Input[`${type}_button`].text = SETTINGS.READONLY.BUTTONS[`${type}_button_value`];
    }
    else {
        Input[`${type}_button`].value = SETTINGS.READONLY.BUTTONS[`${type}_button_value`]; // Set its value
        Input[`${type}_button`].type = SETTINGS.READONLY.BUTTONS[`${type}_button_type`];   // Make it a "button" type
    }
    Input[`${type}_button`].id = SETTINGS.READONLY.BUTTONS[`${type}_button_id`];       // Set its ID
    Input[`${type}_button`].classList.add(`${type}Button`);
    Input.div.append(Input[`${type}_button`]); // Add to button container div
    Input[`${type}_button`].addEventListener("click", SETTINGS.READONLY.BUTTONS[`${type}_Table`]); // Add EventListener
}
/**
 * Helper function for the "lock" button that sets all cells in the table to read only
 */   
function lockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY.TABLE.table_id);
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
    createBackendTable(tbl);
    // Hide unusable buttons
    document.getElementById("randomizebutton").style.visibility = "hidden";
    document.getElementById("confirmbutton").style.visibility = "hidden";

    toggleDisableInputBoxes();
}
/**  
 * Helper function for the "reset" button that makes all cells in the table writeable again
 */
function unlockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY.TABLE.table_id);
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
    document.getElementById("randomizebutton").style.visibility = "visible";
    document.getElementById("confirmbutton").style.visibility = "visible";

    toggleDisableInputBoxes();
}
/**
 * Disables the input boxes so the table's dimentions remain constant while doing row operations
 */
function toggleDisableInputBoxes() {
    const container = document.getElementsByClassName("inputBox");
    const input_boxes = container[0].children;

    for(const element of input_boxes) {
        if(element.nodeName.toLowerCase() === "input") {
            if(element.disabled === false) {
                element.disabled = true;
            }
            else {
                element.disabled = false;
            }
        }
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
    }
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
/**
 * Generates random numbers from -9 to 9 and fills the backend array with them
 */
function randomize_Table() {
    CURRENT_TABLE = generateEquation(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);
    const table = document.getElementById("gaussian_elimination_matrix");
    updateTableFromArray(table, CURRENT_TABLE, false, "input", "value");
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
        let cells_needed = 0;

        //add or remove rows if requested
        console.log(`Need to add ${dimensions.row_value - tableRows.length} rows`);
        if(tableRows.length < dimensions.row_value){
            //we need to add rows, since the requested number of rows is larger than the current number of rows
            //first we find the number of columns we need to add to the new rows
            if(table.lastElementChild){
                cells_needed = table.lastElementChild.querySelectorAll("td").length;
            } else {
                cells_needed = 0;
            }
            //then we add a number of rows equal to the difference between the current row count and the requested row count
            for (let i = 0; i < (dimensions.row_value - tableRows.length); i++) {
                const newRow = document.createElement("tr");

                table.appendChild(newRow);

                //add the row to our list of changes
                changes.trAdded.push(newRow);
                
                /*Turns out we didn't need this, since the column-adding code below does it for us
                    HOWEVER, if all rows are the same length, this could be readded and the column-adding code could be simplified...
                for (let j = 0; j < cells_needed; j++) {
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
        }
        //add or remove columns if needed. It is important to do this after adding or removing any rows
        //we do this for every row to ensure we end up with the same number of columns in every row
        tableRows.forEach(row => {
            cells_needed = dimensions.column_value - row.querySelectorAll("td").length;
            console.log(`Need ${cells_needed} cells on this row`);
            if(cells_needed > 0){
                for (let i = 0; i < cells_needed; i++) {
                    const newCell = document.createElement("td");
                    newCell.innerHTML = HTMLcode;
                    row.appendChild(newCell);

                    //add the cell to our list of changes
                    changes.tdAdded.push(newCell);
                }
            } else if(cells_needed < 0){
                for (let i = cells_needed; i < 0; i++) {
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

//assigns an ID to every row and cell in a table, provided they exist. Should mostly be used for testing
function populateIDs(table){
    table.querySelectorAll("tr").forEach((row, i) => {
        row.id = `${SETTINGS.READONLY.TABLE.table_id}_${i}`;
        row.querySelectorAll("td").forEach((cell, j) => {
            cell.id = `${SETTINGS.READONLY.TABLE.table_id}_${i},${j}`;
        })
    })
}
/**
 * Appends a child to a parent element.
 *
 * If the parent does not exist in the DOM tree, append it to the document body.
 * @param {HTMLElement|string} parent_element Append child to this element. If a string is given, e.g. "div", a new parent element is created instead.
 * @param {HTMLElement|string} child_element The child that'll be appended to the parent element. If a string is given, e.g. "div", a new child element is created instead.
 */
function appendToParent(child_element, parent_element) {
    let wrapper, parent_parent, child_parent;

    // If errors occur, stop execution immediately
    try {
        if(!parent_element) { // Make sure parent element is defined
            throw new Error(`Cannot attach child element to parent. Parent element is ${parent_element}`);
        }
        else if(!child_element) { // Make sure child element is defined
            throw new Error(`Cannot attach child element to parent. Child element is ${child_element}`);
        }
    } catch (error) {
        console.error(error);
        return;
    }

    // If errors occur, try to continue anyway
    try {
        // If the parent element is a string, assume it's the element to be created
        if(typeof parent_element === "string") {
            wrapper = document.createElement(parent_element); // Create new element type (e.g. <div>)
        }
        // The document object in Internet Explorer does not have a contains() method - to ensure cross-browser compatibility, also use document.body.contains().
        // If the parent element already exists in the DOM tree, remove it
        // (to prevent page crash when trying to append an element to the DOM when it's already appended to the DOM).
        else if(document.contains(parent_element) || document.body.contains(parent_element)) {
            parent_parent = parent_element.parentElement; // Get the parent of the parent element which a child will be attached to
            wrapper = parent_parent.removeChild(parent_element); // Remove the child from the DOM and return it for later use (as opposed to element.remove() which just terminates the child)
            console.info(`Parent element "${parent_element}" already exists in DOM, removing.`);

            // If the child element already exists in the DOM tree, remove it
            // (to prevent page crash when trying to append an element to the DOM when it's already appended to the DOM).
            if(document.contains(child_element) || document.body.contains(child_element)) {
                child_parent = child_element.parentElement; // Get the parent of the child element
                child_element = child_parent.removeChild(child_element); // Remove the child from the DOM and return it for later use (as opposed to element.remove() which just terminates the child)
                console.info(`Child element "${child_element}" already exists in DOM, removing.`);
            }
        }
        // The parent element is the HTML element which to wrap the child in
        else {
            wrapper = parent_element
        }

        // If the child element is a string, assume it's the element to be created
        if(typeof child_element === "string") {
            child_element = document.createElement(child_element);
        }
        wrapper.appendChild(child_element);

        // Append element to its parent element if it has one
        if(parent_parent) {
            parent_parent.append(wrapper);
        }
        // Append to body, since no parent was found
        else {
            document.body.append(wrapper);
        }
    } catch (error) {
        console.error(error);
    }
}

function createSVG(path, viewBox, parent) {
    try {
        if(!path) {
            throw new Error(`Path must not be ${path}.`);
        }
        else if(typeof path !== "string") {
            throw new Error(`Path must be a string, not "${typeof path}".`);
        }
        if(!viewBox) {
            throw new Error(`viewBox must not be ${viewBox}.`);
        }
        else if(typeof viewBox !== "string") {
            throw new Error(`viewBox must be a string, not "${typeof viewBox}".`);
        }
        if(!parent) {
            throw new Error(`Parent must not be ${parent}.`);
        }
    } catch (error) {
        console.error(error);
        return;
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svgNS = svg.namespaceURI; 
    const path_element = document.createElementNS(svgNS, "path");

    svg.setAttribute("aria-hidden","true");
    svg.setAttribute("viewBox", viewBox);

    path_element.setAttribute("d", path);
    
    svg.appendChild(path_element);
    parent.append(svg);
}

// Running The Program
// Adding an event listener to window with type "load" ensures that the script only begins when the page is fully loaded (with CSS and everything)
window.addEventListener("load", (event) => {
    // Set-up for the table
    const table_container_div = document.createElement("div");
    table_container_div.id = "table_container";
    table_container_div.classList.add("tableContainer");
    document.body.appendChild(table_container_div);

    initTableGE(SETTINGS.READONLY.TABLE.table_id, table_container_div);
});

// Export function(s) to test suite (brackets matter, see drag.test.js)
export {createArray, sanitize};