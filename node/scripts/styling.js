'use strict'
/**
 * Loads a CSS style into html page if possible, i.e. if promise can be resolved, otherwise error is thrown. 
 * 
 * Source: https://stackoverflow.com/questions/15505225/inject-css-stylesheet-as-string-using-javascript/63936671#63936671
 * @param {string} src 
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
 * Calls loadStyle to apply style to HTML-page when page is loaded 
 * 
 * To add more CSS styles, simply uncomment a '.then' and provide the path to the file (or add another '.then' if all are used)
 */
// document.onDOMContentLoaded = function() {
//     loadStyle("../styles/simple.css")
//         // .then(() => loadStyle(""))
//         //.then(() => loadStyle("css/icomoon.css"))
//         .then(() => {
//             console.log('All styles are loaded!');
//         }).catch(err => console.error(err));
// };


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

function addSVG() {

    const confirm_button = document.getElementById(sessionStorage.getItem("confirm_button"));
    console.log(sessionStorage.getItem("confirm_button"));

    createSVG("M256 512A256 256 0 1 0 256 0a256 256 0 1 0 0 512zM369 209L241 337c-9.4 9.4-24.6 9.4-33.9 0l-64-64c-9.4-9.4-9.4-24.6 0-33.9s24.6-9.4 33.9 0l47 47L335 175c9.4-9.4 24.6-9.4 33.9 0s9.4 24.6 0 33.9z",
    "0 0 512 512", confirm_button);
}

window.addEventListener("DOMContentLoaded", (event) => {
    loadStyle("../styles/user_interaction.css")
        .then(() => loadStyle("../styles/table.css"))
        .then(() => loadStyle("../styles/body.css"))
        .then(() => {
            console.log('All styles are loaded!');
        }).catch(err => console.error(err));
});

window.addEventListener("load", event => {
    addSVG();
})