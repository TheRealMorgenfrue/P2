'use strict'
/**
 * Loads a CSS style into the html page if possible, i.e. if promise can be resolved. Otherwise an error is thrown. 
 * 
 * Source: https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript/63936671#63936671
 * @param {string} src The path to the CSS file.
 * @returns {promise}
 */
function loadStyle(src) {
    return new Promise(function (resolve, reject) {
        let link = document.createElement('link');
        link.href = src;
        link.rel = 'stylesheet';

        link.onload = () => resolve(link);
        link.onerror = () => reject(new Error(`Style load error for ${src}`));

        document.head.append(link);
    });
}
/**
 * Creates a SVG image and attaches it to the supplied parent element.
 * @param {string} path The "schematic" from which to generate the SVG (see MDN SVG "d" attribute for details).
 * @param {string} viewBox The size of the SVG viewport.
 * @param {HTMLElement} parent The element which to attach the SVG to.
 * @returns 
 */
function createSVG(path, viewBox, parent) {
    try {
        if(!path) {
            throw new Error(`Path must not be ${path}.`);
        }
        else if(typeof path !== "string") {
            throw new Error(`Path must be a string, not "${typeof path}".`);
        }
        if(!viewBox) {
            throw new Error(`viewBox must not be ${viewBox}.`);
        }
        else if(typeof viewBox !== "string") {
            throw new Error(`viewBox must be a string, not "${typeof viewBox}".`);
        }
        if(!parent) {
            throw new Error(`Parent must not be ${parent}.`);
        }
    } catch (error) {
        console.error(error);
        return;
    }
    const svg = document.createElementNS("http://www.w3.org/2000/svg", "svg");
    const svgNS = svg.namespaceURI; 
    const path_element = document.createElementNS(svgNS, "path");

    svg.setAttribute("aria-hidden","true");
    svg.setAttribute("viewBox", viewBox);

    path_element.setAttribute("d", path);
    
    svg.appendChild(path_element);
    parent.append(svg);
}
/**
 * Container function that generates all SVG icons for the page
 */
function addSVG() {
    const confirm_button = document.getElementById(sessionStorage.getItem("confirm_button"));

    createSVG("M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z",
    "0 0 512 512", confirm_button);
}

// Loads CSS. To add more CSS styles, simply uncomment a '.then' and provide the path to the file (or add another '.then' if all are used)
window.addEventListener("DOMContentLoaded", (event) => {
    loadStyle("../styles/user_interaction.css")
        .then(() => loadStyle("../styles/table.css"))
        .then(() => loadStyle("../styles/body.css"))
        .then(() => {
            console.log('All styles are loaded!');
        }).catch(err => console.error(err));
});

// Separated icon generation from CSS loading in order to disable selectively
window.addEventListener("load", event => {
    addSVG();
})