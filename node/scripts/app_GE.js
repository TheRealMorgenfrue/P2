'use strict'

function createTable(rows, colums) {
    try {   // If the matrix's size is smaller than 1 then ABORT
        if(rows < 1 || colums < 1) {
            throw new Error(`Matrix size must be larger than 0 (Got row = ${rows}, colum = ${colums})`);
        }
    } catch (error) {
        console.error(`${error}`);
        //return;   // Technically not necessary to stop code execution here since i and j starts at 1 down below
    }

    const body = document.body,
          tbl = document.createElement('table');
          tbl.setAttribute("id", "matrix");  

    /************************
        Control variables
    ************************/
    const cell_width = '100px',    // Width of input cells in the matrix
          max_input_length = 10;   // Max number of chars allowed in input cells

    body.childNodes

    /************************
    ************************/

    tbl.style.width = cell_width;
    for (let i = 1; i <= rows; i++) {    // Print rows
        const tr = tbl.insertRow();
        tr.setAttribute("draggable", true); // Make rows draggable

        for (let j = 1; j <= colums; j++) {  // Print colums
            /*if(i === 2 && j === 1) {
                //break;
            }*/
            
            let td = tr.insertCell();
            
            const input_cell = document.createElement('input');
            input_cell.setAttribute("maxLength", max_input_length);
            input_cell.style.width = cell_width;
            td.appendChild(input_cell);

            
            const math_format = document.createElement('math');
            math_format.style.width = cell_width;
            td.appendChild(math_format);

            //td.appendChild(document.createTextNode(`Cell ${i},${j}`));
            td.style.border = '1px solid black';
            
            /*if(i === 1 && j === 1) {
                //td.setAttribute('rowSpan', '2');
              }*/
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

getTable_size();