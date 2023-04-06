'use strict'
/* 
******** Variable Case Explainer ********

Global:     VARIABLECASE / VARIABLE_CASE
Function:   variableCase / "N/A"
Object:     VariableCase / "N/A"
Variable:   "N/A"        / variable_case

*****************************************
*/

let TBL_PERSISTENT,
    CURRENT_I,
    CURRENT_J; // Maybe ship i and j with the array? (TBL_PERSISTENT)

// Courtesy of https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript/63936671#63936671
// Helper function for 'window.onload' method
function loadStyle(src) {
    return new Promise(function (resolve, reject) {
        let link = document.createElement('link');
        link.href = src;
        link.rel = 'stylesheet';

        link.onload = () => resolve(link);
        link.onerror = () => reject(new Error(`Style load error for ${src}`));

        document.head.append(link);
    });
}

/* 
This calls loadStyle when the page is loading to apply CSS styles to the HTML
To add more CSS styles, simply uncomment a '.then' and provide the path to the file (or add another '.then' if all are used)
*/
window.onload = function () {
    loadStyle("../styles/simple.css")
        // .then(() => loadStyle(""))
        //.then(() => loadStyle("css/icomoon.css"))
        .then(() => {
            console.log('All styles are loaded!');
        }).catch(err => console.error(err));
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

/* 
Creates a 2D array and fills it with "" (otherwise it got filled with colums - litterally)
Takes two integers, rows and colums
Returns a 2D array
*/
function createArray(rows, colums) {
    let arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
      arr[i] = new Array(colums);
      for (let j = 0; j < colums; j++) {
        arr[i][j] = "";
      }
    }
    return arr;
}

/* 
Function that creates a ${rows} times ${colums} table - aka. the matrix
Takes two integers as input.
Additionally, it creates buttons to lock/unlock the table
*/
function createTable(rows, colums) {
    try { // If the matrix's size is smaller than 1 then ABORT
        if(rows < 1 || colums < 1) {
            throw new Error(`Matrix size must be larger than 0 (Got row = ${rows}, colum = ${colums}).`);
        }
    } catch (error) {
        console.error(error);
        return;
    }

    // Object to store variables for the table - basically it's settings
    let IniTableSettings = {
        table_id: "matrix",
        max_input_length: 8,
        placeholder: "0"
    };

    const body = document.body,
    tbl = document.createElement('table');
    tbl.id = IniTableSettings.table_id;

    /*************************/
    for (let i = 1; i <= rows; i++) {   
        const tr = tbl.insertRow();

        initDrag(tr); // Make rows draggable

        for (let j = 1; j <= colums; j++) { 
            let td = tr.insertCell(); 
            
            const td_input = document.createElement('input');
            td_input.required = ""; // Make each cell element required so user cannot submit an empty matrix
            td_input.placeholder = IniTableSettings.placeholder;
            td_input.maxLength = IniTableSettings.max_input_length;
            td_input.id = `${i},${j}`;  // The ID is indexed from 1 - keep that in mind when working with the table arrays

            createEventListener(td_input, "click", "null");
            createEventListener(td_input, "tbl_focusout", "null");

            td_input.classList.add("tblCells");  // Apply the CSS class defined in the CSS file
            td.appendChild(td_input);

            // const math_format = document.createElement('math');
            // math_format.style.width = TS.cell_width;
            // td.appendChild(math_format);

            }
        }
    CURRENT_I = rows;  // Add the current table size to the CURRENT global variables
    CURRENT_J = colums;
    tbl.classList.add("tbl");   // Apply CSS
    body.appendChild(tbl);
    addTableButtons();
}

/* 
Function that deletes the table created by createTable - aka. the matrix
Additionally, it deletes the buttons created by createTable to make sure they aren't jumbled around
*/
function deleteTable() {
    deleteElement("matrix");
    deleteElement("lockbutton");
    deleteElement("unlockbutton");
    deleteElement("resetbutton");
    deleteElement("clearbutton");
}

/* 
Function that creates two input fields to let the user change the size of the matrix
Additionally, it initializes the table (matrix) by calling createTable
*/
function getTableSize() {
    let TableSettings = new function() {  // Object created by a constructor function to store variables for the table - basically it's settings
        this.row_id = "row";       // This id refers to the input box, not the matrix
        this.colum_id = "colum";   // This id refers to the input box, not the matrix
        this.type = "number"
        this.row_value = 2;
        this.colum_value = 2;
        this.max_matrix_size = 10;
        this.min_matrix_size = 2;
        this.title = `Input desired row size - max ${this.max_matrix_size}`;
    };

    TBL_PERSISTENT = createArray(TableSettings.row_value, TableSettings.colum_value); // Initialize the array to hold the table values

    const body = document.body;
    const Input = {
        row: document.createElement('input'),
        colum: document.createElement('input')
    };
    const cdot_span = document.createElement("span");  // A 'span' works correct with CSS, a 'div' does not 
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${colums}"
    cdot_span.appendChild(cdot); // In order to apply CSS to a TextNode it has to be a child of an element, e.g. 'span'
    cdot_span.classList.add("tbl", "inputbox");  // Add CSS

    // Adds attributes to row and colum elements
    add_Attributes("row", Input, TableSettings);   // Do NOT use TS.row_id as a variable instead of "row" (equivalent for colums). That could cause a serious issue with the definition in the 'Input' object
    add_Attributes("colum", Input, TableSettings);

    body.appendChild(Input.row);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.colum);
    body.insertBefore(cdot_span, Input.colum);  // insertBefore can be used to insert an element before another element (this way you can place it whereever in the code - as opposed to appendChild) 

    // Make eventlisteners for row and colum elements
    createEventListener(TableSettings.row_id, "tblsize_input", TableSettings);
    createEventListener(TableSettings.colum_id, "tblsize_input", TableSettings);
    createEventListener(TableSettings.row_id, "click", TableSettings);
    createEventListener(TableSettings.colum_id, "click", TableSettings);

    createTable(TableSettings.row_value, TableSettings.colum_value);  // Initialize table at page load since we don't trigger the eventlisteners there
}

/* 
Helper function that adds attributes to get_TableSize
*/
function add_Attributes(type, Input, TableSettings) {
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
function createEventListener(type_id, listener_type, Settings) {
    try {   // This way ALL errors are caught in this function (and you can throw errors like there's no tomorrow)
        let element,
        element_value = 0;
        try {
            if(type_id === null || type_id === undefined) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${type_id}.`);
            }
            else if(listener_type === null || listener_type === undefined) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Must not be ${listener_type}.`);
            }
            else if(Settings === null || Settings === undefined) {
                throw new Error(`Cannot add EventListener '${listener_type}' to ID '${type_id}': Settings is ${Settings}.`);
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
            if(element === null || element === undefined) {
                throw new Error(`getElementById returned ${element} with ID ${type_id}. Was the ID mistyped or does it not exist?`);
            }
        }
    
        switch(listener_type) {
            case "tbl_focusout": {
                element.addEventListener("focusout", (event) => {
                    const cell_id = event.target.id;
                    console.log(`target value = ${event.target.value}`);
                    let cell_value = event.target.value;
                    let san_cell_value = sanitize(cell_value);
                    event.target.value = san_cell_value;
    
                    if(san_cell_value !== "") {     // Empty strings are no fun :(
                        const i = cell_id.match(/\d+(?=\,)/)-1;     // Subtract 1 to match array indices
                        const j = cell_id.match(/\d+$(?!\,)/)-1;
                        
                        console.log(`ID is ${cell_id} ::: i = ${i} :::: j = ${j}`);     // Testing
                        
                        if(TBL_PERSISTENT[i][j] !== san_cell_value) {    // Duplicate strings are quite lame too
                            TBL_PERSISTENT[i][j] = san_cell_value;  // Store cell value in array
    
                            // Detailed info about the matrix - console edition
                            console.log(`Array: [${TBL_PERSISTENT}] :::: Value stored: '${TBL_PERSISTENT[i][j]}'`);
                            console.table(TBL_PERSISTENT);
                        }  
                    }
                });   
                break;
            }
            case "tblsize_input": {
                element.addEventListener("input", async (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                    await sleep(100);   // This is to prevent the value from being updated immediately after they're typed in. Otherwise, e.g. '56' is interpreted as '5' which is processed and then as '5'+'6' = '56'
                    element_value = event.target.value;
                    if(element_value > Settings.max_matrix_size) {    // Check if we exceeded the max number of rows allowed
                        console.warn(`Row (id: ${type_id}) size (${element_value}) is larger than max allowed (${Settings.max_matrix_size}).\nResetting size to: ${Settings.max_matrix_size}.`);
                        element_value = Settings.max_matrix_size;
                    }
                    else if(element_value < Settings.min_matrix_size) {   // Check if we exceeded the max number of colums allowed
                        console.warn(`Colum (id: ${type_id}) size (${element_value}) is smaller than min allowed (${Settings.min_matrix_size}).\nResetting size to: ${Settings.min_matrix_size}.`);
                        element_value = Settings.min_matrix_size;
                    }
                    if(type_id === Settings.row_id) {     // Are we adding rows?
                        Settings.row_value = element_value;   
                    }
                    else if(type_id === Settings.colum_id) {    // Are we adding colums?
                        Settings.colum_value = element_value;   
                    }
                    else {  // The input id does not match the id of neither rows nor colums
                        throw new Error(`Got string ID '${type_id}' which is not defined in scope '${listener_type}'.`);
                    }
                    document.getElementById(type_id).value = element_value;   // Update the value shown in the input field
                    deleteTable();
                    let prev_i = CURRENT_I; // Copy the CURRENT's somewhere else since they'll be overwritten by createTable (Might come up with a better solution, but it works as is)
                    let prev_j = CURRENT_J;
                    createTable(Settings.row_value, Settings.colum_value);
                    restoreTable(Settings.row_value, Settings.colum_value, prev_i, prev_j);
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
Takes two integers, rows and colums, which are the sizes of the newly created table
The two other options, prev_i and prev_j, are integers as well. They're the rows and colums from the previous table
*/
function restoreTable(rows, colums, prev_i, prev_j) {
    let temp_arr = TBL_PERSISTENT.slice();  // Copy the array to a temp array
    TBL_PERSISTENT = createArray(rows, colums); // Overwrite the old array with a new

    // console.log(`got r = ${rows} :: c = ${colums}`);
    // console.log(`SPLICE TEMP ARR = [${temp_arr}]`);
    // console.log(`Array created: [${tbl_persistent}]`);
    // console.log(`before     ROW: ${rows} COLUM: ${colums} prev_i: ${prev_i} prev_j: ${prev_j} CURRENT_I: ${CURRENT_I} CURRENT_J ${CURRENT_J}`);

    if(rows < prev_i) {  // If the prev array's rows are larger than the current, go up to the current
        /* 
        This if statement has an EPIC bruh moment -> (rows < prev_i) => (10 < 9 = true)
        Thus, prev_i goes from 8 -> 10 in one jump which causes the for-loops down below to access the array out of bounds (array[i] is undefined)
        Atm. it doesn't seem to cause major trouble (except 'TypeError: undefined') but it's something to keep in mind
        */

        // console.log(`CHANGING: if(${rows} > ${prev_i}) = ${rows > prev_i}`);
        prev_i = rows;    
    } 
    else if(colums < prev_j) {  // If the prev array's colums are larger than the current, go up to the current
        prev_j = colums;    // Here, JS thinks logic should be followed again (BRUH)
    }
    // console.log(`after      ROW: ${rows} COLUM: ${colums} prev_i: ${prev_i} prev_j: ${prev_j} CURRENT_I: ${CURRENT_I} CURRENT_J ${CURRENT_J}`);
    // console.log("--------------");
    try {
        for(let i = 0; i < prev_i; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < prev_j; j++) {
                if(temp_arr[i][j] !== undefined && temp_arr[i][j] !== "") { // Only merge array indices containing something
                    TBL_PERSISTENT[i][j] = temp_arr[i][j];  // Merge the old table's values with the new
                    console.log(`i: ${i} j: ${j}`);
                    console.log(`Array merged: [${TBL_PERSISTENT}]`);
                    let cell = document.getElementById(`${i+1},${j+1}`);    // Add 1 to match matrix indices
                    if(cell !== null) { // Prevent accessing a cell that doesn't exist
                        cell.value = TBL_PERSISTENT[i][j];  // Populate the new table input cells with the old table values
                    }
    
                }
            }
        }
    } catch (error) {
        // Catch the TypeError made by the if-statement 
        console.warn(error);
    }
}

/* 
Function that creates buttons to interact with the table (but NOT those to change it's size)
Does so via an eventlistener
*/
function addTableButtons() {
    let ButtonSettings = {
        lock_button_id: "lockbutton",
        lock_button_value: "Lock",
        lock_button_type: "button",
        lock_Table: function() { lockTable(); },    // We can have functions as keys in objects by wrapping them in a function
        unlock_button_id: "unlockbutton",
        unlock_button_value: "Unlock",
        unlock_button_type: "button",
        unlock_Table: function() { unlockTable(); },
        reset_button_id: "resetbutton",
        reset_button_value: "Reset matrix size",
        reset_button_type: "button",
        reset_Table: function() { resetTable(); },   // Is this feature necessary?
        clear_button_id: "clearbutton",
        clear_button_value: "Clear matrix",
        clear_button_type: "button",
        clear_Table: function() { clearTable(); }
    };
   
    const Input = {
        body: document.body,
        tbl: document.getElementById("matrix"),
        lock_button: document.createElement("input"),
        unlock_button: document.createElement("input"),
        reset_button: document.createElement("input"),
        clear_button: document.createElement("input")
    };

    addButtonAttributes("lock", Input, ButtonSettings);
    addButtonAttributes("unlock", Input, ButtonSettings);
    addButtonAttributes("reset", Input, ButtonSettings);
    addButtonAttributes("clear", Input, ButtonSettings);
}
/* 
Helper function to addTableButtons that adds attributes to the buttons and places them after the table
*/
function addButtonAttributes(type, Input, BS) {
    Input[`${type}_button`].id = BS[`${type}_button_id`];       // Set it's ID
    Input[`${type}_button`].value = BS[`${type}_button_value`]; // Set it's value
    Input[`${type}_button`].type = BS[`${type}_button_type`];   // Make it a "button" type
    Input[`${type}_button`].classList.add("tbl", "buttons");   // Add CSS
    Input.body.after(Input.tbl, Input[`${type}_button`]);       // Add to body after the table
    Input[`${type}_button`].addEventListener("click",  BS[`${type}_Table`]);    // Add EventListener
}

/* 
Helper function for addTableButtons that sets all cells in the table to read only
*/
function lockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    for(let i = 0; i < table_rows.length; i++){ 
        table_rows[i].setAttribute("readonly","true");
    }
    console.warn("Table is now LOCKED");
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
console.warn("Is this feature necessary?")
}

function clearTable() {
    try {
        for(let i = 0; i < CURRENT_I; i++) {  // Nested for-loops to access two-dimensional arrays
            for(let j = 0; j < CURRENT_J; j++) {
                TBL_PERSISTENT[i][j] = "";  // Clear the table array
                let cell = document.getElementById(`${i+1},${j+1}`);    // Add 1 to match matrix indices
                if(cell !== null) { // Prevent accessing a cell that doesn't exist
                    cell.value = TBL_PERSISTENT[i][j];  // Populate the table input cells with "" (empty string)
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
  .replace(/&/g, "")
  .replace(/</g, "")
  .replace(/>/g, "")
  .replace(/"/g, "")
  .replace(/'/g, "")
  .replace(/`/g, "")
  .replace(/[^0-9]/g, "")
  return str.trim();
}

/************ Drag'n Drop *************** 
the functions in this tag build on the from-scratch drag and drop-functionality from the second script tag
this is an attempt to standardise them and make them work for any element by using custom events
the events we are working with are
. draggingStarted -> Fires when the user begins dragging an element. event.target is the element that gets dragged
. draggingStopped -> Fires when the user stops dragging an element. event.target is the element at the spot where the drag ends
. draggedOn       -> Fires when the user drags something on top of an element. That element is event.target
. draggedOff      -> Fires when the user drags something away from an element. That element is event.target
all events have an attribute accessed with event.detail that contains a reference to a copy of the dragged element
*/

/* 
Function that makes an element draggable
Takes an event as input (e.g. from an EventListener)
Must be called by the function initDrag
*/
function dragFunctionality(event){
    //set the drag target and fire an event on it when dragging begins after cloning it. We use CustomEvent so we can pass info on the cloned element in event.detail
    const dragTarget = event.currentTarget;

    //clone the element the handler is attached to and place it on the cursor
    //note that the element is made a child of the dragTarget
    const newElement = dragTarget.cloneNode(true);  //we also clone the element's ID! Be careful when referring to it!
    document.body.appendChild(newElement);
    newElement.style.position = "absolute";
    newElement.style.zIndex = "2000";
    newElement.style.left = `${event.pageX}px`;
    newElement.style.top = `${event.pageY}px`;
    newElement.style.pointerEvents = "none";

    //Fire a custom event with the clone of the dragged element in its detail-attribute
    const dragEvent = new CustomEvent("draggingStarted", {bubbles:true, detail:newElement});
    dragTarget.dispatchEvent(dragEvent);
    
    //prepare events to fire in the updatePositionEvent-function and a variable to keep track of the element under the cursor
    const dragOntoEvent = new CustomEvent("draggedOn", {bubbles:true, detail:newElement}); //this event should be fired when something is dragged onto an element, but not dropped
    const dragOffEvent = new CustomEvent("draggedOff", {bubbles:true, detail:newElement}); //this event should be fired when something is dragged off of an element
    let dropTarget = document.elementFromPoint(event.pageX, event.pageY);

    //define a function to update the cloned element's position and run it whenever the mouse is moved
    function updatePositionEvent(event){
        newElement.style.left = `${event.pageX}px`;
        newElement.style.top = `${event.pageY}px`;
        if(dropTarget !== document.elementFromPoint(event.pageX, event.pageY)){
            dropTarget.dispatchEvent(dragOffEvent);
            dropTarget = document.elementFromPoint(event.pageX, event.pageY);
            dropTarget.dispatchEvent(dragOntoEvent);
        } 
    }     
    document.addEventListener("mousemove", updatePositionEvent);
    
    //stop the event from propagating immediately, so no other handlers of the same type will be triggered by this event
    event.stopImmediatePropagation();
    
    //listen for a click to register when the user wants to drop the element. BLOCKS ALL "CLICK"-LISTENERS UNTIL THE DRAGGED ELEMENT IS DROPPED
    document.addEventListener("click", event => {
        //set the drop target and fire a custom event on it
        const dropEvent = new CustomEvent("draggingStopped", {bubbles:true, detail:newElement});
        dropTarget.dispatchEvent(dropEvent);
        
        //delete the cloned element and remove the handler that moves it around
        document.removeEventListener("mousemove", updatePositionEvent);
        newElement.remove();

        //this handler is capturing, so it triggers before the pickup-handler and blocks it with stopImmediatePropagation
        event.stopImmediatePropagation();
    }, {capture: true, once: true});
}

/* 
Function that initialises the drag functionality on a given element by calling dragFunctionality
Takes an element as input
*/
function initDrag(element){
    element.addEventListener("click", dragFunctionality)
}

/*
Function that controls the highlighting of an element with the mouse.
Several values can be entered as strings:
. none
. auto
. text
. all
. contain
Read about their behavior on https://developer.mozilla.org/en-US/docs/Web/CSS/user-select
*/
function highlightPermissions(element, value){
    try{
        if(value !== "none" && value !== "auto" && value !== "text" && value !== "all" && value !== "contain"){
            throw new Error(`${value} is not a valid option!\nValid values are "none", "auto", "text", "all", and "contain".`);
        }
    element.style.WebkitUserSelect = value; // Safari
    element.style.msUserSelect = value; // IE 10+ and Edge
    element.style.userSelect = value; // Standard syntax
    } catch(error) {
        console.error(error);
    }
}

//Running The Program
getTableSize();