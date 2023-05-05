'use strict'
import{initTableGE, populateIDs} from "./app_GE.js";
import{initDrag} from "./draganddrop.js";
import{createScaleField, moveInterface, createAddInterface} from "./rowoperations.js";
import{attachToParent, lineUpAncestors} from "./positioning.js";

/**
 * This file is meant to run the entire program on the main page, index.html. 
 * If you test using this file, be sure to remove your test after completion!
 * 
 * To help, navigating this file, we have prepared a short table of contents 
 * 1. Globals/settings objects 
 * 
 */

// A number of functions need to access non-writable values as well as update writable values - this object is therefore global.
//this object is a mirror of the one in app_GE.js and their attributes should always be synchonized
const SETTINGS = new function() {  
    this.READONLY = new function() {
        this.TABLE = new function() {
            this.table_id = "gaussian_elimination_matrix"; 
            this.max_input_length = 8;
            this.placeholder = "0";
            this.row_id = "row";       // This id refers to the input box where the user selects table dimensions, not the matrix
            this.column_id = "column"; // This id refers to the input box where the user selects table dimensions, not the matrix
            this.type = "number";      // This refers to the input box where the user selects table dimensions, not the matrix
            this.max_matrix_size = 15; // Ensure that matrix is small enough to be read by human users 
            this.min_matrix_size = 2;
            this.title = `Input desired size - max ${this.max_matrix_size}`;
        }
        this.BUTTONS = new function() {
            this.lock_button_id = "lockbutton";
            this.lock_button_value = "Lock";
            this.lock_button_type = "button";
            this.lock_Table = function() { lockTable(); };    // We can have functions as keys in objects by wrapping them in a function
            this.unlock_button_id = "unlockbutton";
            this.unlock_button_value = "Unlock";
            this.unlock_button_type = "button";
            this.unlock_Table = function() { unlockTable(); };
            this.clear_button_id = "clearbutton";
            this.clear_button_value = "Clear matrix";
            this.clear_button_type = "button";
            this.clear_Table = function() { fillTable(document.getElementById(SETTINGS.READONLY.TABLE.table_id)); };
            this.rewind_button_id = "rewindbutton";
            this.rewind_button_value = "Go back";
            this.rewind_button_type = "button";
            this.rewind_Table = function() { undoTable(1); };
            this.randomize_button_id = "randomizebutton";
            this.randomize_button_value = "Randomize";
            this.randomize_button_type = "button";
            this.randomize_Table = function() { randomize_Table(); };
        }
    }
    this.WRITABLE = new function() {
        this.row_value = 2;
        this.column_value = 2;
    }
};

Object.freeze(SETTINGS.READONLY);  // Make the "readonly_settings" object readonly

// Adding an event listener to window with type "load" ensures that the script only begins when the page is fully loaded (with CSS and everything)
window.addEventListener("load", () => {
    initTableGE(SETTINGS.READONLY.TABLE.table_id);

    // Defining the table and adding drag functionality
    let TABLE = document.getElementById(SETTINGS.READONLY.TABLE.table_id);

    //remove anything that's not a cell from the row's list of children when we start dragging
    TABLE.addEventListener("draggingStarted", event => {
        Array.from(event.detail.children).forEach(element => {
            if(element.tagName.toUpperCase() !== "TD"){
                element.remove();
            }   
        });
    })

    //define what the primary row is
    console.log(TABLE.querySelector("tr"));
    //sessionStorage.setItem("primaryRow", TABLE.querySelector("tr").id); // ERROR IS HERE - SESSION STORAGE ITEM IS EMPTY AFTER THIS ASSIGNMENT

    // We select all rows so an event listener can be attached that moves/reattaches the scale field to a target row - we assume that the table is non-empty 
    TABLE.querySelectorAll("tr").forEach(element => element.addEventListener("mouseover", moveInterface));
    // We create a scale field with a target row specified by argument 
    let scale_field = createScaleField("primaryRow", "primaryScaleFactor", TABLE);
    //ROW_OPERATION_MANAGER.primaryScaleField = scale_field;
    sessionStorage.setItem("primaryScaleField", scale_field.id);

    let add_interface = createAddInterface(TABLE);
    //ROW_OPERATION_MANAGER.addButton = add_interface[0];
    sessionStorage.setItem("addButton", add_interface[0].id);

    //TABLE.querySelector("tr").appendChild(ROW_OPERATION_MANAGER.addButton); // Note: The return value of add interface is an array. The 0'th element is the add button
    TABLE.querySelector("tr").appendChild(document.getElementById(sessionStorage.getItem("addButton")));
    TABLE.querySelector("tr").appendChild(document.getElementById(sessionStorage.getItem("primaryScaleField")));
    attachToParent(scale_field, true);

    //lineUpAncestors(add_interface[add_interface.length-1], add_interface.length); // Adds descendents in a linear order starting from the element that is supposed to be the further descendent from the root element.

    //eventListener updates the scale factor whenever the user changes it
    scale_field.addEventListener("change", event => {
    sessionStorage.setItem("primaryScaleFactor", String(event.target.value));
    });
});

