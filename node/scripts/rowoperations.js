
import {sanitize, pushToHistory} from "./app_GE.js"
import {attachToParent, lineUpAncestors} from "./positioning.js" // Used for positioning buttons
import {swapRows} from "./app_math.js"
//import {sanitize} from "../scripts/app_GE.js" // Used for scale button input 
/**
 * This function takes a table and a row-element for said table and finds its base-0 index as if the table was an array of arrays.
 * If an index is found, it is returned as an integer, but if no index is found, the function returns a null-value.
 * @param {HTMLElement} table is an HTML-element of type "table" or "tbody".
 * @param {HTMLElement} row is an HTML-element of type "tr".
 * @returns {Number} the base-0 index of the row with respect to the table- or tbody-element.
 */
function searchForRowIndex(table, row){
    const rowList = table.querySelectorAll("tr");
    rowList.forEach((element, index) => {
        if(element === row){
            return index;
        }
    });
    return null;
}
/**
 * This function is a (probably) faster version of searchForRowIndex and uses RegEx to sift through the ID of a given element.
 * Note that this function only works if the ID of the row contains its base-0 index terminated by a "_"-character at the end!
 * @param {HTMLElement} row an HTML-element of type "tr" with an ID where the last sequence of digits that correspond to its base-0 index is held after an underscore (_).
 * @returns {Number} the string of digits at the end of the element's ID, or null if there are none.
 */
function extractRowIndex(row){
    const idMatch = (row.id.match(/\d+$(?!\_)/));
    if(idMatch.length >= 0){
        return Number(idMatch);
    } else {
        return null;
    }
}
/**
 * This function swaps two rows in an HTML-table and in an array of arrays representing it
 * when given the table element and the two row-elements.
 * This function does not make any changes to cells!!
 * @param {HTMLElement} table is the HTML table- or tbody-element where the swap takes place
 * @param {HTMLElement} rowA is the first row element.
 * @param {HTMLElement} rowB is the second row element, which should trade places with the first.
 * @param {Array} tableArray is an optional argument that represents the table as an array of rows.
 */
function swapTableRows(table, rowA, rowB, tableArray){  //NEEDS WORK!!!!!
    //entering a try-clause so we can throw an error if "table" is not a table- or tbody-tag
    try{
        //check if the "table" argument is a table or a tbody
        if(table.tagName.toUpperCase() !== "TABLE" && table.tagName.toUpperCase() !== "TBODY"){
            throw new Error(`Argument "table" is not a table or tbody`);
        }
        //if tableArray is given, swap the elements there
        //beware that we don't check if the tableArray actually represents the table!
        if(tableArray){
            //defining indexes of the two rows. The extractRowIndex-function requires a specific ID-format for the rows, but works fast.
            //a different function to find the indeces could be used instead without issue
            const indexA = extractRowIndex(rowA), 
                  indexB = extractRowIndex(rowB);
    
            //reusing swapRows from app_math.js to swap the rows
            swapRows(indexA, indexB, tableArray);
        }

        //with the array elements swapped, we move on to swapping the rows in the HTML-table.
        //we use updateTableFromArray for this task
        updateTableFromArray(table, tableArray, [indexA, indexB])
        sessionStorage.setItem("currentTable", JSON.stringify(tableArray));
        pushToHistory(tableArray);
    } catch(error) {
        console.error(error);
    }
}
/**
 * This function implements row addition and subtraction for matrices. 
 * It manipulates the 2D array which forms the underlying representation of the HTML-table. 
 * Note that rowA is subtracted/added to rowB without changing rowA 
 * @param {HTMLElement} table - html representation of the current table
 * @param {HTMLElement} rowA - html representation of the rowA of type "tr"
 * @param {HTMLElement} rowB - html representaion of rowB  of type "tr"
 * @param {Array} tableArray - 2D array that represents the backend version of the matrix 
 */
function addRows(table, rowA, rowB, tableArray){
    // Ensure that operation is always valid by checking length of both rows 
    try{
        // Find index of rows to add
        const indexA = searchForRowIndex(table, rowA),
        indexB = searchForRowIndex(table, rowB);
         
        if(indexA === null || indexB === null){ // Rows index may not be found
            throw new Error("One or both row indexes were not found");
        }
        let row1 = tableArray[indexA];
        let row2 = tableArray[indexB];
        if(row1.length !== row2.length){ // Rows may not be of same length
            throw new Error("Rows are not of the same length and cannot be added");
        }
        // Note that this loop changes the values of tableArray and not its copy 
        for(let i = 0; i < rowA.length; i++){
            row2[i] += row1[i];
        }
        updateTableFromArray(table,tableArray,[indexB],"input", "value");
        sessionStorage.setItem("currentTable", JSON.stringify(tableArray)); // Update global table array objects
        pushToHistory(tableArray);
    }
    catch(error){
        console.log(`${error.message}`);
    }
}

/**
 * Updates a table given as the first argument with the data from the second argument, an array of arrays.
 * The ith row in the table uses the ith element from the array of arrays and copies one entry from the subarray into every table cell.
 * 
 * The third argument is optional and controls which rows of the table should be updated. If excluded, every row is updated.
 * 
 * The fourth argument is also optional and can be used to select specific elements within each table cell. It must be a valid CSS selector string, like one used with querySelector.
 * 
 * The fifth argument specifies which attribute of a cell's target element to change. The default is innerHTML.
 * 
 * Remember to sanitize the data in tableArray!
 * @param {HTMLElement} table is an HTML table-lement or HTML tbody-element.
 * @param {Array} tableArray is an array of arrays representing the data that should be placed in the table.
 * @param {Array} options is an array of integers specifying the base-0 index of the rows that should be updated.
 * If excluded, every row in the table will be updated. Both positive and negative values are allowed.
 * @param {String} query is an optional CSS selector string used to identify and target elements within the table cells.
 * @param {String} attribute is a specific attribute of the target element to modify instead of its innerHTML. Passed as a string like "value" and used with element.setAttribute.
 */
function updateTableFromArray(table, tableArray, options, query, attribute){
    //get an iterable list of rows in the table
    let rows = table.querySelectorAll("tr");
    console.log(`Table is "${table}\nWill try to update it to look like ${tableArray}\nSelected rows are ${options}`);
    //check if there are any specific rows to update and trim the row list if there is
    if(Array.isArray(options)){

        //create a new array and add the elements from the original array
        //indexed by the numbers in the options-array note the use of .at(),
        //which allows the use of negative integers and counts from the back of the array instead of the front
        const trimmedRows = new Array;

        //making rows into a normal array instead of a nodelist so we can index it
        rows = Array.from(rows);
        console.log(`Row(s) targeted by updateTable is ${options}`);
        options.forEach(element => {
            trimmedRows.push(rows.at(element));
        });
        //overwrite rows with the trimmed version
        rows = trimmedRows;
    }
    console.log(`Trimmed rows are\n${rows}`);
    if(!attribute || attribute.length < 0){
        attribute = "innerHTML";
    }
    //now that we know which rows to work on, we get the elements in each row and write new values in them.
    //since querySelectorAll returns an iterable object, we can use the index-argument in forEach's callback
    //as it would correspond to the value representing that cell in the array of arrays.
    //but first we need to check if we shoud include the extra query and/or the options:
    let modeSelector = 0;
    if(query && typeOf(query) === "string"){
        modeSelector += 1;
    }
    if(Array.isArray(options)){
        modeSelector += 2;
    }
    switch (modeSelector) {
        case 3:
            
            break;
    
        default:
            break;
    }

    if(query && query.length > 0 && Array.isArray(options)){
        console.log(`Modifying elements queried by "${query}"`);
        rows.forEach((row, i) => { //Consider if options is [0,1,4,3], then rows is [Row0, Row1, Row4, Row3] but tableArray is still [Row0, Row1, Row2, Row3, Row4]. We must use options[i] instead of i to index tableArray if we want to modify the ith row
            console.log(`Working on row #${i} which is ${row} with id ${row.id}`)
            row.querySelectorAll("td").forEach((cell, j) => {
                console.log(`Working on cell${j} with id ${cell.id}`);
                cell.querySelector(query)[attribute] = tableArray[options[i]][j];   //accessing the property with a string in square brackets can be done for any object 
            })
    });
    } else {
        console.log("No query received. Modifying cells instead")
        rows.forEach((row, i) => {
            row.querySelectorAll("td").forEach((cell, j) => {
                cell[attribute] = tableArray[options[i]][j];
            })
    });
    }
    //note: We use .innerHTML as our default at tribute to set in each cell. This adds flexibility to what we can put in the table
    //through the tableArray i.e. any HTML-code we want. We use setAttribute to access attributes, since it allows for strings to be passed.
    //The data we set might need sanitizing first. We assume another function has done that before this function is run.
}

/**
 * Fills every cell in a table given as the first argument with the content from the second argument.
 * 
 * The second argument represents the content should be placed in the table as a string. Optional and defaults to an empty string.
 * 
 * The third argument is optional and controls which rows of the table should be updated. If excluded, every row is updated.
 * 
 * The fourth argument is also optional and can be used to select specific elements within each table cell. It must be a valid CSS selector string, like one used with querySelector.
 * 
 * The fifth argument specifies which attribute of a cell's target element to change. The default is innerHTML.
 * 
 * Remember to sanitize the content if it is user-made!
 * @param {HTMLelement} table is an HTML table-lement or HTML tbody-element.
 * @param {Array} content is a string of the content that should be placed in every cell. For example, "<input>" for an input element of "0" for the number 0.
 * @param {Array} options is a set of integers specifying the base-0 index of the rows that should be updated.
 * If excluded, every row in the table will be updated. Both positive and negative values are allowed.
 * @param {String} query is an optional CSS selector string used to identify and target elements within the table cells.
 * @param {String} attribute is a specific attribute of the target element to modify instead of its innerHTML. Passed as a string like "value" and used with element.setAttribute.
 */
function fillTable(table, content, options, query, attribute){
    //get an iterable list of rows in the table
    let rows = table.querySelectorAll("tr");

    //define the content if it is not specified
    if(!content || content.length < 0){
        content = "";
    }

    //check if there are any specific rows to update and trim the row list if there is
    if(options instanceof Array || options instanceof Set){  //could also use isArray() for this check, but then a Set would not work as input

        //create a new array and add the elements from the original array
        //indexed by the numbers in the options-array note the use of .at(),
        //which allows the use of negative integers and counts from the back of the array instead of the front
        const trimmedRows = new Array;
        options.forEach(element => {
            trimmedRows.push(tableArray.at(element));
        });
        //overwrite rows with the trimmed version
        rows = trimmedRows;
    }

    if(!attribute || attribute.length < 0){
        attribute = "innerHTML";
    }

    //now that we know which rows to work on, we get the elements in each row and write the content in them.
    //but first we need to check if we shoud include the extra query:
    if(query && query.length > 0){
        rows.forEach((row) => {
            row.querySelectorAll("td").forEach((cell) => {
                cell.querySelector(query)[attribute] = content;
            })
    });
    } else {
        rows.forEach((row) => {
            row.querySelectorAll("td").forEach((cell) => {
                cell[attribute] = content;
            })
    });
    }
    //note: We use .innerHTML as our default attribute to set in each cell. This adds flexibility to what we can put in the table
    //through the tableArray i.e. any HTML-code we want. We use setAttribute to access attributes, since it allows for strings to be passed.
    //The data we set might need sanitizing first. We assume another function has done that before this function is run.
}

/** NEW ROW ADD STARTS HERE
 * 1 Create elements in dom and change layout 
 * 2 Handler to move scale- and add-button and change scaling targets
 * 3 Handler to block movement of add-button and show extra interface
 * 4 draggingStopped-handler to copy extra row into empty field and show GO-button
 * 5 Go button calls add rows correctly
 * 6 Handler to remove extra interface when clicking outside table 
 */

/* Global settings to manage row operations since the layout makes it difficult to keep track of which rows are the target of which row operations.
* This is especially true of adding rows where both rows need to be kept track of. 
*/ 

//defining some pseudo-global settings in sessionStorage - to be used in main.js
//everything is stored as strings
sessionStorage.setItem("primaryRow", "");           //the ID of the primary row
sessionStorage.setItem("primaryScaleFactor", "");
sessionStorage.setItem("secondaryRow", "");         //the ID of the secondary row
sessionStorage.setItem("secondaryScaleFactor", "");
sessionStorage.setItem("addButton", "");
sessionStorage.setItem("primaryScaleField", "");
sessionStorage.setItem("allowInterfaceMoving", "");
sessionStorage.setItem("allowRowSwap", "true");

/*
// Returns the selected setting element as a JSON 
function getAndParse(setting_key, setting_value){
    const item = getItem(setting_key);

    // In order to set an item in sessions storage, its value has to be a string. 
    if(typeof(setting_key) === "object"){
        setting_key = JSON.stringify(setting_key); // For html elements
    }
    else{
        setting_key = string(setting_key)
    };
    try{
        sessionStorage.setItem(setting_key, setting_value); // MDN specifies that 
    }
    catch(error){
        console.error(error);
    }
    return JSON.parse(item);    
}

const ROW_OPERATION_MANAGER = {
        primaryRow: undefined,
        primaryScaleFactor: undefined,
        secondaryRow: undefined,
        secondaryScaleFactor: undefined,
        addButton: undefined,           //references to the add_button and primary scaling field
        primaryScaleField: undefined,
        allowInterfaceMoving: true, // We use this attribute to check whether the add interface may be moved to the another row
        allowRowSwap:true
};
*/
/**
 * This function creates a scale field consisting of an input button, a scale button. 
 * It add event listeners the the scale button that scales the target row. 
 * Note that the target row is obtained using the global object ROW_OPERATION_MANAGER
 * @param {string} target_row - is a string used to index the global object ROW_OPERATION_MANAGER to find the target row. Could be "primaryRow" or "secondaryRow"
 * @returns {HTMLelement} - is a HTML div that contains and input and a scale button
 */

//create a set of HTML elements to act as an interface for scaling
function createScaleField(target_row, factor_name, table){
    // We create input box that becomes child of scale field  
    const scalar_input = document.createElement("input");
    scalar_input.type = "number";
    scalar_input.classList.add("scale_field");
    scalar_input.addEventListener("change", event => {
        sessionStorage.setItem(factor_name, event.currentTarget.value);
    })

    // We create the scale button that is attached to scalefield
    const scale_button = document.createElement("button");
    scale_button.innerHTML = "Scale";

    // When scale button is clicked, the target row is scaled if it exists. 
    scale_button.addEventListener("click", event => {
        //scale_target = ROW_OPERATION_MANAGER[target_row];
        const scale_target = document.getElementById(sessionStorage.getItem(target_row));
        if(!scale_target){ // Row has to exist in order to scale it.
            console.warn(`Expected "${target_row}" from session storage but recieved "${scale_target}"`);
        } else {
            //scaleRow(table, scale_target, scalar_input.value, CURRENT_TABLE);
            scaleRow(table, scale_target, scalar_input.value, JSON.parse(sessionStorage.getItem("currentTable")));
        }
    });

    // We create scale field and add attributes to it
    const scale_field = document.createElement("div"); // We use div so that multiple elements can be children of a scale field
    scale_field.addEventListener("click", event => {event.stopPropagation()}); // We do not want click to propgate to dragfunctionality 
    document.body.appendChild(scale_field);   
    scale_field.classList.add("scale_field"); // We create a class so we can hide an element using CSS
    scale_field.id = `${target_row}_scale_field`; // May not necessary -> Test!
    scale_field.appendChild(scalar_input);
    scale_field.appendChild(scale_button);
    scale_field.addEventListener("mouseover", event => {event.stopPropagation()}); // We stop the mouseOver-event from bubbling to target row to prevent unnecessary listeners - the scalefield has already been moved, we don't need to check whether it needs to move again.

    
    return scale_field;
}
/**
 * @param {HTMLelement} table - frontend representation of 
 * @returns {Array} - is an array of the HTML-elements used to create and addInterfact. '
 * Note that this may be used to attach an add button to table and attach children to this button using LineUp ancestors
 */

//create a set of HTML elements to act as the row addition interface
function createAddInterface(table){
    // Create add button
    const add_button = document.createElement("button");
    add_button.innerHTML = "+";
    add_button.id = "add_button_id";

    // Create scale field and make it hidden
    const scale_field = createScaleField("secondaryRow", "secondaryScaleFactor", table);
    scale_field.style.visibility = "hidden";
    scale_field.addEventListener("change", event => {
        sessionStorage.setItem("secondaryScaleFactor", String(event.target.value));
        //ROW_OPERATION_MANAGER.secondaryScaleFactor = event.target.value;
    });
    
    // Create a table to hold the row we're going to add and hide it for later
    const row_holder = document.createElement("table");
    row_holder.style.visibility = "hidden";
    row_holder.style.backgroundColor = "red";    //temporary styling to make it visible
    row_holder.style.width = "300px";            //who knows if this is big enough

    // Create add button and hide it
    const go_button = document.createElement("button");
    go_button.innerHTML = "Add!";
    go_button.style.visibility = "hidden";

    // Setup relationships between the elements
    document.body.appendChild(add_button);
    add_button.appendChild(scale_field);
    scale_field.appendChild(row_holder);
    row_holder.appendChild(go_button);

    //if the add_button was clicked, we disallow moving the interface and show the rest of it
    //we also stop propagation to prevent a drag from starting
    add_button.addEventListener("click", event => {
        event.stopPropagation();
        if(event.target === add_button){
            scale_field.style.visibility = "visible";
            attachToParent(scale_field);
            row_holder.style.visibility = "visible";
            attachToParent(row_holder);
            //ROW_OPERATION_MANAGER.allowInterfaceMoving = false;
            sessionStorage.setItem("allowInterfaceMoving", "");     //an empty string is falsy, so we write that instead of "false", since a non-empty string is truthy
            console.log("Locking interface to this row");

            //preparing a listener to cancel the addition operation if the user clicks outside the interface or table
            //note that dragging or dropping elements does not produce click events that reach the document
            document.addEventListener("click", () => {
                scale_field.style.visibility = "hidden";
                row_holder.style.visibility = "hidden";
                go_button.style.visibility = "hidden";
                if(held_row){
                    row_holder.removeChild(held_row);
                }
                //ROW_OPERATION_MANAGER.secondaryScaleFactor = 1;
                sessionStorage.setItem("secondaryScaleFactor", "1");
                //ROW_OPERATION_MANAGER.secondaryRow = null;
                sessionStorage.setItem("secondaryRow", "");
                //ROW_OPERATION_MANAGER.allowInterfaceMoving = true;
                sessionStorage.setItem("allowInterfaceMoving", "true");
                console.log("Cancelling addition operation");
            }, {once: true})    //might need to be capturing. Testing required
        }
    });
    //creating a variable to hold the row we need to add to the other one
    //we also set up a listener to detect when we've selected the row we want and show the go_button
    let held_row = undefined;
    row_holder.addEventListener("draggingStopped", event => {
        held_row = event.detail.cloneNode(true);
        row_holder.appendChild(held_row);
        //ROW_OPERATION_MANAGER.secondaryRow = held_row;
        sessionStorage.setItem("secondaryRow", held_row.id);
        go_button.style.visibility = "visible";
        attachToParent(go_button);
        console.log("Caught a row");
    });

    //performing the actual addition and resetting the interface when the go_button is clicked
    go_button.addEventListener("click", () => {
        //addRows(table,ROW_OPERATION_MANAGER.secondaryRow, ROW_OPERATION_MANAGER.primaryRow,CURRENT_TABLE);
        //addRows(table, document.getElementById(sessionStorage.getItem("secondaryRow")), document.getElementById(sessionStorage.getItem("primaryRow")),CURRENT_TABLE);
        addRows(table, document.getElementById(sessionStorage.getItem("secondaryRow")), document.getElementById(sessionStorage.getItem("primaryRow")), JSON.parse(sessionStorage.getItem("currentTable")));
        scale_field.style.visibility = "hidden";
        row_holder.style.visibility = "hidden";
        go_button.style.visibility = "hidden";
        if(held_row){
            row_holder.removeChild(held_row);
        }
        //ROW_OPERATION_MANAGER.secondaryScaleFactor = 1;
        sessionStorage.setItem("secondaryScaleFactor", "1");
        //ROW_OPERATION_MANAGER.secondaryRow = null;
        sessionStorage.setItem("secondaryRow", "");
        //ROW_OPERATION_MANAGER.allowInterfaceMoving = true;
        sessionStorage.setItem("allowInterfaceMoving", "true");
        console.log("Adding rows and packing up");
    });
    
    return [add_button, scale_field, row_holder, go_button];
}

//a function designed for use in a mouseover-eventhandler
//it checks if the addition/scaling interface is allowed to move and moves it if the row that's being moused over is not where the interface is at
/**
 * 
 * @param {event} event - mouseover event that checks if the scale field, add button and the add button's children should be moved to another row.  
 */
function moveInterface(event){
    if(sessionStorage.getItem("allowInterfaceMoving")){
        const target_row = event.currentTarget;
        if(//target_row !== ROW_OPERATION_MANAGER.primaryRow
            target_row.id !== sessionStorage.getItem("primaryRow")){
            //ROW_OPERATION_MANAGER.primaryRow = target_row;
            sessionStorage.setItem("primaryRow", target_row.id);
            //ROW_OPERATION_MANAGER.primaryScaleFactor = 1;
            sessionStorage.setItem("primaryScaleFactor", "1");
            //ROW_OPERATION_MANAGER.secondaryRow = null;
            sessionStorage.setItem("secondaryRow", "");
            //ROW_OPERATION_MANAGER.secondaryScaleFactor = 1;
            sessionStorage.setItem("secondaryScaleFactor", "1");
            document.getElementById(sessionStorage.getItem("primaryRow")).appendChild(document.getElementById(sessionStorage.getItem("primaryScaleField")));
            document.getElementById(sessionStorage.getItem("primaryRow")).appendChild(document.getElementById(sessionStorage.getItem("addButton")));
            //attachToParent(ROW_OPERATION_MANAGER.primaryScaleField, true);
            attachToParent(document.getElementById(sessionStorage.getItem("primaryScaleField")), true);
            //attachToParent(ROW_OPERATION_MANAGER.addButton);
            attachToParent(document.getElementById(sessionStorage.getItem("addButton")));
            console.log("Moving interface and updating/resetting");        
        }
    }
}

//multiplies every element in a row with a given scalar and updates the frontend to reflect this
/**
 * @param {HTMLelement} table is an HTML table- or tbody-element that holds the row that is being scaled
 * @param {HTMLelement} row is an HTML tr-element and holds the elements that should be scaled
 * @param {Number} scalar is the number all elements in the row should be multiplied with
 * @param {Array} tableArray is an array of arrays where the backend representation of the row is stored. This is where the actual scaling happens
 */
function scaleRow(table,row,scalar,tableArray){
    try{
        const index = extractRowIndex(row);
        const row_to_scale = tableArray[index];
        console.log(`Scaling row #${index} by multiplying with ${scalar}\nRow to scale looks like ${row_to_scale}`);
        if(row_to_scale === undefined){
            throw new Error(`Row ${row_to_scale} not found`);
        }
        row_to_scale.forEach((element, i) => (row_to_scale[i] = element * scalar));
        updateTableFromArray(table, tableArray, [index], "input", "value");
        sessionStorage.setItem("currentTable", JSON.stringify(tableArray));
        pushToHistory(tableArray);
    }
    catch(error){
        console.log(`${error.message}\n${error.lineNumber}`);
    }
}


export {updateTableFromArray, fillTable, createScaleField, moveInterface, createAddInterface}