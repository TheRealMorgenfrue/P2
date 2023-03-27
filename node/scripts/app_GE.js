'use strict'

function createTable(rows, colums) {
    if(rows < 1 || colums < 1) {
        throw new Error('Matrix size must be larger than 0');
    }

    const cell = document.createElement('input')
    cell.style.width = '10px';
    const body = document.body,
          tbl = document.createElement('table');
    tbl.style.width = '200px';
    //tbl.style.border = '1px solid black';

    for (let i = 1; i <= rows; i++) {    // Print rows
        const tr = tbl.insertRow();
        for (let j = 1; j <= colums; j++) {  // Print colums
            if(i === 2 && j === 1) {
                //break;
            }
            if(true) {
                let td = tr.insertCell();
                td.appendChild(cell);
                document.createElement(br);
                //td.appendChild(document.createTextNode(`Cell ${i},${j}`));
                //td.style.border = '1px solid black';
                if(i === 1 && j === 1) {
                    //td.setAttribute('rowSpan', '2');
                }
            }
        }
    }
    body.appendChild(tbl);
}
createTable(4,4);