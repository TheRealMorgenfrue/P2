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

    /************************
        Control variables
    ************************/
    const cell_width = '100px',    // Width of input cells in the matrix
          max_input_length = 5;   // Max number of chars allowed in input cells



    /************************
    ************************/

    tbl.style.width = cell_width;
    for (let i = 1; i <= rows; i++) {    // Print rows
        const tr = tbl.insertRow();
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

createTable(4,4);


function getTable_size() {
    const body = document.body;
    const input = document.createElement('input');
    
    input.setAttribute("id", "table_size");
    //input.setAttribute("onclick", console.log('This works'));



    body.appendChild(input);    // When done editing the element, add it to the html body. This is crucial for stuff like getElementById


    const id = input.getAttribute("id");
    let element = document.getElementById("table_size");

    console.log(`Got element: ${element} and id: ${id}`);
    




}

getTable_size();