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

    // Object to store variables for the table - basically it's settings
    let TS = {
        table_id: "matrix",
        max_input_length: 8,
        cell_width: "100px",    // Width of input cells in the matrix
        placeholder: "0"
    };

    const body = document.body,
    tbl = document.createElement('table');
    tbl.id = TS.table_id; 
    tbl.style.width = TS.cell_width;  // Ensure that each input cell fills out cell in matrix

    /*************************/
    for (let i = 1; i <= rows; i++) {   
        const tr = tbl.insertRow();

        initDrag(tr); // Make rows draggable

        for (let j = 1; j <= colums; j++) { 
            let td = tr.insertCell(); 
            
            const td_input = document.createElement('input');
            td_input.required = ""; // Make each cell element required so user cannot submit an empty matrix
            td_input.placeholder = TS.placeholder;
            td_input.maxlength = TS.max_input_length;
            td_input.style.width = TS.cell_width; // Ensure that each input cell fills out cell in matrix
            td.appendChild(td_input);

            // const math_format = document.createElement('math');
            // math_format.style.width = TS.cell_width;
            // td.appendChild(math_format);

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
        this.row_id = "fish";       // This id refers to the input box, not the matrix
        this.colum_id = "colum";   // This id refers to the input box, not the matrix
        this.type = "number"
        this.row_value = 2;
        this.colum_value = 2;
        this.max_matrix_size = 10;
        this.min_matrix_size = 2;
        this.input_width = "50px";  // Make both input boxes's size fit 2 digit numbers
        this.title = `Input desired row size - max ${this.max_matrix_size}`;
    };

    const body = document.body;
    const Input = {
        row: document.createElement('input'),
        colum: document.createElement('input')
    };
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${colums}"

    // Maybe wanna make a constructor out of this helper function?
    add_Attributes("row", Input, TS);   // Do NOT use TS.row_id as a variable instead of "row" (equivalent for colums). That could cause a serious issue
    add_Attributes("colum", Input, TS);

    body.appendChild(Input.row);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(Input.colum);
    body.insertBefore(cdot, Input.colum);  // insertBefore can be used to insert an element before another element
                                            // (this way you can place it whereever in the code - as opposed to appendChild)  

    createEventListener(TS.row_id, "input", TS);
    createEventListener(TS.colum_id, "input", TS);
    createEventListener(TS.row_id, "click", TS);
    createEventListener(TS.colum_id, "click", TS);

    createTable(TS.row_value, TS.colum_value);  // Initialize table at page load since we don't trigger the eventlisteners there
}

/* 
Helper function that adds attributes to get_Table
*/
function add_Attributes(type, Input, TS) {
    Input[`${type}`].id = TS[`${type}_id`];
    Input[`${type}`].title = TS.title;
    Input[`${type}`].value = TS[`${type}_value`];
    Input[`${type}`].type = TS.type;
    Input[`${type}`].style.width = TS.input_width;
}

/* 
Function that adds an eventlistener a given element id passed to it
Can be extended with other eventlisteners
Takes three inputs where:
    String: 'type_id' is the element's id
    String: 'listener_type' is the type of the eventlistener (e.g. "focusout")
    Object: 'TS' contains settings for the table - defined in get_TableSize
*/
function createEventListener(type_id, listener_type, TS) {
    let element_id = document.getElementById(type_id);
    let element_value = TS[`${type_id}_value`];     // Makes it possible to use a variable to access properties of an object

    switch(listener_type) {
/* Deprecated ****
        case "enter": {
            element_id.addEventListener("keypress", (event) => {     // Creates a new table with a new size when pressing "enter" (and deletes the old table)
                if(event.key === 'Enter') {
                    element_value = event.target.value;
                    helpAddEventListener(type_id, listener_type, TS, element_value);
                }
            });
            break;
        }
        case "focusout": {
            element_id.addEventListener("focusout", (event) => {     // Creates a new table with a new size when leaving input box (and deletes the old table)
                element_value = event.target.value;
                helpAddEventListener(type_id, listener_type, TS, element_value);      
            });   
            break;
        }
         */
        case "input": {
            element_id.addEventListener("input", (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                element_value = event.target.value;
                if(listener_type === "input") {
                    if(element_value > TS.max_matrix_size) {
                        console.error(`Error: ${type_id} size (${element_value}) is larger than max allowed (${TS.max_matrix_size}). Resetting size to: ${TS.max_matrix_size}`);
                        element_value = TS.max_matrix_size;
                    }
                    else if(element_value < TS.min_matrix_size) {
                        console.error(`Error: ${type_id} size (${element_value}) is smaller than min allowed (${TS.min_matrix_size}). Resetting size to: ${TS.min_matrix_size}`);
                        element_value = TS.min_matrix_size;
                    }
                    deleteTable();
                    if(type_id === TS.row_id) {
                        createTable(element_value, TS.colum_value);
                        TS.row_value = element_value;   
                    }
                    else if(type_id === TS.colum_id) {
                        createTable(TS.row_value, element_value);
                        TS.colum_value = element_value;   
                    }
                    else {
                        console.error(`Error: got string id '${type_id}' which is not defined in scope '${listener_type}'`);
                    }
                    document.getElementById(type_id).value = element_value; 
                }     
            });   
            break;
        }
        case "click": {
            element_id.addEventListener("click", (event) => {     // Creates a new table with a new size when changing values (and deletes the old table)
                element_id.focus();
                element_id.select();   
            });   
            break;
        }
        default:
            console.error(`Error: tried to add an event listener called '${listener_type}' to element id '${type_id}', however, no such event listener exists`);
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
*/
function deleteElement(id) {
    const element = document.getElementById(`${id}`);
    const parent = element.parentElement;
    parent.removeChild(element);
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

//Running The Program*/
getTable_size();