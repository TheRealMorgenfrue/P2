'use strict'

function createTable(rows, colums) {
    if(rows < 1 || colums < 1) {
        throw new Error('Matrix size must be larger than 0');
    }

    const body = document.body,
          tbl = document.createElement('table'), 
          des_width = '200px';
    
    tbl.style.width = des_width;  /* Width of cells set to an abitrary number of pixels currently  */ 

    for (let i = 1; i <= rows; i++) {    // Print rows
        const tr = tbl.insertRow();
        for (let j = 1; j <= colums; j++) {  // Print colums
            if(i === 2 && j === 1) {
                //break;
            }
            let td = tr.insertCell();
            let input_cell = document.createElement('input');
            input_cell.style.width = '10px';
            td.appendChild(input_cell);
            //td.appendChild(document.createTextNode(`Cell ${i},${j}`));
            td.style.border = '1px solid black';
            if(i === 1 && j === 1) {
                //td.setAttribute('rowSpan', '2');
                }
            }
        }
    body.appendChild(tbl);
}

createTable(4,4);