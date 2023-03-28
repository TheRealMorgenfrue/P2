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
            input_cell.style.width = cell_width; // Ensure that each input cell fills out cell in matrix
            td.appendChild(input_cell);

            const math_format = document.createElement('math');
            math_format.style.width = cell_width;
            td.appendChild(math_format);

            td.style.border = '1px solid black';
            }
        }
    body.appendChild(tbl);
}

function deleteTable() {
    const table = document.getElementById("matrix");
    const parent = table.parentElement;
    parent.removeChild(table);
    return;
}

function getTable_size() {
    const body = document.body;
    const input_rows = document.createElement('input');
    const input_colums = document.createElement('input');
    const cdot = document.createTextNode(' x ');
    let rows = 2;
    let colums = 2;
    let input_size = '25px';
    
    input_rows.setAttribute("id", "row_size");
    input_rows.setAttribute("title", "Input desired row size - max 10");
    input_rows.setAttribute("value", rows);
    input_rows.style.width = input_size;

    input_colums.setAttribute("id", "colum_size");
    input_colums.setAttribute("title", "Input desired colum size - max 10");
    input_colums.setAttribute("value", colums);
    input_colums.style.width = input_size;

    body.appendChild(input_rows);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById
    body.appendChild(input_colums);
    body.insertBefore(cdot, input_colums);


    //const id = input_rows.getAttribute("id");
    let row_element = document.getElementById("row_size");
    let colum_element = document.getElementById("colum_size");
    //console.log(`Got row element: ${row_element} and id: ${id}`);
    
    row_element.addEventListener("keypress", e => {
        if(e.key === 'Enter') {
            rows = row_element.value;
            deleteTable();
            createTable(rows, colums);
        }});

    colum_element.addEventListener("keypress", e => {
        if(e.key === 'Enter') {
            colums = colum_element.value;
            deleteTable();
            createTable(rows, colums);
        }});

    createTable(rows, colums);  // Initialize table
}

function addTableSubmit(){
    const body = document.body;
    const input = document.createElement('input');
    input.setAttribute("type","button");
    input.setAttribute("value","I am done making a table");
    input.addEventListener("onclick", submitTable);
    body.appendChild(input);
}

function submitTable(ev){
    table_rows = document.getElementById("#matrix").children;
    console.log(table_rows[1]);
    for(let i = 0; i < table_rows.length; i++){
        table_rows[0].setAttribute("readonly","true");
    }
}

getTable_size();
addTableSubmit();