/*
******** Variable Case Explainer ********
Global:     VARIABLECASE   / VARIABLE_CASE
Function:   variableCase   / "N/A"
Objects:    VariableCase   / "N/A"
Primitives: "N/A"          / variable_case
*****************************************
*/
import {initDrag, disableDrag} from "./draganddrop.js";
import {updateTableFromArray, fillTable} from "./rowoperations.js";
import {gaussianElimination, generateEquation, roundTo, hasSolutions, isRowEchelonForm} from "./app_math.js";

//let CURRENT_TABLE;
// CURRENT_TABLE is an array of arrays (2D array). It is global since it'll be used across all functions 
// It is denoted as "backend array" in comments since it, at all times, contains the backend values of the table shown on screen - i.e. the frontend table
// Note that it still functions at the backend level; the values in it need to be written to the frontend by external means - e.g. element.value = CURRENT_TABLE[i][j]  

//let TABLES = [];
sessionStorage.setItem("tableHistory", JSON.stringify([]));
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
            this.confirm_Table = () => { lockTable(); };    // We can have functions as keys in objects by wrapping them in a function
            this.reset_button_id = "resetbutton";
            this.reset_button_value = "Reset matrix";
            this.reset_button_type = "button";
            this.reset_Table = () => {
                fillTable(document.getElementById(SETTINGS.READONLY.TABLE.table_id), "", false, "input", "value");
                unlockTable();
                removeSolutionMsg();
            };
            this.rewind_button_id = "rewindbutton";
            this.rewind_button_value = "Go back";
            this.rewind_button_type = "button";
            this.rewind_Table = () => {
                undoTable(1);
                tableIsRowEchelon(JSON.parse(sessionStorage.getItem("currentTable")));
            };
            this.randomize_button_id = "randomizebutton";
            this.randomize_button_value = "Randomize";
            this.randomize_button_type = "button";
            this.randomize_Table = () => { randomize_Table(); };
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
    table.classList.add("geTable");

    resizeTableBody(tbody, SETTINGS.WRITABLE, `<input placeholder="${SETTINGS.READONLY.TABLE.placeholder}" maxlength="${SETTINGS.READONLY.TABLE.max_input_length}">`);
    
    tbody.addEventListener("change", (event) => {
        // Validate input in the cell the user modified
        let cell_value = event.target.value;
        let sanitized_cell_value = sanitizeWithDots(cell_value);
        event.target.value = roundTo(Number(sanitized_cell_value), 2);
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
        const backend_rows = [];
        const rows = convertTableToArray(table)
        if(!rows){
            throw new Error(`Could not create array from table!\nGot ${rows}`);
        }
        rows.forEach(row => {
            const backend_row = [];
            row.forEach(cell => {
                backend_row.push(Number(cell.querySelector("input").value));
            });
            backend_rows.push(backend_row);
        });
        console.info(`Created the following array:\n${JSON.stringify(backend_rows)}`);
        pushToHistory(backend_rows);
        return backend_rows;
    } catch (error) {
        console.error(error);
        return null;
    }
}
//get the current tableHistory and parse it, push an item to it, stringify it again and update tableHistory
//tableHistory is assumed to be an array and the item is assumed to be fully JSON-compatible
function pushToHistory(item){
    const history = JSON.parse(sessionStorage.getItem("tableHistory"));
    history.push(item);
    console.info(`Pushing the following to tableHistory:\n${JSON.stringify(item)}`);
    sessionStorage.setItem("tableHistory", JSON.stringify(history));
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
    let tables = JSON.parse(sessionStorage.getItem("tableHistory"));
    // Make sure the array actually contains something
    if(tables.length > 0) {
        // Check if the array is large enough to go back undo_count times   
        if(undo_count < tables.length) {
            // Go back undo_count times in the holding array amd remove all succeeding elements - e.g. [1,2,3,4,5] with undo_count = 2 becomes [1,2,3] 
            const deleted_tables = tables.splice(tables.length-undo_count, undo_count);

            const new_table = deleted_tables.pop();
            sessionStorage.setItem("currentTable", JSON.stringify(new_table));
            sessionStorage.setItem("tableHistory", JSON.stringify(tables));
            // Testing 
            console.warn(`Undo complete. New array is ${JSON.stringify(new_table)}`)
            console.warn(`History modified. History is now ${JSON.stringify(tables)}`);
        }
        else {
            console.warn(`Array has length ${tables.length}. Going back ${undo_count} would cause the array to underflow`);
        }
    }
    else {
        console.warn(`Array underflow!: Array has length ${tables.length}`);
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
        // We're using anchor elements as buttons instead of <input type=button>.
        // This ensures that SVG icons are displayed properly inside
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

    // This function is used instead of append() or appendChild() in order to "force" the appending.
    // Because for some reason, the appending didn't happen with the library functions.
    appendToParent(Input.div, document.getElementById("table_container"));
}
/**
 * Helper function to addTableButtons() that adds attributes/event listeners to the buttons and places them after the table
 * @param {string} type The name of the button
 * @param {object} Input The object containing the button HTML elements
 */
function addButtonAttributes(type, Input) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object

    // Anchor elements uses different attributes than "input". (e.g. "value" is "text" in anchors)
    if(Input[`${type}_button`].nodeName.toLowerCase() === "a") {
        Input[`${type}_button`].text = SETTINGS.READONLY.BUTTONS[`${type}_button_value`];
    }
    else {
        Input[`${type}_button`].value = SETTINGS.READONLY.BUTTONS[`${type}_button_value`]; // Set its value
        Input[`${type}_button`].type = SETTINGS.READONLY.BUTTONS[`${type}_button_type`];   // Make it a "button" type
    }
    Input[`${type}_button`].id = SETTINGS.READONLY.BUTTONS[`${type}_button_id`];       // Set its ID
    sessionStorage.setItem(`${type}_button`, SETTINGS.READONLY.BUTTONS[`${type}_button_id`]); // Add IDs to sessionStorage
    Input[`${type}_button`].classList.add(`${type}Button`);
    Input.div.append(Input[`${type}_button`]); // Add to button container div
    Input[`${type}_button`].addEventListener("click", SETTINGS.READONLY.BUTTONS[`${type}_Table`]); // Add EventListener
}
/**
 * Helper function for the "lock" button that sets all cells in the table to read only
 */   
function lockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY.TABLE.table_id);
    const table_rows = Array.from(tbl.querySelectorAll("td"));
    table_rows.forEach((cell, index) => {
        table_rows[index] = cell.querySelector("input");
    });
    // Since this function sets all elements in table to "readonly", only the first element in the "table_rows" array has to be checked 
    if(table_rows[0].getAttribute("readonly") !== "true") {
        toggleDisableInputBoxes();
        table_rows.forEach(element => {
            element.setAttribute("readonly", "true");
        });

        //add IDs to the rows and cells
        populateIDs(tbl);

        //set the primary row
        sessionStorage.setItem("primaryRow", tbl.querySelector("tr").id);

        //enable dragging
        tbl.querySelectorAll("tr").forEach(row => {
            initDrag(row);
        });

        const backend_table = createBackendTable(tbl);
        sessionStorage.setItem("currentTable", JSON.stringify(backend_table)); // Create string representation of current matrix to be used by other .js files/script files. - We have to do this because imports only allow non-mutable/changeable items.
        // Create string representation of current matrix to be used by other .js files/script files. - We have to do this because imports only allow non-mutable/changeable items.sessionStorage.setItem("currentTable", JSON.stringify(backend_table));

        tbl.dispatchEvent(new CustomEvent("GEstarted", {bubbles: true, detail: backend_table}));
        console.info("Table is now locked");
    }
    else {
        console.warn("Table is already locked");
    }
    // Lock resize buttons
    document.getElementById("row").setAttribute("readonly", "true");
    document.getElementById("column").setAttribute("readonly", "true");
    createBackendTable(tbl);
    // Hide unusable buttons
    document.getElementById("randomizebutton").style.visibility = "collapse";
    document.getElementById("confirmbutton").style.visibility = "collapse";
    // Check if matrix is already row echelon
}
/**  
 * Helper function for the "reset" button that makes all cells in the table writeable again
 */
function unlockTable() {
    const tbl = document.getElementById(SETTINGS.READONLY.TABLE.table_id);
    const table_rows = Array.from(tbl.querySelectorAll("td"));
    table_rows.forEach((cell, index) => {
        table_rows[index] = cell.querySelector("input");
    });
    // Since lockTable() sets all elements to readonly, only the first element in the "table_rows" array has to be checked 
    if(table_rows[0].getAttribute("readonly") === "true") {
        toggleDisableInputBoxes();
        table_rows.forEach(element => {
            element.removeAttribute("readonly");
        });

        tbl.querySelectorAll("tr").forEach(row => {
            //disable dragging
            disableDrag(row);
        });
        console.info("Table is now unlocked");
        const final_table = JSON.parse(sessionStorage.getItem("currentTable"));
        tbl.dispatchEvent(new CustomEvent("GEstopped", {bubbles: true, detail: final_table})); // Event is used to check whether the moveInterface should be removed - if this event is not fired, the move event does not disappear after clicking the "Reset matrix" button
        sessionStorage.setItem("currentTable", ""); // When the user is done manipulating a matrix, we don't want to keep it.
    }
    else {
        console.warn("Table is already unlocked");
    }

    const row = document.getElementById("row"), column = document.getElementById("column");
    if(row.getAttribute("readonly") === "true"){
        row.removeAttribute("readonly");
    }
    if(column.getAttribute("readonly") === "true"){
        column.removeAttribute("readonly");
    }

    document.getElementById("randomizebutton").style.visibility = "visible";
    document.getElementById("confirmbutton").style.visibility = "visible";
    // Remove message for matrix being row echelon form if it exists
    removeRowEchelonMsg();
}
/**
 * Disables the input boxes so the table's dimentions remain constant while doing row operations
 */
function toggleDisableInputBoxes() {
    const container = document.getElementsByClassName("inputBox");
    const input_boxes = container[0].children; // Get the children of the first element of the HTML collection

    for(const element of input_boxes) {
        if(element.nodeName.toLowerCase() === "input") { // Only target input elements
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
 * @param {string} string 
 * @returns {string} String where all undesired characters have been removed. 
 */
function sanitizeWithDots(string) {
    string = string
    .trim()

    // Deprecated - use if a calculator is implemented
    // .replace(/^([*/+])/gm)
    // .replace(/(?!([-](?=\d)|[+](?=\d)|[.](?=\d)|[*](?=\d)|[/](?=\d)|(\d)))./g, "");

    .replace(/[.](?!\d)/g, "") // Remove all "." which aren't with a number
    .replace(/(?!(^[-](?=\d)|[.](?=\d)|(\d)))./g, "");

    // Cleanup of additional "."
    let dot_count = string.match(/[.]/g);
    if(dot_count && dot_count.length > 1) {
        for(let i = 0; i < dot_count.length-1; i++) {
            string = string.replace(/[.]/, "");
        } 
    }
    return `${string}`.trim();
}
/**
 * Generates random numbers from -9 to 9 and fills the backend array with them
 */
function randomize_Table() {
    //CURRENT_TABLE = generateEquation(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value);
    sessionStorage.setItem("currentTable", JSON.stringify(generateEquation(SETTINGS.WRITABLE.row_value, SETTINGS.WRITABLE.column_value)));
    updateTableFromArray(document.getElementById("gaussian_elimination_matrix"), JSON.parse(sessionStorage.getItem("currentTable")), false, "input", "value");
}

//we assume the table has at least one tbody if a tbody is not passed as that argument
//should be compatible with updateTableFromArray

//table is the HTML-element of type "table" or "tbody" that should be resized

//dimensions is an object with attributes "rows" and "columns"
//which represent the number of rows and columns to table should be resized to have

//HTMLcode is a string of HTML-code that will be placed in every cell this function creates
function resizeTableBody(table, dimensions, HTMLcode){
    try{
        removeRowEchelonMsg();
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
/**
 * Assigns an ID to every row and cell in a table, provided they exist. Should mostly be used for testing.
 * @param {HTMLTableElement} table The HTML table which IDs should be assigned to .
 */
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

/**
 * Appends a message letting the user know if the table is currently in row echelon form
 * or removes the message if it no longer is
 * @param equations
 */
function tableIsRowEchelon (equations) {
    if(isRowEchelonForm(equations) && !document.getElementById("row_echelon_msg")) {
        const solution = hasSolutions(equations);
        let str = "Matrix is in row echelon form and ";
        switch(solution.solutions) {
            case "none":
                str += "has no solutions";
                break;
            case "infinite":
                str += "has infinite solutions";
                break;
            case "unique":
                str += "has a unique solution";
                break;
            default:
                console.error("Did not receive solution");
        }
        const message = document.createElement("div");
        message.innerHTML = `<p>${str}</p>`;
        message.id = "row_echelon_msg"
        document.getElementById("table_container").append(message);
    }
    else if(!isRowEchelonForm(equations)) {
        removeRowEchelonMsg();
    }
}

function removeRowEchelonMsg () {
    const message = document.getElementById("row_echelon_msg");
    if(message) message.remove();
}

function removeSolutionMsg() {
    const message = document.getElementById("solution_msg");
    if(message) message.remove();
}

// Outputs a message to the user about the given matrix after they click confirm
document.addEventListener("GEstarted", () => {
    tableIsRowEchelon(JSON.parse(sessionStorage.getItem("currentTable")));
    if(!document.getElementById("row_echelon_msg")) {
        // If the matrix is not in row echelon form we still tell the user if it is consistent
        let array_cpy = JSON.parse(sessionStorage.getItem("currentTable"));
        let str = "Matrix is "
        gaussianElimination(array_cpy);
        const solution = hasSolutions(array_cpy);
        switch (solution.consistent) {
            case true:
                str += "consistent";
                break;
            case false:
                str += "inconsistent";
                break;
            default:
                console.error("Did not receive solutions");
        }
        const solution_msg = document.createElement("div");
        solution_msg.innerHTML = `<p>${str}</p>`;
        solution_msg.id = "solution_msg";
        document.getElementById("table_container").append(solution_msg);
    }
});

// Export function(s) to test suite (brackets matter, see drag.test.js)
export {createArray, sanitizeWithDots, initTableGE, populateIDs, pushToHistory, tableIsRowEchelon};