'use strict'
let loc = window.location.pathname;
let dir = loc.substring(0, loc.lastIndexOf('/'));
console.log(dir);


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
        console.error(`${error}`);
    }
    /************************
        Control variables
    ************************/
    const cell_width = '100px', // Width of input cells in the matrix
    max_input_length = 8,
    body = document.body,   
    tbl = document.createElement('table'); 
    tbl.setAttribute("id", "matrix");
    tbl.style.width = cell_width;  // Ensure that each input cell fills out cell in matrix

    /*************************/

    for (let i = 1; i <= rows; i++) {   
        const tr = tbl.insertRow();

        initDrag(tr); // Make rows draggable

        for (let j = 1; j <= colums; j++) { 
            let td = tr.insertCell(); 
            
            const input_cell = document.createElement('input');
            // There must be an easier way of inputting all of these number elements
            input_cell.setAttribute("required",""); // Make each cell element required so user cannot submit an empty matrix
            input_cell.setAttribute("placeholder", "0");
            input_cell.setAttribute("maxlength", max_input_length);
            input_cell.style.width = cell_width; // Ensure that each input cell fills out cell in matrix
            td.appendChild(input_cell);

            const math_format = document.createElement('math');
            math_format.style.width = cell_width;
            td.appendChild(math_format);

            td.style.border = '1px solid black';
            }
        }
    body.appendChild(tbl);
    validateButtonInput();
    lockTableButton();  
    unlockTableButton(); 
}

/* 
Function that deletes the table created by createTable - aka. the matrix
Additionally, it deletes the buttons created by createTable to make sure they aren't jumbled around
*/
function deleteTable() {
    const tbl = document.getElementById("matrix");
    const lockTableButton = document.getElementById("lockbutton").id;
    const unlockTableButton = document.getElementById("unlockbutton").id;
    const parent = tbl.parentElement;
    parent.removeChild(tbl);
    deleteButton(lockTableButton); // Ensure lock button is removed and correctly placed each time table is generated
    deleteButton(unlockTableButton);
}

/* 
Function that creates two input fields to let the user change the size of the matrix
Additionally, it initializes the table (matrix) by calling createTable
*/
function getTable_size() {
    const body = document.body;
    const input_rows = document.createElement('input');
    const input_colums = document.createElement('input');
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${colums}"

    // Object to store variables for the table - basically it's settings
    let TS = {  // Short for TableSettings.
        row_id: "row",       // This id refers to input_rows, not the matrix
        colum_id: "colum",   // This id refers to input_colums, not the matrix
        row_value: 2,
        colum_value: 2,
        max_matrix_size: 10
    };

    let input_width = '50px';  // Make both input boxes's size fit 2 digit numbers
    
    // Add attributes to the row input box
    input_rows.setAttribute("id", TS.row_id);
    input_rows.setAttribute("title", `Input desired row size - max ${TS.max_matrix_size}`);
    input_rows.setAttribute("value", TS.row_value);
    input_rows.setAttribute("type", "number");
    input_rows.style.width = input_width;

    // Add attributes to the colum input box
    input_colums.setAttribute("id", TS.colum_id);
    input_colums.setAttribute("title", `Input desired colum size - max ${TS.max_matrix_size}`);
    input_colums.setAttribute("value", TS.colum_value);
    input_colums.setAttribute("type", "number");
    input_colums.style.width = input_width;

    body.appendChild(input_rows);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(input_colums);
    body.insertBefore(cdot, input_colums);  // insertBefore can be used to insert an element before another element
                                            // (this way you can place it whereever in the code - as opposed to appendChild)

    addEventHandler(TS.row_id, "focusout", TS);
    addEventHandler(TS.colum_id, "focusout", TS);
    addEventHandler(TS.row_id, "enter", TS);
    addEventHandler(TS.colum_id, "enter", TS);

    createTable(TS.row_value, TS.colum_value);  // Initialize table at page load since we don't trigger the eventlisteners there
}

/* 
Function that adds an eventlistener a given element id passed to it
Can be extended with other eventlisteners
Takes three inputs where:
    String: 'type_id' is the element's id (getElementById)
    String: 'handler_type' is the type of the eventlistener (e.g. "focusout")
    Object: 'TS' is an object that contains settings for the table - defined in get_Tablesize
*/
function addEventHandler(type_id, handler_type, TS) {
    let element_id = document.getElementById(`${type_id}`);
    let element_value = TS[`${type_id}_value`];

    switch(handler_type) {
        case "enter": {
            element_id.addEventListener("keypress", (event) => {     // Creates a new table with new rows when pressing "enter" (and deletes the old table)
                if(event.key === 'Enter') {
                    element_value = event.target.value;

                    if(element_value > TS.max_matrix_size) {
                        console.error(`Error: ${type_id} size (${element_value}) is larger than max allowed (${TS.max_matrix_size}). Resetting size to: ${TS.max_matrix_size}`);
                        element_value = TS.max_matrix_size;
                    }
                    deleteTable();
                    if(type_id === "row") {
                        createTable(element_value, TS.colum_value);   
                    }
                    else if(type_id === "colum") {
                        createTable(TS.row_value, element_value);  
                    }
                    else {
                        console.error(`Error: got string id '${type_id}' which is not defined in scope '${handler_type}'`);
                    }
                }
            });
            break;
        }
        case "focusout": {
            element_id.addEventListener("focusout", (event) => {     // Creates a new table with new rows when leaving input box (and deletes the old table)
                element_value = event.target.value;

                if(element_value > TS.max_matrix_size) {
                    console.error(`Error: ${type_id} size (${element_value}) is larger than max allowed (${TS.max_matrix_size}). Resetting size to: ${TS.max_matrix_size}`);
                    element_value = TS.max_matrix_size;
                }
                deleteTable();
                if(type_id === "row") {
                    createTable(element_value, TS.colum_value);   
                }
                else if(type_id === "colum") {
                    createTable(TS.row_value, element_value);  
                }
                else {
                    console.error(`Error: got string id ${type_id} which is not defined in scope '${handler_type}'`);
                }
                });
                break;
        }
        default:
            console.error(`Error: Tried to add an event handler with element id '${type_id}' to '${handler_type}', however, no such element id exists`);
    }
}

/* 
Function that creates the button to make the table read only
Does so via an eventlistener
*/
function lockTableButton(){
    const body = document.body;
    const tbl = document.getElementById("matrix");
    const input = document.createElement('input');

    input.setAttribute("id", "lockbutton");
    input.setAttribute("type","button");
    input.setAttribute("value","Lock");
    body.after(tbl,input);
    input.addEventListener("click", lockTable);
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
Function that deletes any element given to it
Takes the element's id as input
(Right now it's meant to delete buttons - hence the function name)
*/
function deleteButton(id) {
    const button = document.getElementById(`${id}`);
    const parent = button.parentElement;
    parent.removeChild(button);
}

/* 
Function that creates a button to make the table writeable again
Does so via an eventlistener
*/
function unlockTableButton(){
    const body = document.body,
    tbl = document.getElementById("matrix"),
    input = document.createElement("input");
    
    input.setAttribute("id", "unlockbutton");
    input.setAttribute("type","button");
    input.setAttribute("value", "Unlock");
    body.after(tbl,input);
    input.addEventListener("click", unlockTable);
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
function validateButtonInput(){
    const tbl = document.getElementById("matrix");
    const input = tbl.querySelectorAll("input");

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
    dragTarget.appendChild(newElement);
    newElement.style.position = "absolute";
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
    element.setAttribute("style", "-moz-user-select: none; -webkit-user-select: none; -ms-user-select:none; user-select:none;-o-user-select:none;");
    element.addEventListener("click", dragFunctionality)
}

getTable_size();
