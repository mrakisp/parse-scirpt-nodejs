Node js parse script and report
---------------
Parse a project and detect & report modifications in html and excel

INSTALLATION
---------------
npm install cheerio <br />
npm i fs <br />
npm i create-html <br />
npm i async <br />
npm i -s csv-parser <br />
npm i -s csv-writer <br />



HOW TO RUN
---------------
REPORT TYPES <br />
"d" : development <br />
"c" : customer <br />
"f" : full <br />


node parse.js moduleName reportType  <br />
//EXAMPLES:  <br />
//node parse.js claims f //full report (DEV & CUSTOMER) html and csv <br />
//node parse.js claims c //customer report and csv <br />
//node parse.js claims d //dev report without csv <br />