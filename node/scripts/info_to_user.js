/** This is not a pretty function. It just has to work for now. 
 * Ideas for improvement: 
 * Make inner html read from files instead of directly in the program. 
 * Add event listeners so that buttons are highlighted when the corresponding text is moused over. 
 * 
 */
function displayTutorial() {
    // Ideally we'd have a text doc that can read all of this!
    // Create element to contain all sections of the instruction
    const div_container = document.createElement("div");
    div_container.classList.add("user_instructions");

    // Create all the required headers
    const title = document.createElement("h2");
    title.innerHTML = "Gaussian Elimination Tutorial";

    const header_1 = document.createElement("h3");
    header_1.innerHTML = "HOW TO USE";
    
    const header_2 = document.createElement("h3");
    header_2.innerHTML = "ADJUSTING SIZE";

    const header_3 = document.createElement("h3");
    header_3.innerHTML =  "CARRYING OUT ROW OPERATIONS";

    const header_4 = document.createElement("h3");
    header_4.innerHTML = "USING THE BUTTONS";
    
    // Create all paragraphs associated with each header 
    const p1 = document.createElement("p");
    p1.innerHTML = 
    `Welcome to the Gaussian Elimination Helper! (GEH).`+ "<br/>" + 
    `It is meant to help you understand how to use Gaussian Elimination as a step towards solving systems of linear equations.`+ "<br/>" + 
    `It features the same operations that you'd expect for instance swapping or adding.` + "<br/>" + 
    `See the ${header_1.innerHTML} section for more details!`

    const p2 = document.createElement("p");
    p2.innerHTML = 
    `At the top of the matrix, there are to two fields seperated by an "x".`+ "<br/>" + 
    `You can input a whole number into either box and then the matrix will adjust itself accordingly.`+ "<br/>" + 
    `Note that these boxes can be used to adjusted up to a [15 x 15] matrix.`;
    
    const p3 = document.createElement("p");
    p3.innerHTML = 
    `There are three types of operations that you can do in a Gaussian Elimination.`+ "<br/>" + 
    `1.Scaling a row - You can scale a row by inputting a scalar and pressing "scale"`+ "<br/>" + 
    `2.Adding a row - You can add a row by press the "+" button, dragging a row into the white box that becomes visible, and then pressing the "add" button. `+ "<br/>" +
    `3.Swapping a row - You can click a row in order to pick it up. While holding this row, you can click any other to swap it with.`;

    const p4 = document.createElement("p");
    p4.innerHTML = 
    `There are also three buttons you can use with the GEH.`+ "<br/>" + 
    `1. Go Back - You undo the latest row operation. ` + "<br/>" + 
    `2. Reset - You reset all of the input boxes in a matrix to contain 0` + "<br/>" + 
    `3. Randomize - You set all values of a matrix to a random integer between -9 and 9.` + "<br/>" + 
    `4. Comfirm Matrix - You enable the use of row operations on the matrix. Use it once you are sure that you have input the values that you'd like!`;

    // Add all elements to div container
    div_container.append(p1,header_1,header_2,p2,header_3,p3,header_4,p4);

    document.querySelector("body").appendChild(div_container);
}

function displayMatrixOperations(){
    console.log("This function is a placeholder. When done, it should show the user the different matrix operations that have been made")
}

export {displayTutorial}