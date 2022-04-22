/**
* bs-fancyindex
*
* @fileoverview Build the template
*
* @author Matthew W. Thomas
* @author https://mattwthomas.com
*
*/

var fs = require('fs');
var path = require('path');
var md = require('markdown-it')()
    .use(require('markdown-it-highlightjs'))
    .use(require('markdown-it-attrs'));
const minify = require('@node-minify/core');
const csso = require('@node-minify/csso');
const uglifyjs = require('@node-minify/uglify-js');
var PurgeCSS = require('purgecss').PurgeCSS;


/*=============================================================================
 UglifyJS Section 
=============================================================================*/

minify({
    compressor: uglifyjs,
    input: './assets/js/script.js',
    output: './dist/assets/script.js',
    callback: function (err, min) { }
});


/*=============================================================================
 CSSO Section 
=============================================================================*/

minify({
    compressor: csso,
    input: './assets/css/*.css',
    output: './dist/assets/style.css',
    callback: afterCSS
});

/*=============================================================================
     Export Markdown to JSON Array and PurgeCSS 
=============================================================================*/

async function afterCSS(err, min) {

    /* Export Markdown to JSON Array 
       ============================= */
    const readmePath = path.normalize('./readme-text/');
    const jsonPath = path.normalize('./dist/assets/readme-text.json');
    var readmeData = {};

    fs.readdir(readmePath, (err, files) => {
        if (err) throw err;
        files.forEach(file => {
            const filePath = path.join(__dirname, readmePath, file);
            const fileName = file.split('.').slice(0, -1).join('.');
            const mdString = fs.readFileSync(filePath, 'utf8');
            const htmlString = md.render(mdString);
            readmeData[`/${fileName}/`] = `${htmlString}<hr>`;
        });
        fs.writeFile(jsonPath, JSON.stringify(readmeData), (err) => { if (err) throw err; });
        purgecssActions(readmeData, min);
    });

    /* PurgeCSS Section 
       ================ */
    /* This depends on the HTML made from markdown. So, it's run in the callback */
    async function purgecssActions(readmeData, min) {
        const stylePath = './dist/assets/style.css';

        /* Make an array of html from markdown that purgeCSS needs */
        htmlArray = Object.values(readmeData).map(html => {
            return {
                raw: html,
                extension: 'html'
            }
        });
        /* add the index */
        htmlArray.push('./index.html');

        /* set config options */
        const purgeCSSResult = new PurgeCSS().purge({
            content: htmlArray,
            css: [{raw: min, extension: 'css'}],
            safelist: ["sb-sidenav-toggled", "active"]
        });

        /* write the output to the dist css file */
        var x = await purgeCSSResult;
        fs.writeFile(stylePath, x[0].css, err => {if (err) throw err;});
    };
};