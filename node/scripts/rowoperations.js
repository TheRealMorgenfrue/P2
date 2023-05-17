
import {pushToHistory, writeSolutionMessage, resizeInputFields} from "./app_GE.js"
import {attachToParent} from "./positioning.js" // Used for positioning buttons
import {swapRows} from "./app_math.js"
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
 * This function is designed for use in a draggingStopped-eventListener and will swap the row
 * given by event.detail with the row given by event.currentTarget. It goes without saying that this listener should be placed on every row in a table,
 * since draggingStopped-events usually happen on cells, and so using event.target would cause a number of issues.
 * The function works on the backend and calls updateTableFromArray to update the frontend.
 *
 * It is currently hardcoded to use "currentTable" from the sessionStorage as the backend representation. Check the function body for details.
 * @param {event} event is a customEvent with event.detail being a row and event.target being another row.
 * Both rows must have an ID ending with an underscore followed by their corresponding index in the backend-representation of the matrix.
 * We also assume that "currentTable" represents a tbody-element that is a parent of both rows.
 */
function swapTableRows(event){
    const indexA = extractRowIndex(event.currentTarget),   //the index of the row where the drag ended
          indexB = extractRowIndex(event.detail),          //the index of the row that was dragged to event.target
          tableArray = JSON.parse(sessionStorage.getItem("currentTable"));
    //reusing swapRows from app_math.js to swap the rows in the backend

    //removing the addInterface if it's there. Not the fastest way, since we use 3 querySelectors, but it works
    const add_button = document.getElementById("add_button_id");
    //check if the addInterface is shown by checking if anything after add_button has been made visible
    if(add_button.firstElementChild.style.visibility !== "hidden"){
        resetAddInterface(add_button.querySelector("div"), add_button.querySelector("table"), add_button.querySelector("table > button"));
        //moving the interface to the row we just clicked on since the interface is locked at this point
        moveInterface(event);
    }

    swapRows(indexA, indexB, tableArray);
    console.log(`Dropped ID: ${event.detail.id} on ID: ${event.currentTarget.id}`);
    //with the array elements swapped, we move on to swapping the rows in the HTML-table.
    //we use updateTableFromArray for this task, with event.target.parentElement being the tbody-element where _both_ rows are
    updateTableFromArray(event.currentTarget.parentElement, tableArray, [indexA, indexB], "input", "value");
    sessionStorage.setItem("currentTable", JSON.stringify(tableArray));
    pushToHistory(tableArray);
    writeSolutionMessage(tableArray);
    
    let add_rows_event = new CustomEvent("GEoperation", {bubbles:true, detail:`Row ${indexA+1} swapped with row ${indexB+1}.`}); 
    event.currentTarget.dispatchEvent(add_rows_event);
    // Firing another event so that we can resize both rows as needed.
    add_rows_event = new CustomEvent("GEoperation", {bubbles:true, detail:""});
    document.getElementById(event.detail.id).dispatchEvent(add_rows_event); 
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
 * @param {HTMLElement} table is an HTML table-element or HTML tbody-element.
 * @param {Array} tableArray is an array of arrays representing the data that should be placed in the table.
 * @param {Array} options is an array of integers specifying the base-0 index of the rows that should be updated.
 * If excluded, every row in the table will be updated. Both positive and negative values are allowed.
 * @param {String} query is an optional CSS selector string used to identify and target elements within the table cells.
 * @param {String} attribute is a specific attribute of the target element to modify instead of its innerHTML. Passed as a string like "value" and used with element.setAttribute.
 */
function updateTableFromArray(table, tableArray, options, query, attribute){
    //get an iterable list of rows in the table
    //making rows into a normal array instead of a nodelist so we can index it
    let rows = Array.from(table.querySelectorAll("tr"));
    console.log(`Will try to update table to look like ${tableArray}\nSpecific rows given are ${options}`);
    //check if there are any specific rows to update and trim the row list if there is
    if(Array.isArray(options)){

        //create a new array and add the elements from the original array
        //indexed by the numbers in the options-array note the use of .at(),
        //which allows the use of negative integers and counts from the back of the array instead of the front
        const trimmedRows = new Array;

        console.log(`Row(s) targeted by updateTable is ${options}`);
        options.forEach(element => {
            trimmedRows.push(rows.at(element));
        });
        //overwrite rows with the trimmed version
        rows = trimmedRows;
    }
    //console.log(`Rows are ${rows} after trimming`);
    if(!attribute || attribute.length < 0){
        attribute = "innerHTML";
    }
    //now that we know which rows to work on, we get the elements in each row and write new values in them.
    //since querySelectorAll returns an iterable object, we can use the index-argument in forEach's callback
    //as it would correspond to the value representing that cell in the array of arrays.
    //but first we need to check if we shoud include the extra query and/or the options:
    let modeSelector = 0;
    if(Array.isArray(options)){
        modeSelector += 2;
    }
    if(query && typeof query === "string"){
        modeSelector += 1;
    }
    switch (modeSelector) {
        case 3: //both options and query are given:
            console.log(`Got query:${query} and options: ${options}`);
            rows.forEach((row, i) => { //Consider if options is [0,1,4,3], then rows is [Row0, Row1, Row4, Row3] but tableArray is still [Row0, Row1, Row2, Row3, Row4]. We must use options[i] instead of i to index tableArray if we want to modify the ith row
                //console.log(`Working on row #${i} which is ${row} with id ${row.id}\nThis row should look like ${tableArray[i]}`)
                row.querySelectorAll("td").forEach((cell, j) => {
                    //console.log(`Working on cell #${j} with id ${cell.id}`);
                    cell.querySelector(query)[attribute] = tableArray[options[i]][j];   //accessing the property with a string in square brackets can be done for any object
                })
            });
            break;
        case 2: //options is given but query is not
            console.log(`Got no query and options: ${options}`);
            rows.forEach((row, i) => {
                row.querySelectorAll("td").forEach((cell, j) => {
                    cell[attribute] = tableArray[options[i]][j];
                })
            });
            break;
        case 1: //query is given but options is not
            console.log(`Got query:${query} and no options`);
            rows.forEach((row, i) => {
                //console.log(`Working on row #${i} which is ${row} with id ${row.id}`)
                row.querySelectorAll("td").forEach((cell, j) => {
                    //console.log(`Working on cell #${j} with id ${cell.id}`);
                    cell.querySelector(query)[attribute] = tableArray[i][j];
                })
            });
            break;
        default://options and query are both not given
            console.log(`Got neither options nor query`);
            rows.forEach((row, i) => {
                row.querySelectorAll("td").forEach((cell, j) => {
                    cell[attribute] = tableArray[i][j];
                })
            });
    }
    //note: We use .innerHTML as our default attribute to set in each cell. This adds flexibility to what we can put in the table
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
 * @param {HTMLElement} table is an HTML table-lement or HTML tbody-element.
 * @param {String} content is a string of the content that should be placed in every cell. For example, "<input>" for an input element of "0" for the number 0.
 * @param {Array} options is a set of integers specifying the base-0 index of the rows that should be updated.
 * If excluded, every row in the table will be updated. Both positive and negative values are allowed.
 * @param {String} query is an optional CSS selector string used to identify and target elements within the table cells.
 * @param {String} attribute is a specific attribute of the target element to modify instead of its innerHTML. Passed as a string like "value" and used with element.setAttribute.
 */
function fillTable(table, content, options, query, attribute){
    //get an iterable list of rows in the table
    let rows = Array.from(table.querySelectorAll("tr"));

    //define the content if it is not specified
    if(!content || content.length < 0){
        content = "";
    }

    //check if there are any specific rows to update and trim the row list if there is
    if(Array.isArray(options)){  //could also use isArray() for this check, but then a Set would not work as input

        //create a new array and add the elements from the original array
        //indexed by the numbers in the options-array note the use of .at(),
        //which allows the use of negative integers and counts from the back of the array instead of the front
        const trimmedRows = new Array;
        options.forEach(element => {
            trimmedRows.push(rows.at(element));
        });
        //overwrite rows with the trimmed version
        rows = trimmedRows;
    }

    if(!attribute || attribute.length < 0){
        attribute = "innerHTML";
    }

    //now that we know which rows to work on, we get the elements in each row and write the content in them.
    //but first we need to check if we shoud include the extra query:
    let modeSelector = 0;
    if(Array.isArray(options)){
        modeSelector += 2;
    }
    if(query && typeof query === "string"){
        modeSelector += 1;
    }
    switch (modeSelector) {
        case 3: //both options and query are given:
            console.log(`Got query:${query} and options: ${options}`);
            rows.forEach((row) => {
                row.querySelectorAll("td").forEach((cell) => {
                    cell.querySelector(query)[attribute] = content;   //accessing the property with a string in square brackets can be done for any object
                })
            });
            break;
        case 2: //options is given but query is not
            console.log(`Got no query and options: ${options}`);
            rows.forEach((row) => {
                row.querySelectorAll("td").forEach((cell) => {
                    cell[attribute] = content;
                })
            });
            break;
        case 1: //query is given but options is not
            console.log(`Got query:${query} and no options`);
            rows.forEach((row) => {
                row.querySelectorAll("td").forEach((cell) => {
                    cell.querySelector(query)[attribute] = content;
                })
            });
            break;
        default://options and query are both not given
            console.log(`Got neither options nor query`);
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

//defining some pseudo-global settings in sessionStorage - to be used in main.js
//everything is stored as strings
sessionStorage.setItem("primaryRow", "");           //the ID of the primary row
sessionStorage.setItem("primaryScaleFactor", "");   // The scalar value of a row
sessionStorage.setItem("secondaryRow", "");         //the ID of the secondary row
sessionStorage.setItem("secondaryScaleFactor", "");
sessionStorage.setItem("bufferScaleFactor","");
sessionStorage.setItem("bufferRow","");             // The elements of the buffer row as a JSON string
sessionStorage.setItem("addButton", "");
sessionStorage.setItem("primaryScaleField", "");
sessionStorage.setItem("allowInterfaceMoving", "");
sessionStorage.setItem("allowRowSwap", "true");     //currently unused
sessionStorage.setItem("currentTable", "");         // Table representation of the current table

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
    scalar_input.value = 1;
    scalar_input.classList.add("scale_field");
    scalar_input.id = `${target_row}_scale_input`;
    scalar_input.addEventListener("change", event => {
        sessionStorage.setItem(factor_name, event.currentTarget.value);
    })

    // We create the scale button that is attached to scalefield
    const scale_button = document.createElement("button");
    scale_button.innerHTML = "Scale";
    scale_button.id = `${target_row}_scale_button`;

    // When scale button is clicked, the target row is scaled if it exists.
    scale_button.addEventListener("click", event => {
        const scale_target = document.getElementById(sessionStorage.getItem(target_row));
        if(!scale_target){ // Row has to exist in order to scale it.
            console.warn(`Expected "${target_row}" from session storage but recieved "${scale_target}"`);
        } else {
            scaleRow(table, scale_target, scalar_input.value, JSON.parse(sessionStorage.getItem("currentTable")));
        }
    });

    // We create scale field and add attributes to it
    const scale_field = document.createElement("div"); // We use div so that multiple elements can be children of a scale field
    scale_field.addEventListener("click", event => {event.stopPropagation()}); // We do not want click to propgate to dragfunctionality
    document.body.appendChild(scale_field);
    scale_field.classList.add("scale_field"); // We create a class so we can hide an element using CSS
    scale_field.id = `${target_row}_scale_field`; // May not be necessary -> Test!
    scale_field.appendChild(scalar_input);
    scale_field.appendChild(scale_button);
    scale_field.addEventListener("mouseover", event => {event.stopPropagation()}); // We stop the mouseOver-event from bubbling to target row to prevent unnecessary listeners - the scalefield has already been moved, we don't need to check whether it needs to move again.

    return scale_field;
}
/**
 * Create a set of HTML elements to act as the row addition interface.
 *
 * Note that this may be used to attach an add button to table and attach children to this button using LineUp ancestors.
 * @param {HTMLelement} table frontend representation of
 * @returns {Array} is an array of the HTML-elements used to create and addInterfact.
 */
function createAddInterface(table){
    // Create add button
    const add_button = document.createElement("button");
    add_button.innerHTML = "+";
    add_button.id = "add_button_id";
    add_button.style.height = "20px"; // IF YOU SEE THIS COMMENT, MOVE THE STYLING TO CSS - VALUES ARE PICKED ARBITRARILY
    add_button.style.width = "20px";

    // Create a table to hold the row we're going to add and hide it for later
    const row_holder = document.createElement("table");
    row_holder.style.visibility = "hidden";
    row_holder.style.backgroundColor = "white";    //temporary styling to make it visible without a row in it
    row_holder.style.width = "300px";
    row_holder.style.height = "20px";            //who knows if this is big enough
    row_holder.id = "row_holder_id";
    row_holder.style.borderCollapse = "collapse"; // Make the borders smaller

    // Create scale field and make it hidden
    const scale_field = createSafeScaleField(row_holder);
    scale_field.style.visibility = "hidden";
    scale_field.addEventListener("change", event => {
        sessionStorage.setItem("secondaryScaleFactor", String(event.target.value));
    });

    // Create go button and hide it
    const go_button = document.createElement("button");
    go_button.innerHTML = "Add!";
    go_button.style.visibility = "hidden";
    go_button.id = "go_button_id";

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
            row_holder.style.marginTop = "15px"; // Offset the row holder downwards from it's original position to make room for the scale field
            sessionStorage.setItem("allowInterfaceMoving", "");     //an empty string is falsy, so we write that instead of "false", since a non-empty string is truthy
            console.log("Locking interface to this row");

            //preparing a listener to cancel the addition operation if the user clicks outside the interface or table
            //note that dragging or dropping elements does not produce click events that reach the document
            document.addEventListener("click", () => {

                resetAddInterface(scale_field, row_holder, go_button);

            }, {once: true})
        }
    });
    //creating a variable to hold the row we need to add to the other one
    //we also set up a listener to detect when we've selected the row we want and show the go_button
    add_button.addEventListener("draggingStopped", event => {
        event.stopPropagation(); //ensure that the event does not trigger a row swap
        const held_row = event.detail.cloneNode(true);

        const held_row_td = held_row.querySelectorAll("td");
        const held_row_input = held_row.querySelectorAll("input");
        const row_holder = document.getElementById("row_holder_id");

        for(let i = 0; i < held_row_td.length; i++) {
            if(held_row_input[i].value === "") {
                held_row.style.width = "20px";
                held_row_td[i].style.width = "20px";
            }
            else {
                held_row.style.width = held_row_input[i].value.length+1 + "ch";
                held_row_td[i].style.width = held_row_input[i].value.length+1 + "ch";
            }
        }
        row_holder.style.width = held_row.style.width;

        held_row.style.position = "static";     //setting the held row to static so its offset is ignored
        console.log(`Held row is ${held_row} and contains ${typeof held_row.lastChild.firstChild}, ${typeof held_row.firstChild.firstChild}\n${event.detail.lastChild.firstChild} ${event.detail.firstChild.firstChild}`);

        //check if there is a tbody to place the row in and create one if there isn't
        let table_body = row_holder.querySelector("tbody");
        if(!table_body){
            table_body = document.createElement("tbody");
            row_holder.appendChild(table_body);
        }

        table_body.replaceChildren(held_row);

        sessionStorage.setItem("secondaryRow", held_row.id);
        //get the ID from the held_row and copy its backend version (obtained by indexing currentTable with the result from extractRowIndex) into sessionStorage for use with the safe scalefield
        sessionStorage.setItem("bufferRow", JSON.stringify(JSON.parse(sessionStorage.getItem("currentTable"))[extractRowIndex(held_row)]));
        //clear held_row's ID to prevent conflicts, just in case
        held_row.id = "";
        updateTableFromArray(row_holder, [JSON.parse(sessionStorage.getItem("bufferRow"))], null, "input", "value");    //fix for elements becoming undefined.
        scale_field.style.visibility = "visible";
        attachToParent(scale_field);
        row_holder.style.visibility = "visible";
        attachToParent(row_holder);
        go_button.style.visibility = "visible";
        attachToParent(go_button);
        console.log(`Caught a row: ${sessionStorage.getItem("bufferRow")}`);

        //prepare to cancel if the user clicks outside
        document.addEventListener("click", () => {

            resetAddInterface(scale_field, row_holder, go_button);

        }, {once: true})
    });

    //performing the actual addition and resetting the interface when the go_button is clicked
    go_button.addEventListener("click", () => {
        //clean up the interface to prevent extra row being found by updateTableFromArray - this creates issues with swapping rows that updateTableFromArray
        addRows(table, JSON.parse(sessionStorage.getItem("currentTable")), document.getElementById(sessionStorage.getItem("primaryRow")));
        resetAddInterface(scale_field, row_holder, go_button);
    });

    return [add_button, scale_field, row_holder, go_button];
}
/**
 * helper function to reset the addInterface properly and prevent repeat code
 * this function currently changes
 * the secondary scaling factor to 1,
 * the secondary row to "",
 * and sets allowInterfaceMoving to true
 * @param {HTMLelement} scale_field - div container for table that contains rowB, a scale button to scale rowB and an add button that adds RowB to rowA
 * @param {HTMLelement} row_holder - Table that can only contain one row which is found by listening for the draggingStopped event.
 * @param {HTMLelement} go_button - Button that adds rowB to rowB on click event.
 */
function resetAddInterface(scale_field, row_holder, go_button){
    //hide the elements
    scale_field.style.visibility = "hidden";
    row_holder.style.visibility = "hidden";
    go_button.style.visibility = "hidden";
    //reset all the variables in sessionstorage (and on the frontend for the scale_field)
    const scale_field_input = scale_field.querySelector("input");
    scale_field_input.value = 1;
    sessionStorage.setItem("secondaryScaleFactor", "1");
    sessionStorage.setItem("secondaryRow", "");
    sessionStorage.setItem("allowInterfaceMoving", "true");
    //remove the row left over from the addition operation in row holder if it's there
    const extra_row = row_holder.querySelector("tr");
    if(extra_row){
        extra_row.remove();
    }
    row_holder.style.width = "300px"; // Reset row holder to the width it was created with.
    scale_field_input.style.width = "" // Reset style to default CSS defined style.
}
/**
 * A function designed for use in a mouseover-eventhandler
 * it checks if the addition/scaling interface is allowed to move and moves it if the row that's being moused over is not where the interface is at
 * @param {event} event - mouseover event that checks if the scale field, add button and the add button's children should be moved to another row.
 */
function moveInterface(event){
    //we only reset and move the interface if we are allowed to, and if the row we're hovering over is not the one the interface is on currently i.e. the one with ID primaryRow
    if(sessionStorage.getItem("allowInterfaceMoving")){
        const target_row = event.currentTarget;
        if(target_row.id !== sessionStorage.getItem("primaryRow") && !target_row.classList.contains("interfaceBlacklist")){     //interfaceBlacklist is a class added to things that the interface
            console.log("Trying to move interface!")
            //setting a new primaryRow and resetting scaling factors to 1
            //we're also resetting secondaryRow and what primaryScaleField's value is on the front end
            sessionStorage.setItem("primaryRow", target_row.id);                                                                //should not be able to attach to, despite other conditions being true
            sessionStorage.setItem("primaryScaleFactor", "1");
            sessionStorage.setItem("secondaryRow", "");
            sessionStorage.setItem("secondaryScaleFactor", "1");
            const scale_field_input = document.getElementById(sessionStorage.getItem("primaryScaleField")).querySelector("input");
            scale_field_input.value = 1;
            scale_field_input.style.width = ""; // Reset style to default CSS defined style
            //changing what the interface elements' parent is and running attachToParent to get them positioned
            document.getElementById(sessionStorage.getItem("primaryRow")).appendChild(document.getElementById(sessionStorage.getItem("primaryScaleField")));
            document.getElementById(sessionStorage.getItem("primaryRow")).appendChild(document.getElementById(sessionStorage.getItem("addButton")));
            attachToParent(document.getElementById(sessionStorage.getItem("primaryScaleField")), true);
            attachToParent(document.getElementById(sessionStorage.getItem("addButton")));
        }
    }
}
/**
 * Multiplies every element in a row with a given scalar and updates the frontend to reflect this.
 * @param {HTMLElement} table is an HTML table- or tbody-element that holds the row that is being scaled
 * @param {HTMLElement} row is an HTML tr-element and holds the elements that should be scaled
 * @param {String} scalar is the number all elements in the row should be multiplied with
 * @param {Array} tableArray is an array of arrays where the backend representation of the row is stored. This is where the actual scaling happens
 */
function scaleRow(table,row,scalar,tableArray){
    try{
        if(scalar === "0") return;
        const index = extractRowIndex(row);
        const row_to_scale = tableArray[index];
        console.log(`Scaling row #${index} by multiplying with ${scalar}\nRow to scale looks like ${row_to_scale}`);
        if(row_to_scale === undefined){
            throw new Error(`Row ${row_to_scale} not found`);
        }
        row_to_scale.forEach((element, i) => (row_to_scale[i] = element * scalar));

        //check if the addInterface is shown by checking if anything after add_button has been made visible and reset it to prevent issues with updateTableFromArray
        const add_button = document.getElementById("add_button_id");
        if(add_button.firstElementChild.style.visibility !== "hidden"){
            resetAddInterface(add_button.querySelector("div"), add_button.querySelector("table"), add_button.querySelector("table > button"));
        }
        updateTableFromArray(table, tableArray, [index], "input", "value");
        sessionStorage.setItem("currentTable", JSON.stringify(tableArray));
        pushToHistory(tableArray);
        writeSolutionMessage(tableArray);

        const scale_event = new CustomEvent("GEoperation", {bubbles:true, detail:`Row ${index} scaled with ${scalar}.`});
        row.dispatchEvent(scale_event); 
        attachToParent(document.getElementById(sessionStorage.getItem("primaryScaleField")), true);
        attachToParent(document.getElementById(sessionStorage.getItem("addButton")));
    }
    catch(error){
        console.log(`${error.message}\n${error.lineNumber}`);
    }
}

/**
 *
 * @param {HTMLelement} table is the element holding the row that's scaled
 * @returns
 */
function createSafeScaleField(table){
    // // Copy row from backend
    // const target_row_index = searchForRowIndex(table,target_row);
    // let row_copy = tableArray[target_row_index];

    const scalar_input = document.createElement("input");
    scalar_input.type = "number";
    scalar_input.value = 1;
    sessionStorage.setItem("secondaryScaleFactor", "1");
    scalar_input.classList.add("scale_field");
    scalar_input.id = "safe_scale_input";
    scalar_input.addEventListener("change", event => {
        sessionStorage.setItem("secondaryScaleFactor", event.currentTarget.value); // We used to use "bufferScaleFactor" instead of "secondaryScaleFactor"
    });
    // We create the scale button that is attached to scalefield
    const scale_button = document.createElement("button");
    scale_button.innerHTML = "Scale";
    scale_button.id = "safe_scale_button";

    // When scale button is clicked, the target row is scaled if it exists.
    scale_button.addEventListener("click", event => {
        if(!sessionStorage.getItem("bufferRow")){ // Row has to exist in order to scale it.
            console.warn(`Expected a row copy to scale`);
        } else {
        //scale the buffered row and put it back in sessionStorage
            const row_copy = JSON.parse(sessionStorage.getItem("bufferRow"));
            const scalar = Number(sessionStorage.getItem("secondaryScaleFactor"));
            row_copy.forEach((value, i) => {row_copy[i] = value * scalar});
            sessionStorage.setItem("bufferRow", JSON.stringify(row_copy)) // Places the row that is scaled in buffer
            console.log(`Row has been scaled by ${sessionStorage.getItem("secondaryScaleFactor")} to produce ${sessionStorage.getItem("bufferRow")}`);
            updateTableFromArray(table, [row_copy], null, "input", "value");
            
            // Resize held_row to match numbers in it
            resizeInputFields(table, false);
            attachToParent(document.getElementById("go_button_id"));
            }
        });

        // We create scale field and add attributes to it
        const scale_field = document.createElement("div"); // We use div so that multiple elements can be children of a scale field
        scale_field.addEventListener("click", event => {event.stopPropagation()}); // We do not want click to propgate to dragfunctionality
        document.body.appendChild(scale_field);
        scale_field.classList.add("scale_field"); // We create a class so we can hide an element using CSS
        scale_field.id = `safe_scale_field`; // May not be necessary -> Test!
        scale_field.appendChild(scalar_input);
        scale_field.appendChild(scale_button);
        scale_field.addEventListener("mouseover", event => {event.stopPropagation()}); // We stop the mouseOver-event from bubbling to target row to prevent unnecessary listeners - the scalefield has already been moved, we don't need to check whether it needs to move again.

        return scale_field;
}

function addRows(table,tableArray,row){
    try{
        const index = extractRowIndex(row);
        const target_row = tableArray[index];
        const buffer_row = JSON.parse(sessionStorage.getItem("bufferRow"));
        target_row.forEach((value, i) => {tableArray[index][i] = value + buffer_row[i]});
        updateTableFromArray(table, tableArray, [index], "input", "value");
        sessionStorage.setItem("currentTable", JSON.stringify(tableArray));
        pushToHistory(tableArray);
        writeSolutionMessage(tableArray);

        let event_string;
        if(Number(sessionStorage.getItem("secondaryScaleFactor")) !== 1) {
            event_string = `Row ${extractRowIndex(document.getElementById((sessionStorage.getItem("secondaryRow"))))} scaled by ${sessionStorage.getItem("secondaryScaleFactor")} and added to row ${index}.`
        }
        else {
            event_string = `Row ${extractRowIndex(document.getElementById((sessionStorage.getItem("secondaryRow"))))} added to row ${index}.`
        }
        let add_rows_event = new CustomEvent("GEoperation", {bubbles:true, detail:event_string}); 
        row.dispatchEvent(add_rows_event);
        attachToParent(document.getElementById(sessionStorage.getItem("primaryScaleField")), true);
        attachToParent(document.getElementById(sessionStorage.getItem("addButton"))); 
    }
    catch(error){
        console.error(error);
    }
}

export {updateTableFromArray, fillTable, createScaleField, createSafeScaleField, moveInterface, createAddInterface, swapTableRows, resetAddInterface}