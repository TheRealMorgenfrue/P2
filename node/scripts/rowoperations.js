'use strict'
import {sanitize} from "../scripts/app_GE"
import {attachToParent} from "../scripts/positioning.js" // Used for positioning buttons 
import {swapRows} from "../scripts/app_math.js"
//import {sanitize} from "../scripts/app_GE.js" // Used for scale button input 
/**
 * This function takes a table and a row-element for said table and finds its base-0 index as if the table was an array of arrays.
 * If an index is found, it is returned as an integer, but if no index is found, the function returns a null-value.
 * @param {HTMLelement} table is an HTML-element of type "table" or "tbody".
 * @param {HTMLelement} row is an HTML-element of type "tr".
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
 * @param {HTMLelement} row an HTML-element of type "tr" with an ID where the last sequence of digits that correspond to its base-0 index is held after an underscore (_).
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
 * @param {HTMLelement} table is the HTML table- or tbody-element where the swap takes place
 * @param {HTMLelement} rowA is the first row element.
 * @param {HTMLelement} rowB is the second row element, which should trade places with the first.
 * @param {Array} tableArray is an optional argument that represents the table as an array of rows.
 */
function swapTableRows(table, rowA, rowB, tableArray){
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

    } catch(error) {
        console.error(error);
    }
}
/**
 * This function implements row addition and subtraction for matrices. 
 * It manipulates the 2D array which forms the underlying representation of the HTML-table. 
 * Note that rowA is subtracted/added to rowB without changing rowA 
 * @param {HTMLelement} table - html representation of the current table 
 * @param {HTMLelement} rowA - html representation of the rowA of type "tr"
 * @param {HTMLelement} rowB - html representaion of rowB  of type "tr"
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
        updateTableFromArray(table,tableArray,[indexB],"input");
    }
    catch(error){
        console.log(`${error.message}`);
    }
}
/**
 * This function scales a row in the underlying array representation of the html matrix by a scalar if row can be found 
 * @param {HTMLelement} table - html element representing the matrix 
 * @param {HTMLelement} row - the row to be scaled by a scalar
 * @param {number} scalar - a scalar i.e. a number that a row is scaled by
 * @param {Array} tableArray  - 2D-array representation of the html element table 
 */
function scaleRow(table,row,scalar,tableArray){
    try{
        row_to_scale = tableArray[searchForRowIndex(table, row)];
        if(row_to_scale === undefined){
            throw new Error("Row cannot be found");
        }
        row_to_scale.forEach(element => (element *= scalar));
    }
    catch(error){
        console.log(`${error.message}`);
    }
}
/* TODO: Mads
* Make row  */

/**
 * Function adds a scale button to a table that can be moved  arounnd. 
 * It attaches a the button to the first row of the table.
 * Note: it enures that the first row of the table is defined before adding a button. 
 * @param {HTMLelement} table - html representation of the table  
 */
function addScaleButton(table){
    try{
        let ScaleButton = document.createElement("input");
        ScaleButton.classList.add("scaleButton"); // Ensure that scale button can be hidden with css styling 
        ScaleButton.id = "scale_button_id";
        ScaleButton.type = "number"; // Ensure that scalar is a number
        let first_row = table.querySelector("tr");
        // Check whether table is defined
        if(first_row === undefined){
            throw new Error("The table is empty");
        }
       first_row.appendChild(ScaleButton); // Buttons is given a parent so it can be attached to the left
       attachToParent(ScaleButton, false); // Design specifies that buttons should be added on left side 
    }
    catch(error){
        console.error(error);
    }
}
/**
 * This function moves the scale button from one row to another. 
 * It also ensures that the button is made visible since it is hidden by css styling.  
 * @param {event} event - event that targets a row
 */
function moveButton(event){
    let target_row = event.currentTarget;
    let scaleButton = document.getElementById("scale_button_id");
    // The first time the scalebutton is attached, it is hidden - ensure that it is shown on mouse move
    if(scaleButton.style.visibility === "hidden"){ 
        scaleButton.style.visibility = "visible";
    }
    scaleButton.value = "1"; // Ensure that row is not scaled if user does not input a scalar value
    target_row.appendChild(scaleButton);
    attachToParent(ScaleButton, false);
    }

/**
 * Updates a table given as the first argument with the data from the second argument, an array of arrays.
 * The ith row in the table uses the ith element from the array of arrays and copies one entry from the subarray into every table cell.
 * 
 * The third argument is optional and controls which rows of the table should be updated. If excluded, every row is updated.
 * 
 * The fourth argument is also optional and can be used to select specific elements within each table cell. It must be a valid CSS selector string.
 * 
 * The fifth argument specifies which attribute of a cell's target element to change. The default is innerHTML.
 * 
 * Remember to sanitize the data in tableArray!
 * @param {HTMLelement} table is an HTML table-lement or HTML tbody-element.
 * @param {Array} tableArray is an array of arrays representing the data that should be placed in the table.
 * @param {Array} options is a set of integers specifying the base-0 index of the rows that should be updated.
 * If excluded, every row in the table will be updated. Both positive and negative values are allowed.
 * @param {String} query is an optional CSS selector string used to identify elements within the table cells.
 * @param {String} attribute is a specific attribute of the target element to modify instead of its innerHTML. Passed as a string like "value" and used with element.setAttribute.
 */
function updateTableFromArray(table, tableArray, options, query, attribute){
    //get an iterable list of rows in the table
    let rows = table.querySelectorAll("tr");

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

    //now that we know which rows to work on, we get the elements in each row and write new values in them.
    //since querySelectorAll returns an iterable object, we can use the index-argument in forEach's callback
    //as it would correspond to the value representing that cell in the array of arrays.
    //but first we need to check if we shoud include the extra query:
    if(query.length > 0){
        rows.forEach((row, i) => {
            row.querySelectorAll("td").forEach((cell, j) => {
                cell.querySelector(query).setAttribute(attribute, tableArray[i][j]);
            })
    });
    } else {
        rows.forEach((row, i) => {
            row.querySelectorAll("td").forEach((cell, j) => {
                cell.setAttribute(attribute, tableArray[i][j]);
            })
    });
    }
    //note: We use .innerHTML as our default attribute to set in each cell. This adds flexibility to what we can put in the table
    //through the tableArray i.e. any HTML-code we want. We use setAttribute to access attributes, since it allows for strings to be passed.
    //The data we set might need sanitizing first. We assume another function has done that before this function is run.
}






        /*THE FOLLOWING IS DEPRECATED CODE FROM swapTableRows, USED IN PLACE OF updateTableFromArray
        //first, we find the siblings that come after rowA and rowB.
        //note that nextSibling returns null if the node it is called on is the last sibling
        const siblingA = rowA.nextSibling(),
              siblingB = rowB.nextSibling();
        
        //there are two distinct cases to consider here:
        // 1 the two rows are adjacent in the sibling list
        // 2 the two rows are separated by at least one other row in the sibling list
        //we can identify what case we are dealing with by checking if siblingA or siblingB is rowB or rowA respectively
        if(siblingA === rowB){
            //case 1: if rowA's sibling is rowB, place rowB before rowA to swap them
            insertBefore(rowB, rowA);
        } else if(siblingB === rowA){
            //same as above, but in reverse
            insertBefore(rowA, rowB);
        } else {
            //case 2: if none of the above if-statements trigger, we simply place each row before the other's sibling
            //this works even if a sibling is null, as insertBefore interprets null as the end of the sibling list and will insert the node there
            insertBefore(rowA, siblingB);
            insertBefore(rowB, siblingA);
        }
        */
export {addScaleButton, updateTableFromArray};