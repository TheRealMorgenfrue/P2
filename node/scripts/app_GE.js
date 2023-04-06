'use strict'
let loc = window.location.pathname;
let dir = loc.substring(0, loc.lastIndexOf('/'));
console.log(dir);


let tbl_persistent,
    prev_i,
    prev_j; // Maybe ship i and j with the array? (tbl_persistent)


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

// Insert function that creates the entire html_page?

/* 
Function that creates a ${rows} times ${colums} table - aka. the matrix
Takes two integers as input.
Additionally, it creates buttons to lock/unlock the table
*/
function createTable(rows, colums) {
    try { // If the matrix's size is smaller than 1 then ABORT
        if(rows < 1 || colums < 1) {
            throw new Error(`Matrix size must be larger than 0 (Got row = ${rows}, colum = ${colums})`);
        }
    } catch (error) {
        console.error(error);
        return;
    }

    // Object to store variables for the table - basically it's settings
    let TS = {
        table_id: "matrix",
        max_input_length: 8,
        placeholder: "0"
    };

    const body = document.body,
    tbl = document.createElement('table');
    tbl.id = TS.table_id;

    /*************************/
    for (let i = 1; i <= rows; i++) {   
        const tr = tbl.insertRow();

        // initDrag(tr); // Make rows draggable

        for (let j = 1; j <= colums; j++) { 
            let td = tr.insertCell(); 
            
            const td_input = document.createElement('input');
            td_input.required = ""; // Make each cell element required so user cannot submit an empty matrix
            td_input.placeholder = TS.placeholder;
            td_input.maxlength = TS.max_input_length;
            td_input.id = `${i},${j}`;

            createEventListener(td_input, "click", "null");
            createEventListener(td_input, "tbl_focusout", "null");

            td_input.classList.add("tblCells");     // Apply the CSS class defined in the CSS file
            td.appendChild(td_input);

            // const math_format = document.createElement('math');
            // math_format.style.width = TS.cell_width;
            // td.appendChild(math_format);

            }
        }
    prev_i = rows;
    prev_j = colums;
    tbl.classList.add("tbl");    
    body.appendChild(tbl);
    addTableButtons();
    // validateButtonInput();
}

function createArray(rows, colums) {
    let arr = new Array(rows);
    for (let i = 0; i < rows; i++) {
      arr[i] = new Array(colums);
      for (let j = 0; j < colums; j++) {
        // arr[i][j] = `[${i}, ${j}]`;
      }
    }
    return arr;
}






/* 
Creates an array of arrays
Courtesy of https://stackoverflow.com/a/966938
*/
// function createArray(length) {
//     let arr = new Array(length || 0),
//         i = length;
//     if (arguments.length > 1) {
//         let args = Array.prototype.slice.call(arguments, 1);
//         while(i--) {
//             arr[length-1 - i] = createArray.apply(this, args);
//         }
//     }
//     return arr;
// }

/* 
Function that deletes the table created by createTable - aka. the matrix
Additionally, it deletes the buttons created by createTable to make sure they aren't jumbled around
*/
function deleteTable() {
    deleteElement("matrix");
    deleteElement("lockbutton"); // Ensure lock button is removed and correctly placed each time table is generated
    deleteElement("unlockbutton");
}

/* 
Function that creates two input fields to let the user change the size of the matrix
Additionally, it initializes the table (matrix) by calling createTable
*/
function getTableSize() {
    // Object created by a constructor function to store variables for the table - basically it's settings
    let TS = new function() {  // TS is short for TableSettings
        this.row_id = "row";       // This id refers to the input box, not the matrix
        this.colum_id = "colum";   // This id refers to the input box, not the matrix
        this.type = "number"
        this.row_value = 2;
        this.colum_value = 2;
        this.max_matrix_size = 10;
        this.min_matrix_size = 2;
        this.title = `Input desired row size - max ${this.max_matrix_size}`;
    };

    tbl_persistent = createArray(TS.row_value, TS.colum_value);

    const body = document.body;
    const Input = {
        row: document.createElement('input'),
        colum: document.createElement('input')
    };
    const cdot_div = document.createElement("span");
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${colums}"
    cdot_div.appendChild(cdot);
    cdot_div.classList.add("tbl", "inputbox");

    // Adds attributes to row and colum elements
    add_Attributes("row", Input, TS);   // Do NOT use TS.row_id as a variable instead of "row" (equivalent for colums). That could cause a serious issue
    add_Attributes("colum", Input, TS);

    body.appendChild(Input.row);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.colum);
    body.insertBefore(cdot_div, Input.colum);  // insertBefore can be used to insert an element before another element (this way you can place it whereever in the code - as opposed to appendChild) 

    // Make eventlisteners for row and colum elements
    createEventListener(TS.row_id, "tblsize_input", TS);
    createEventListener(TS.colum_id, "tblsize_input", TS);
    createEventListener(TS.row_id, "click", TS);
    createEventListener(TS.colum_id, "click", TS);

    createTable(TS.row_value, TS.colum_value);  // Initialize table at page load since we don't trigger the eventlisteners there
}

/* 
Helper function that adds attributes to get_Table
*/
function add_Attributes(type, Input, TS) {
    // [`${type}`] Makes it possible to use a variable to access properties of an object
    Input[`${type}`].id = TS[`${type}_id`];
    Input[`${type}`].title = TS.title;
    Input[`${type}`].value = TS[`${type}_value`];
    Input[`${type}`].type = TS.type;
    Input[`${type}`].classList.add("tbl", "inputBox");
}

/* 
Function that adds an eventlistener a given element id passed to it
Can be extended with other eventlisteners
Takes three inputs where:
    String/Object: 'type_id' can be both the element's id or the element object (i.e. the element itself)
    String: 'listener_type' is the type of the eventlistener (e.g. "focusout")
    Object: 'Settings' can be used as a settings/info package, i.e. in getTableSize 'Settings' contains settings for the table
            If such a thing is not needed, simply call the function with "null" as third parameter (with "")
*/
function createEventListener(type_id, listener_type, Settings) {
    let element,
    element_value = 0;
    if(type_id === null || listener_type === null || Settings === null) {
        console.error(`Got ${null} with ID '${type_id}' while trying to add EventListener '${listener_type}' using Settings ${Settings}`);
    }
    if (    // type_id is an object (arrays are objects too)
        typeof type_id === 'object' &&
        !Array.isArray(type_id)
    ) {
        element = type_id;
    }
    else {  // type_id is NOT an object but the actual id
        element = document.getElementById(type_id);
    }

    switch(listener_type) {
        case "tbl_focusout": {  // Here 'Settings' is tbl_persistent - aka. [[]]
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
                    
                    if(tbl_persistent[i][j] !== san_cell_value) {    // Duplicate strings are quite lame too
                        tbl_persistent[i][j] = san_cell_value;  // Store cell value in array

                        // Detailed info about the matrix - console edition
                        console.log(`ARR: [${tbl_persistent}] :::: Value: '${tbl_persistent[i][j]}'`);
                        console.table(tbl_persistent);
                    }  
                }
            });   
            break;
        }
        case "tblsize_input": {
            element.addEventListener("input", (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                element_value = event.target.value;

                if(element_value > Settings.max_matrix_size) {    // Check if we exceeded the max number of rows allowed
                    console.warn(`Row (id: ${type_id}) size (${element_value}) is larger than max allowed (${Settings.max_matrix_size}). Resetting size to: ${Settings.max_matrix_size}`);
                    element_value = Settings.max_matrix_size;
                }
                else if(element_value < Settings.min_matrix_size) {   // Check if we exceeded the max number of colums allowed
                    console.warn(`Colum (id: ${type_id}) size (${element_value}) is smaller than min allowed (${Settings.min_matrix_size}). Resetting size to: ${Settings.min_matrix_size}`);
                    element_value = Settings.min_matrix_size;
                }
                if(type_id === Settings.row_id) {     // Are we adding rows?
                    Settings.row_value = element_value;   
                }
                else if(type_id === Settings.colum_id) {    // Are we adding colums?
                    Settings.colum_value = element_value;   
                }
                else {  // The input id does not match the id of neither rows nor colums
                    console.error(`Error: got string id '${type_id}' which is not defined in scope '${listener_type}'`);
                }
                document.getElementById(type_id).value = element_value;   // Update the value shown in the input field
                deleteTable();
                createTable(Settings.row_value, Settings.colum_value);
                restoreTable(Settings.row_value, Settings.colum_value);

                // if(type_id === Settings.row_id) {     // Are we adding rows?
                //     createTable(element_value, Settings.colum_value);
                //     Settings.row_value = element_value;   
                // }
                // else if(type_id === Settings.colum_id) {    // Are we adding colums?
                //     createTable(Settings.row_value, element_value);
                //     Settings.colum_value = element_value;   
                // }
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
            console.error(`Error: tried to add an event listener called '${listener_type}' to element id '${type_id}', however, no such event listener exists`);
    }
}

function restoreTable(rows, colums) {
    console.log(`got r = ${rows} :: c = ${colums}`);
    let temp_arr = tbl_persistent.slice();

    console.log(`SPLICE TEMP ARR = [${temp_arr}]`);

    tbl_persistent = createArray(rows, colums);
    console.log(`Array created: [${tbl_persistent}]`);


    // temp_arr.forEach(x => {
    //     temp_arr.splice(x, 1, NaN); 
    // })


    // const res = Array.from(temp_arr, x => x === undefined ? tbl_persistent.splice(x, 1, NaN) : x);    // '?' = if(<preceeding statement>){<following statemant}, ':' = else{<following statement>}
    // console.log(`RES created: [${temp_arr}]`);
    let current_i, current_j;
    if(prev_i > rows) {
        current_i = rows;
    }
    else {current_i = prev_i;
    }
    if(prev_j > colums) {
        current_j = colums;
    }
    else {current_j = prev_j;
    }


/* 
Current problems:
current_i && current_j are updated when createTable is called in line 277. This means they're never their intended previous i and j, but the new i and j
    This causes the for-loops starting line 341 to access parts of the array that doesn't exist causing: "Uncaught TypeError: temp_arr[i] is undefined"

*/

    console.log(`current i: ${current_i} current j: ${current_j}`);
    for(let i = 0; i < current_i; i++) {
        for(let j = 0; j < current_j; j++) {
            console.log(`i: ${i} j: ${j}`);
            tbl_persistent[i][j] = temp_arr[i][j];
            console.log(`Array merged: [${tbl_persistent}]`);
        }
    }
 
}




/* 
Function that creates the button to make the table read only
Does so via an eventlistener
*/
function addTableButtons() {
    let BS = {
        lock_button_id: "lockbutton",
        lock_button_value: "Lock",
        lock_button_type: "button",
        unlock_button_id: "unlockbutton",
        unlock_button_value: "Unlock",
        unlock_button_type: "button",
        lock_Table: function() { lockTable(); },
        unlock_Table: function() { unlockTable(); }
    };
   
    const Input = {
        body: document.body,
        tbl: document.getElementById("matrix"),
        lock_button: document.createElement('input'),
        unlock_button: document.createElement('input')
    };

    addButtonAttributes("lock", Input, BS);
    addButtonAttributes("unlock", Input, BS);
}

function addButtonAttributes(type, Input, BS) {
    Input[`${type}_button`].id = BS[`${type}_button_id`];
    Input[`${type}_button`].value = BS[`${type}_button_value`];
    Input[`${type}_button`].type = BS[`${type}_button_type`];
    Input[`${type}_button`].classList.add("tbl", "inputBox");
    Input.body.after(Input.tbl, Input[`${type}_button`]);
    Input[`${type}_button`].addEventListener("click",  BS[`${type}_Table`]);
}

/* 
Helper function for lockTableButton that sets all cells in the table to read only
*/
function lockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    for(let i = 0; i < table_rows.length; i++){ 
        table_rows[i].setAttribute("readonly","true");
    }
}

/* 
Helper function for unlockTableButton that makes all cells in the table (matrix) writeable again
*/
function unlockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    table_rows.forEach(element => {
        element.removeAttribute("readonly", "false");
    })
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

/* 
Function that sanitizes the cells in the table (matrix)
Does so by calling the function sanitize
*/
function validateInput(id){
    const element = document.getElementById(`${id}`);
    const input = element.querySelectorAll("input");

    input.forEach(element => {
        element.addEventListener("focusout", (event) =>  {
            let str = event.target.value;
            let sanstr = sanitize(str);
            console.log(`Got string: ${str} and sani: ${sanstr}`);
            event.target.value = sanstr;
        }
        )
    }
    );
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
Description of input goes here
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
    } catch(e) {
        console.error(e);
    }
}

//Running The Program
getTableSize();