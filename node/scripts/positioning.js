/**
 * Places an HTML element to the left or right of its parent with no margin.
 * @param {HTMLelement} element is the HTML element that should be attached to the side of its parent.
 * @param {boolean} left is optional and defaults to false. If true, the element is placed on the parent's left side instead the right.
 */
function attachToParent(element, left){
    //get bounding rectangles for the element and its parent and initialise x and y
    //we begin by assuming that the element's parent is its frame of reference, so x and y begin as 0
    element.style.position = "absolute";

    const parent = element.parentElement;
    const childRect = element.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();
    let x = 0, y = 0;

    //offset x to the right or left of the parent element
    if(left){
        x -= childRect.width;
        console.log(`Offsetting element to the left by ${childRect.width}`)
    } else {
        x += parentRect.width;
        console.log(`Offsetting element to the right by ${parentRect.width}`)
    }
    console.log(`x-offset coordinates are (${x}, ${y})`);

    //offset the y-coordinate so the two elements line up in the middle instead of at the top
    let a = parentRect.height, b = childRect.height;
    const offsetY = (a - b)/2;
    y += offsetY;
    console.log(`Y is offset by ${offsetY}px.`);
    console.log(`y-offset coordinates are (${x}, ${y})`);

    //now we have calculated the x- and y-values we need to offset the child with to place it right or left of its parent
    //but so far we have assumed that the parent is the child's frame of reference, i.e. that the parent is non-static.
    //this might not be the case, so now we find the closest non-static ancestor to the child and get its bounding rectangle
    let ancestor = parent;
    //while the parent of ancestor is not NULL and ancestor's position type is static, move ancestor up the DOM tree
    while (ancestor.parentElement && getComputedStyle(ancestor).position === "static") {
        ancestor = ancestor.parentElement;
    }
    const ancestorRect = ancestor.getBoundingClientRect();
    console.log(`Ancestor is ${ancestor}`)

    //offset x and y by the difference between the parent's coordinates and the ancestor's coordinates
    //note that if we wanted the x's and y's of something with respect to the body, instead of the difference between two things, we would need to offset it by the window.scrollX and window.scrollY respectively 
    //we choose to reuse a and b for ease of reading
    a = parentRect.left;
    b = ancestorRect.left;
    x += (a - b);
    console.log(`Difference between ancestor and parent x is ${a - b}`);

    a = parentRect.top;
    b = ancestorRect.top;
    y += (a - b);
    console.log(`Difference between ancestor and parent y is ${a - b}`);
    console.log(`Corrected coordinates are (${x}, ${y})`);

    //set the element's position
    element.style.left = `${x}px`;
    element.style.top = `${y}px`;
    console.log(`Final coordinates are (${x}, ${y})`);
}