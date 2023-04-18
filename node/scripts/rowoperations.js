import "../scripts/app_GE" // Used for button attributes 
import "../scripts/positioning" // Used for positioning buttons 

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
    if(idMatch.length > 0){
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
    } catch(error) {
        console.error(error);
    }
}
/**
 * This function implements row addtion and subtraction for matrices. 
 * It manipulates the 2D array which forms the underlying representation of the HTML-table. 
 * Note that rowA is subtracted/added to rowB 
 * @param {HTMLelement} table - html representation of the current table 
 * @param {HTMLelement} rowA - html representation of the rowA
 * @param {HTMLelement} rowB - html representaion of rowB  
 * @param {Array} tableArray - 2D array that represents the backend version of the matrix 
 */

function addRows(table, rowA, rowB, tableArray){
    // Find row in table array that corresponds to html table
    row1 = tableArray[searchForRowIndex(table, rowA)];
    row2 = tableArray[searchForRowIndex(table, rowB)];

    // Ensure that operation is always valid by checking length of both rows 
    try{
        if(row1.length !== row2.length){
            throw new Error;
        }
        // Note that this loop changes the values of tableArray and not its copy 
        for(let i = 0; i < rowA.length; i++){
            row1[i] += row2[i];
        }
    }
    catch(error){
        console.log(`Rows not of same length; Cannot perform ${operation}`);
    }

}

/**
 * 
 * @param {HTMLelement} row - row element that we want to add a scale button to  
 */
function addScaleButton(row){
    let ScaleButton = document.createElement("input");
    row.appendChild(ScaleButton); // Buttons is given aparent so it can be attached to the left 
    attachToParent(ScaleButton, true); // Design specifies that buttons should be added on left side 
}

addScaleButton(getElementbyId(""))