'use strict'

// Creates a string representation of the equation in a given row
function rowToEquationHTML (row) {
    let equation_arr = row.querySelectorAll("td");
    let equation = "<p>";
    let i = 1;
    for(let num of equation_arr) {
        num = num.innerText;
        if(Number(num) !== 0){
            equation += num;
            equation += `x<sub>${i}</sub>`; // Adds variable
            if(!equation_arr[i]) break; // Avoids last + sign
            equation += " + ";
        }
        i++;
    }
    equation += "</p>"
    return equation;
}

// Creates an array of table row contents
function rowToEquationArray (row) {
    let equation_arr = row.querySelectorAll("td");
    let equation = [];
    let i = 0;
    for(let num of equation_arr) {
        num = num.innerText;
        equation[i] = Number(num);
        i++;
    }
    return equation;
}

function gaussianElimination (equations) {
    let row = 0; // Pivot row
    let column = 0; // Pivot column

    while(row < equations.length && column < equations[0].length) { // Compares row to number of rows and column to number of columns
        let i_max = row;
        for(let i = 0; i < equations.length; i++) { // Finds the max value in column (variable)
            if(Math.abs(equations[i][column]) > i_max) {
                i_max = i;
            }
        }
        if(equations[i_max][column] === 0) { // No pivot in column
            column++;
        }
        else {
            swapRows(row, i_max, equations);
            for(let i = row + 1; i < equations.length; i++) { // Makes values below pivot zero
                let f = equations[i][column] / equations[row][column]; // Factor for row subtraction
                equations[i][column] = 0;
                for(let j = column + 1; j < equations[0].length; j++) { // Row subtraction
                    equations[i][j] = equations[i][j] - equations[row][j] * f;
                }
            }
            row++;
            column++;
        }
    }
}

function swapRows (row, i_max, equations) {
    let temp = equations[row];
    equations[row] = equations[i_max];
    equations[i_max] = temp;
}

//Gets reduced row echelon form by substituting equations
function backSubstitution (equations) {
    let m = equations.length;
    for(let i = m - 1; i >= 0; i--) {
        let x = equations[i][m] / equations[i][i];
        for(let j = i - 1; j >= 0; j--) {
            equations[j][m] -= x * equations[j][i];
            equations[j][i] = 0;
        }
        equations[i][m] = x;
        equations[i][i] = 1;
    }
}
/*
// Just for testing
let rows = document.querySelectorAll("tr");
let i = 0;
let equations = [];
for(let j of rows){
    equations[i] = rowToEquationArray(j);
    i++;
}
for(let j of equations) {
    console.log(j);
}
gaussianElimination(equations);

backSubstitution(equations);

for(let j of equations) {
    console.log(j);
}

 */