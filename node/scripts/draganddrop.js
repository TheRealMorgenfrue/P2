'use strict'
/************ Drag'n Drop ***************
the functions in this tag build on the from-scratch drag and drop-functionality from the second script tag
this is an attempt to standardise them and make them work for any element by using custom events
the events we are working with are
. draggingStarted -> Fires when the user begins dragging an element. event.target is the element that gets dragged
. draggingStopped -> Fires when the user stops dragging an element. event.target is the element at the spot where the drag ends
. draggedOn       -> Fires when the user drags something on top of an element. That element is event.target
. draggedOff      -> Fires when the user drags something away from an element. That element is event.target
all events have an attribute accessed with event.detail that contains a reference to a copy of the dragged element
*/

/**
 * This function makes an element draggable when used in a click-eventListener.
 * 
 * It is NOT designed for use outside the initDrag- and disableDrag-functions!
 * @param {MouseEvent} event 
 */
function dragFunctionality(event){
    //set the drag target and fire an event on it when dragging begins after cloning it. We use CustomEvent so we can pass info on the cloned element in event.detail
    const dragTarget = event.currentTarget;

    //clone the element the handler is attached to and place it on the cursor
    //note that the element is made a child of the body and its zIndex is set very large to make it appear in front of everything else
    const newElement = dragTarget.cloneNode(true);  //we also clone the element's ID! Be careful when referring to it!
    document.body.appendChild(newElement);
    newElement.style.position = "absolute";
    newElement.style.zIndex = "2000";
    newElement.style.left = `${event.pageX}px`;
    newElement.style.top = `${event.pageY}px`;
    newElement.style.pointerEvents = "none";

    //Fire a custom event with the clone of the dragged element in its detail-attribute
    const dragEvent = new CustomEvent("draggingStarted", {bubbles:true, detail:newElement});
    dragTarget.dispatchEvent(dragEvent);
    
    //prepare events to fire in the updatePositionEvent-function and a variable to keep track of the element under the cursor
    const dragOntoEvent = new CustomEvent("draggedOn", {bubbles:true, detail:newElement}); //this event should be fired when something is dragged onto an element, but not dropped
    const dragOffEvent = new CustomEvent("draggedOff", {bubbles:true, detail:newElement}); //this event should be fired when something is dragged off of an element
    let dropTarget = document.elementFromPoint(event.pageX, event.pageY);

    //define a function to update the cloned element's position and run it whenever the mouse is moved
    function updatePositionEvent(event){
        newElement.style.left = `${event.pageX}px`;
        newElement.style.top = `${event.pageY}px`;
        if(dropTarget !== document.elementFromPoint(event.pageX, event.pageY)){
            dropTarget.dispatchEvent(dragOffEvent);
            dropTarget = document.elementFromPoint(event.pageX, event.pageY);
            dropTarget.dispatchEvent(dragOntoEvent);
        } 
    }     
    document.addEventListener("mousemove", updatePositionEvent);
    
    //stop the event from propagating immediately, so no other handlers of the same type will be triggered by this event
    event.stopImmediatePropagation();
    
    //listen for a click to register when the user wants to drop the element. BLOCKS ALL "CLICK"-LISTENERS UNTIL THE DRAGGED ELEMENT IS DROPPED
    document.addEventListener("click", event => {
        //set the drop target and fire a custom event on it
        const dropEvent = new CustomEvent("draggingStopped", {bubbles:true, detail:newElement});
        dropTarget.dispatchEvent(dropEvent);
        
        //delete the cloned element and remove the handler that moves it around
        document.removeEventListener("mousemove", updatePositionEvent);
        newElement.remove();

        //this handler is capturing, so it triggers before the pickup-handler and blocks it with stopImmediatePropagation
        event.stopImmediatePropagation();
    }, {capture: true, once: true});
}


/**
 * Initialises drag functionality on a given element by calling dragFunctionality when the element receives a click-event.
 * @param {HTMLelement} element is the HTML element that should be made draggable.
 */
function initDrag(element){
    element.addEventListener("click", dragFunctionality)
}

/**
 * This function removes drag functionality from a given element by deleting the associated eventListener that was added by initDrag.
 * @param {HTMLelement} element is the HTML element that should no longer be draggable.
 */
function disableDrag(element){
    element.removeEventListener("click", dragFunctionality)
}

/**
 * This function controls the highlighting of an element with the mouse. Compatible with most common browsers.
 * @param {HTMLelement} element is the HTML element whose highlighting should be affected.
 * @param {String} value can be one of the following strings:
 * 
 * "none"
 * 
 * "auto"
 * 
 * "text"
 * 
 * "all"
 * 
 * "contain"
 * 
 * Read about their behavior here: https://developer.mozilla.org/en-US/docs/Web/CSS/user-select
 */
function highlightPermissions(element, value){
    try{
        if(value !== "none" && value !== "auto" && value !== "text" && value !== "all" && value !== "contain"){
            throw new Error(`${value} is not a valid option!\nValid values are "none", "auto", "text", "all", and "contain".`);
        }
    element.style.WebkitUserSelect = value; // Safari
    element.style.msUserSelect = value; // IE 10+ and Edge
    element.style.userSelect = value; // Standard syntax
    } catch(error) {
        console.error(error);
    }
}

export default initDrag;