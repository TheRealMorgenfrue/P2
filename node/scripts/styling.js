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


window.addEventListener("DOMContentLoaded", (event) => {
    loadStyle("../styles/simple.css")
        // .then(() => loadStyle(""))
        //.then(() => loadStyle("css/icomoon.css"))
        .then(() => {
            console.log('All styles are loaded!');
        }).catch(err => console.error(err));
});