'use strict'
import{initTableGE, populateIDs} from "./app_GE.js";
import{initDrag} from "./draganddrop.js";
import{createScaleField, createSafeScaleField, moveInterface, createAddInterface, swapTableRows, resetAddInterface} from "./rowoperations.js";
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
    // Set-up for the table
    const table_container_div = document.createElement("div");
    table_container_div.id = "table_container";
    table_container_div.classList.add("tableContainer");
    document.body.appendChild(table_container_div);

    initTableGE(SETTINGS.READONLY.TABLE.table_id, table_container_div);

    // Defining the table and adding drag functionality
    let TABLE = document.getElementById(SETTINGS.READONLY.TABLE.table_id);

    
    TABLE.addEventListener("draggingStarted", event => {
        //remove anything that's not a cell from the row's list of children when we start dragging
        Array.from(event.detail.children).forEach(element => {
            if(element.tagName.toUpperCase() !== "TD"){
                element.remove();
            }
        });
        //ensures that moveInterface will not place the interface on the dragged row while its being dragged
        event.detail.classList.add("interfaceBlacklist");
    })

    //define what the primary row is
    console.log(TABLE.querySelector("tr"));
    
    //we select all rows so an event listener can be attached that moves/reattaches the scale field to a target row - we assume that the table is non-empty 
    document.addEventListener("GEstarted", event => {
        TABLE.querySelectorAll("tr").forEach(row => {
            row.addEventListener("mouseover", moveInterface);
            row.addEventListener("draggingStopped", swapTableRows);
            sessionStorage.setItem("allowInterfaceMoving", "true");
        });

        //we create a scale field with a target row specified by argument 
        let scale_field = createScaleField("primaryRow", "primaryScaleFactor", TABLE);
        scale_field.style.position = "absolute";    //setting position to absolute to prevent screenspace from being allocated when it becomes a child of something
        sessionStorage.setItem("primaryScaleField", scale_field.id);

        let add_interface = createAddInterface(TABLE);
        //return statement makes an array: [add_button, scale_field, row_holder, go_button]
        add_interface[0].style.position = "absolute";
        sessionStorage.setItem("addButton", add_interface[0].id);

        //placing the addInterface and primary scale field on the first row in the TABLE
        TABLE.querySelector("tr").appendChild(document.getElementById(sessionStorage.getItem("addButton")));
        TABLE.querySelector("tr").appendChild(document.getElementById(sessionStorage.getItem("primaryScaleField")));
        attachToParent(scale_field, true);
        
        //eventListener updates the scale factor whenever the user changes it
        scale_field.addEventListener("change", event => {
            sessionStorage.setItem("primaryScaleFactor", String(event.target.value));
        });
    }, {capture: true});

    document.addEventListener("GEstopped", event =>{
        //removing the interface and clearing the listeners from the table
        document.getElementById(sessionStorage.getItem("primaryScaleField")).remove();
        document.getElementById("add_button_id").remove();
        TABLE.querySelectorAll("tr").forEach(row => {   
            row.removeEventListener("mouseover", moveInterface);
            row.removeEventListener("draggingStopped", swapTableRows);
            //add all listeners that are not automatically deleted to this forEach-loop!
        })
        //resetting the history
        sessionStorage.setItem("tableHistory", JSON.stringify([]));
     })
})
//quick thing to see what's dropped on what
document.addEventListener("draggingStopped", event => console.log(`${event.detail} dropped on ${event.target}`))