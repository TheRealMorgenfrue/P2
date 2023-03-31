'use strict'
// Insert function that creates the entire html_page?

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
        tr.setAttribute("draggable", true); // Make rows draggable

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

function deleteTable() {
    const tbl = document.getElementById("matrix");
    const lockTableButton = document.getElementById("lockbutton").id;
    const unlockTableButton = document.getElementById("unlockbutton").id;
    const parent = tbl.parentElement;
    parent.removeChild(tbl);
    deleteButton(lockTableButton); // Ensure lockbutton button is removed and correctly placed each time table is generated
    deleteButton(unlockTableButton);
}

function getTable_size() {
    const body = document.body;
    const input_rows = document.createElement('input');
    const input_colums = document.createElement('input');
    const cdot = document.createTextNode(' x ');    // This is just to see the input boxes as "${rows} x ${colums}"
    let row_value = 2;   // Make the table a 2 x 2 at the start
    let colum_value = 2;
    let max_matrix_size = 10; // How big's the matrix? (e.g. 10 x 10)
    let input_width = '50px';  // Make both input boxes's size fit 2 digit numbers
    
    // Add attributes to the row input box
    input_rows.setAttribute("id", "row_size");
    input_rows.setAttribute("title", "Input desired row size - max 10");
    input_rows.setAttribute("value", row_value);
    input_rows.setAttribute("type", "number");
    input_rows.style.width = input_width;

    // Add attributes to the colum input box
    input_colums.setAttribute("id", "colum_size");
    input_colums.setAttribute("title", "Input desired colum size - max 10");
    input_colums.setAttribute("value", colum_value);
    input_colums.setAttribute("type", "number");
    input_colums.style.width = input_width;

    body.appendChild(input_rows);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(input_colums);
    body.insertBefore(cdot, input_colums);  // insertBefore can be used to insert an element before another element
                                            // (this way you can place it whereever in the code - as opposed to appendChild)

    let row_element = document.getElementById("row_size");  // Create input box for number of rows
    let colum_element = document.getElementById("colum_size");  // Create input box for number of colums
    
    row_element.addEventListener("focusout", (event) => {     // Creates a new table with new rows when leaving input box (and deletes the old table)
        row_value = event.target.value;

        input_rows.removeAttribute("value");

        if(row_value > max_matrix_size) {
            row_value = max_matrix_size;
            input_rows.setAttribute("value", row_value);

            let test = row_element.value;
            console.log(`INPUT ROW VALUE: ${test}`);

            console.error(`Error: Row size (${row_value}) is larger than max allowed (${max_matrix_size}). Resetting size to: ${max_matrix_size}`);
        }

        input_rows.setAttribute("value", row_value);

        deleteTable();
        createTable(row_value, colum_value);
        });

    colum_element.addEventListener("focusout", (event) => {   // Creates a new table with new colums when leaving input box (and deletes the old table)  
        colum_value = event.target.value;
        console.log(`Row value: ${colum_value}`);

        input_rows.removeAttribute("value");


        if(colum_value > max_matrix_size) {
            colum_value = max_matrix_size;
            input_colums.setAttribute("value", colum_value);
            console.error(`Error: Colum size (${colum_value}) is larger than max allowed (${max_matrix_size}). Resetting size to: ${max_matrix_size}`);
        }

        input_colums.setAttribute("value", colum_value);

        deleteTable();
        createTable(row_value, colum_value);
        });

    createTable(row_value, colum_value);  // Initialize table at page load since we don't trigger the eventlisteners there
}

function lockTableButton(){
    const body = document.body;
    const tbl = document.getElementById("matrix");
    const input = document.createElement('input');
    const element = document.getElementById("lockbutton");

    input.setAttribute("id", "lockbutton");
    input.setAttribute("type","button");
    input.setAttribute("value","Lock");
    body.after(tbl,input);
    input.addEventListener("click", lockTable);
}
// Make cells read only 
function lockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    for(let i = 0; i < table_rows.length; i++){ 
        table_rows[i].setAttribute("readonly","true");
    }
}

function deleteButton(id) {
    const button = document.getElementById(`${id}`);
    const parent = button.parentElement;
    parent.removeChild(button);
}

// Make cells writeable  
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

function unlockTable(){
    const tbl = document.getElementById("matrix");
    const table_rows = tbl.querySelectorAll("input");
    table_rows.forEach(element => {
        element.removeAttribute("readonly", "false");
    })
}

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

function validateButtonInput(){
    const tbl = document.getElementById("matrix");
    const input = tbl.querySelectorAll("input");

    input.forEach(element => {
        element.addEventListener("focusout", (event) =>  {
            let str = event.target.value;
            let sanstr = sanitize(str);//
            console.log(`Got string: ${str} and sani: ${sanstr}`);
            event.target.value = sanstr;
        }
        )
    }
    );
}

getTable_size();
