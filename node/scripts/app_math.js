'use strict'

/**
 * @param {HTMLElement} row
 * @returns {string} for an HTML formatted equation of given row
 */
function rowToEquationHTML (row) {

    let equation_arr = row.querySelectorAll("td");
    let equation = "<p>";
    for(let i = 0; i < equation_arr.length - 1; i++) {
        let num = equation_arr[i].innerText;
        if(Number(num) !== 0){
            equation += num;
            equation += `x<sub>${i + 1}</sub>`; // Adds variable
            if(!(i === equation_arr.length - 2)) equation += " + "; // Doesn't add plus before the last number
        }
    }
    equation += ` = ${equation_arr[equation_arr.length - 1].innerText}</p>`;
    return equation;
}

/**
 * @param {HTMLElement} row
 * @returns {*[]} Array of table row elements as numbers
 */
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

/**
 * Transforms 2D array of numbers in-place into upper triangular version - pseudocode from https://en.wikipedia.org/wiki/Gaussian_elimination
 * Uses partial pivoting, a method to reduce round off errors
 * Info about partial pivoting: https://web.mit.edu/10.001/Web/Course_Notes/GaussElimPivoting.html -
 * https://math.libretexts.org/Bookshelves/Applied_Mathematics/Numerical_Methods_(Chasnov)/03%3A_System_of_Equations/3.03%3A_Partial_Pivoting
 * @param {*[[]]} equations 2D array of numbers representing equation matrix
 */
function gaussianElimination (equations) {
    let row = 0; // Pivot row
    let column = 0; // Pivot column

    while(row < equations.length && column < equations[0].length) { // Compares row to number of rows and column to number of columns
        let i_max = row;
        for(let i = row; i < equations.length; i++) { // Finds the max absolute current pivot column, starting from the current pivot row (partial pivoting)
            if(Math.abs(equations[i][column]) > Math.abs(equations[i_max][column])) {
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

/**
 * Swaps rows of equations in-place
 * @param {number} row1 array index
 * @param {number} row2 array index
 * @param {*[[]]} equations 2D array
 */
function swapRows (row1, row2, equations) {
    let temp = equations[row1];
    equations[row1] = equations[row2];
    equations[row2] = temp;
}

/**
 * Based on https://gist.github.com/codecontemplator/6b3db07a29e435940ffc, finds solutions to upper triangular matrix by back-substitution
 * @param {*[[]]} equations 2D array of numbers representing equation matrix
 * @returns {any[]|number} returns array of solutions to system of equations or NaN if none are found
 */
function backSubstitution(equations) {
    let A = new Array(equations.length); // Creates an array for coefficient matrix
    let b = new Array(equations.length); // Creates an array for constant matrix
    let columns = equations[0].length;

    for (let i = 0; i < equations.length; i++) { // Fills matrices
        A[i] = equations[i].slice(0, columns - 1);
        b[i] = equations[i][columns - 1];
    }
    let m = A.length;
    let n = A[0].length;

    let x = new Array(n).fill(0);

    for (let i = m - 1; i >= 0; i--) { // Starts at the last equation
        let sum = 0;
        for (let k = i + 1; k < n; k++) {
            sum += A[i][k] * x[k];
        }
        x[i] = (b[i] - sum) / A[i][i]; // Calculates variable by dividing last element of the equation by the diagonal element
    }
    for(let i = 0; i < x.length; i++) { // Rounds solutions to 4 decimals (4 is arbitrary)
        if(isNaN(x[i])) return NaN; // Should maybe return something else
        x[i] = roundTo(x[i],4);
    }
    return x;
}

/**
 * Rounds number to given digits, default 0 - https://stackoverflow.com/questions/15762768/javascript-math-round-to-two-decimal-places
 * @param {number} n number to be rounded
 * @param {number} digits number of digits
 * @returns {number} rounded number
 */
function roundTo(n, digits) {
    if (digits === undefined) { // Default digits is 0
        digits = 0;
    }
    let scalar = Math.pow(10, digits);
    n = parseFloat((n * scalar).toFixed(11)); // Multiply input number (n) by the scalar and fix it to 11 decimal places
    let test = (Math.round(n) / scalar); // Rounds number (n) and divides it by the scalar to obtain the rounded value
    return +(test.toFixed(digits)); // Returns rounded value, fixed to the specified number of decimal places
}
export {gaussianElimination, backSubstitution} // Export function to test suite (brackets matter, see drag.test.js)
